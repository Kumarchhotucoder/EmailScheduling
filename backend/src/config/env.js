import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['JWT_SECRET'];

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Use a default for dev if not provided, but warn
  console.warn(`[WARN] Missing environment variables: ${missing.join(', ')}. Using development defaults.`);
}

let redisHost = process.env.REDIS_HOST || 'localhost';
let redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
let redisPassword = process.env.REDIS_PASSWORD || undefined;
let redisTls = process.env.REDIS_TLS === 'true' ? {} : undefined;

if (process.env.REDIS_URL) {
  try {
    const parsed = new URL(process.env.REDIS_URL);
    redisHost = parsed.hostname;
    redisPort = parseInt(parsed.port || '6379', 10);
    redisPassword = parsed.password ? decodeURIComponent(parsed.password) : undefined;
    if (parsed.protocol === 'rediss:') {
      redisTls = {};
    }
  } catch (e) {
    console.error('Failed to parse REDIS_URL:', e.message);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/email_scheduler',
  redis: {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    tls: redisTls,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_super_secret_jwt_key_at_least_32_chars_long',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  ethereal: {
    host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.ETHEREAL_PORT || '587', 10),
    user: process.env.ETHEREAL_USER || '',
    pass: process.env.ETHEREAL_PASS || '',
  },
  emailFrom: process.env.EMAIL_FROM || 'Email Scheduler <no-reply@scheduler.local>',
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    rateLimitMax: parseInt(process.env.EMAIL_RATE_LIMIT_MAX || '10', 10),
    rateLimitDuration: parseInt(process.env.EMAIL_RATE_LIMIT_DURATION || '10000', 10),
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
