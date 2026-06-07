const env = require('../../../../config/env');
const appConfig = require('../../../../config/appConfig');

function parseDurationToMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const input = String(value || '').trim();
  const match = input.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

function getCookieBaseOptions() {
  return {
    httpOnly: true,
    secure: appConfig.auth.cookieSecure,
    sameSite: appConfig.auth.cookieSameSite,
    path: '/',
  };
}

function getAccessCookieOptions() {
  return {
    ...getCookieBaseOptions(),
    maxAge: parseDurationToMs(appConfig.jwt.expiresIn),
  };
}

function getRefreshCookieOptions() {
  return {
    ...getCookieBaseOptions(),
    maxAge: Number(appConfig.auth.refreshTtlSeconds || 60 * 60 * 24 * 30) * 1000,
  };
}

module.exports = {
  parseDurationToMs,
  getAccessCookieOptions,
  getRefreshCookieOptions,
};