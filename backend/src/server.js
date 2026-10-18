import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { reconcilePendingJobs } from './services/recoveryService.js';
import { logger } from './utils/logger.js';

let server = null;

async function startServer() {
  try {
    logger.info(`Starting Email Scheduling System API in [${config.nodeEnv}] mode...`);

    // Connect to persistent MongoDB
    await connectDB();

    // Reconcile pending / delayed queue jobs with DB
    await reconcilePendingJobs();

    // Start BullMQ Worker in same service process (allows single-service deployment on Render)
    if (process.env.START_WORKER !== 'false') {
      createEmailWorker();
      logger.info('BullMQ Email Worker started inside server process.');
    }

    // Start Express HTTP server
    server = app.listen(config.port, () => {
      logger.info(`API Server running successfully on port ${config.port}`);
      logger.info(`Health check available at http://localhost:${config.port}/health`);
      logger.info(`Auth endpoints at http://localhost:${config.port}/api/v1/auth`);
      logger.info(`Email endpoints at http://localhost:${config.port}/api/v1/emails`);
    });
  } catch (err) {
    logger.error(`Fatal error during server startup: ${err.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
