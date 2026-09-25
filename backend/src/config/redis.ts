import Redis from 'ioredis';
import { ENV } from './env.js';

class InMemoryCache {
  private store: Map<string, { value: string; expiresAt: number | null }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

const memCache = new InMemoryCache();
let redisClient: Redis | null = null;
let isRealRedisConnected = false;

if (ENV.REDIS_URL && !ENV.REDIS_URL.includes('localhost:6379')) {
  try {
    redisClient = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
      connectTimeout: 2000,
    });

    redisClient.on('connect', () => {
      isRealRedisConnected = true;
      console.log('✅ Redis connected.');
    });

    redisClient.on('error', () => {
      isRealRedisConnected = false;
    });

    redisClient.on('close', () => {
      isRealRedisConnected = false;
    });
  } catch {
    redisClient = null;
  }
}

export class SafeCache {
  static async get(key: string): Promise<string | null> {
    if (isRealRedisConnected && redisClient) {
      try {
        return await redisClient.get(key);
      } catch {
        // Fall back to memory
      }
    }
    return memCache.get(key);
  }

  static async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    if (isRealRedisConnected && redisClient) {
      try {
        if (mode === 'EX' && duration) {
          await redisClient.set(key, value, 'EX', duration);
        } else {
          await redisClient.set(key, value);
        }
      } catch {
        // Fall back to memory
      }
    }
    return memCache.set(key, value, mode, duration);
  }

  static async del(key: string): Promise<number> {
    if (isRealRedisConnected && redisClient) {
      try {
        return await redisClient.del(key);
      } catch {
        // Fall back to memory
      }
    }
    return memCache.del(key);
  }
}

export const getCache = () => SafeCache;

export const getRedisStatus = () => {
  return {
    isRealRedis: Boolean(redisClient),
    isConnected: isRealRedisConnected,
    mode: isRealRedisConnected ? 'connected-cluster' : 'fallback-in-memory-cache',
  };
};
