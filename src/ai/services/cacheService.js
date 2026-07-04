// Simple in-memory and local storage caching layer for AI queries

const CACHE_PREFIX = 'resume_craft_ai_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

const getHash = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

export const cacheService = {
  get: (prompt, params = {}) => {
    try {
      const key = CACHE_PREFIX + getHash(prompt + JSON.stringify(params));
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { value, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (e) {
      console.error("Cache read error:", e);
      return null;
    }
  },

  set: (prompt, value, params = {}) => {
    try {
      const key = CACHE_PREFIX + getHash(prompt + JSON.stringify(params));
      const cacheData = {
        value,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (e) {
      console.error("Cache write error:", e);
    }
  },

  clear: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Cache clear error:", e);
    }
  }
};
