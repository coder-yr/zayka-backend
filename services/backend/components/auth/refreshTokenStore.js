const { createHash, randomBytes, randomUUID } = require('crypto');
const redis = require('../../lib/redisClient');
const ApiError = require('../../../../src/utils/ApiError');

const REFRESH_TTL_SECONDS = parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || String(60 * 60 * 24 * 30), 10);

const SESSION_PREFIX = 'auth:session:';
const TOKEN_PREFIX = 'auth:refresh:';
const USER_SESSIONS_PREFIX = 'auth:user-sessions:';

function nowEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}

function hashRefreshToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

function sessionKey(sessionId) {
  return `${SESSION_PREFIX}${sessionId}`;
}

function refreshTokenKey(tokenHash) {
  return `${TOKEN_PREFIX}${tokenHash}`;
}

function userSessionsKey(userId) {
  return `${USER_SESSIONS_PREFIX}${userId}`;
}

function getRemainingTtl(expiryEpochSeconds) {
  return Math.max(1, Number(expiryEpochSeconds || 0) - nowEpochSeconds());
}

async function addUserSessionIndex(userId, sessionId, expiresAt) {
  const key = userSessionsKey(userId);
  const existing = (await redis.get(key)) || { sessionIds: [] };
  const sessionIds = Array.isArray(existing.sessionIds) ? existing.sessionIds : [];
  const updated = [...new Set([...sessionIds, sessionId])];
  await redis.set(key, { sessionIds: updated }, getRemainingTtl(expiresAt));
}

async function removeUserSessionIndex(userId, sessionId, expiresAt) {
  const key = userSessionsKey(userId);
  const existing = (await redis.get(key)) || { sessionIds: [] };
  const sessionIds = Array.isArray(existing.sessionIds) ? existing.sessionIds : [];
  const updated = sessionIds.filter((id) => String(id) !== String(sessionId));
  if (updated.length === 0) {
    await redis.del(key);
    return;
  }
  await redis.set(key, { sessionIds: updated }, getRemainingTtl(expiresAt));
}

async function getSession(sessionId) {
  if (!sessionId) return null;
  return redis.get(sessionKey(sessionId));
}

async function getTokenRecordByRawToken(rawRefreshToken) {
  if (!rawRefreshToken) return null;
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const tokenRecord = await redis.get(refreshTokenKey(tokenHash));
  return tokenRecord ? { tokenHash, tokenRecord } : null;
}

