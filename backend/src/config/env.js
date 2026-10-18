import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['JWT_SECRET'];

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Use a default for dev if not provided, but warn
  console.warn(`[WARN] Missing environment variables: ${missing.join(', ')}. Using development defaults.`);
}

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/email_scheduler',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
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
