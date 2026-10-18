import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const redisConnectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis disconnected. Reconnecting in ${delay}ms... (attempt ${times})`);
    return delay;
  },
};

export function createRedisClient() {
  const client = new Redis(redisConnectionOptions);

  client.on('connect', () => {
    logger.info(`Redis connected successfully to ${config.redis.host}:${config.redis.port}`);
  });

  client.on('error', (err) => {
    logger.error(`Redis connection error: ${err.message}`);
  });

  return client;
}
