const Redis = require('ioredis');

// Simple resilient Redis helper: falls back to in-memory store if REDIS_URL is not provided.
let client = null;
let useMemory = false;
const memoryStore = new Map();

if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL);
  client.on('error', (err) => console.error('Redis error:', err));
} else {
  useMemory = true;
}

const set = async (key, value, ttlSeconds) => {
  if (useMemory) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    memoryStore.set(key, { value, expiresAt });
    // schedule cleanup
    setTimeout(() => memoryStore.delete(key), ttlSeconds * 1000 + 1000);
    return true;
  }
  if (!client) return false;
  return client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

const get = async (key) => {
  if (useMemory) {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }
  if (!client) return null;
  const raw = await client.get(key);
  return raw ? JSON.parse(raw) : null;
};

const del = async (key) => {
  if (useMemory) {
    return memoryStore.delete(key);
  }
  if (!client) return 0;
  return client.del(key);
};

module.exports = { set, get, del };