async function resolveRefreshTokenContext(rawRefreshToken) {
  if (!rawRefreshToken) {
    throw new ApiError(401, 'Refresh token missing', 'AUTH_REFRESH_MISSING');
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const tokenRecord = await redis.get(refreshTokenKey(tokenHash));
  if (!tokenRecord) {
    throw new ApiError(401, 'Invalid or expired refresh token', 'AUTH_REFRESH_INVALID');
  }

  const session = await redis.get(sessionKey(tokenRecord.sessionId));
  if (!session || session.status !== 'active') {
    throw new ApiError(401, 'Session is invalid or expired', 'AUTH_SESSION_INVALID');
  }

  if (Number(session.expiresAt || 0) <= nowEpochSeconds()) {
    await invalidateSession(tokenRecord.sessionId, 'session_expired');
    throw new ApiError(401, 'Session has expired', 'AUTH_SESSION_EXPIRED');
  }

  return {
    rawRefreshToken,
    tokenHash,
    tokenRecord,
    session,
  };
}

async function issueRefreshSession(userId, meta = {}) {
  const now = nowEpochSeconds();
  const expiresAt = now + REFRESH_TTL_SECONDS;
  const sessionId = randomUUID();
  const refreshToken = randomBytes(64).toString('hex');
  const tokenHash = hashRefreshToken(refreshToken);

  const session = {
    id: sessionId,
    userId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    expiresAt,
    lastSeenAt: now,
    userAgent: meta.userAgent || null,
    ipAddress: meta.ipAddress || null,
    rotationCount: 0,
    currentTokenHash: tokenHash,
  };

  const tokenRecord = {
    tokenHash,
    userId,
    sessionId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    expiresAt,
    parentTokenHash: null,
    replacedByTokenHash: null,
    userAgent: meta.userAgent || null,
    ipAddress: meta.ipAddress || null,
  };

  await redis.set(sessionKey(sessionId), session, REFRESH_TTL_SECONDS);
  await redis.set(refreshTokenKey(tokenHash), tokenRecord, REFRESH_TTL_SECONDS);
  await addUserSessionIndex(userId, sessionId, expiresAt);

  return {
    refreshToken,
    session,
  };
}

async function rotateRefreshToken(rawRefreshToken, meta = {}, providedContext = null) {
  const context = providedContext || (await resolveRefreshTokenContext(rawRefreshToken));
  const now = nowEpochSeconds();

  if (context.tokenRecord.status !== 'active') {
    await invalidateSession(context.session.id, 'refresh_token_reuse_detected');
    throw new ApiError(401, 'Refresh token reuse detected', 'AUTH_REFRESH_REUSE');
  }

  if (context.session.currentTokenHash !== context.tokenHash) {
    await invalidateSession(context.session.id, 'refresh_token_replay_detected');
    throw new ApiError(401, 'Refresh token replay detected', 'AUTH_REFRESH_REPLAY');
  }

  const remainingTtl = getRemainingTtl(context.session.expiresAt);
  if (remainingTtl <= 1) {
    await invalidateSession(context.session.id, 'session_expired');
    throw new ApiError(401, 'Session has expired', 'AUTH_SESSION_EXPIRED');
  }

  const newRefreshToken = randomBytes(64).toString('hex');
  const newTokenHash = hashRefreshToken(newRefreshToken);

  const rotatedTokenRecord = {
    ...context.tokenRecord,
    status: 'rotated',
    updatedAt: now,
    rotatedAt: now,
    replacedByTokenHash: newTokenHash,
  };

  const newTokenRecord = {
    tokenHash: newTokenHash,
    userId: context.session.userId,
    sessionId: context.session.id,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    expiresAt: context.session.expiresAt,
    parentTokenHash: context.tokenHash,
    replacedByTokenHash: null,
    userAgent: meta.userAgent || context.session.userAgent || null,
    ipAddress: meta.ipAddress || context.session.ipAddress || null,
  };

  const updatedSession = {
    ...context.session,
    updatedAt: now,
    lastSeenAt: now,
    userAgent: meta.userAgent || context.session.userAgent || null,
    ipAddress: meta.ipAddress || context.session.ipAddress || null,
    rotationCount: Number(context.session.rotationCount || 0) + 1,
    currentTokenHash: newTokenHash,
  };

  await redis.set(refreshTokenKey(context.tokenHash), rotatedTokenRecord, remainingTtl);
  await redis.set(refreshTokenKey(newTokenHash), newTokenRecord, remainingTtl);
  await redis.set(sessionKey(context.session.id), updatedSession, remainingTtl);

  return {
    refreshToken: newRefreshToken,
    session: updatedSession,
  };
}

async function invalidateSession(sessionId, reason = 'manual_invalidation') {
  const session = await getSession(sessionId);
  if (!session) return false;

  const now = nowEpochSeconds();
  const remainingTtl = getRemainingTtl(session.expiresAt);
  const invalidatedSession = {
    ...session,
    status: 'revoked',
    updatedAt: now,
    invalidatedAt: now,
    invalidationReason: reason,
  };

  await redis.set(sessionKey(sessionId), invalidatedSession, remainingTtl);

  if (session.currentTokenHash) {
    const key = refreshTokenKey(session.currentTokenHash);
    const tokenRecord = await redis.get(key);
    if (tokenRecord) {
      await redis.set(
        key,
        {
          ...tokenRecord,
          status: 'revoked',
          updatedAt: now,
          revokedAt: now,
          revokedReason: reason,
        },
        remainingTtl
      );
    }
  }

  await removeUserSessionIndex(session.userId, sessionId, session.expiresAt);
  return true;
}

async function revokeByRefreshToken(rawRefreshToken, reason = 'logout') {
  const tokenContext = await getTokenRecordByRawToken(rawRefreshToken);
  if (!tokenContext || !tokenContext.tokenRecord) return false;

  return invalidateSession(tokenContext.tokenRecord.sessionId, reason);
}

async function invalidateAllUserSessions(userId, reason = 'global_logout') {
  const key = userSessionsKey(userId);
  const existing = (await redis.get(key)) || { sessionIds: [] };
  const sessionIds = Array.isArray(existing.sessionIds) ? existing.sessionIds : [];

  await Promise.all(sessionIds.map((sessionId) => invalidateSession(sessionId, reason)));
  await redis.del(key);
  return sessionIds.length;
}

async function isSessionActive(sessionId) {
  const session = await getSession(sessionId);
  if (!session) return false;
  return session.status === 'active' && Number(session.expiresAt || 0) > nowEpochSeconds();
}

module.exports = {
  hashRefreshToken,
  resolveRefreshTokenContext,
  issueRefreshSession,
  rotateRefreshToken,
  invalidateSession,
  revokeByRefreshToken,
  invalidateAllUserSessions,
  isSessionActive,
};