import { connectDB, disconnectDB } from './config/db.js';
import { createEmailWorker } from './workers/emailWorker.js';
import { getTransporter } from './services/mailerService.js';
import { reconcilePendingJobs } from './services/recoveryService.js';
import { logger } from './utils/logger.js';

let worker = null;

async function startWorker() {
  try {
    logger.info('====================================================');
    logger.info('Starting Standalone BullMQ Email Worker Service...');
    logger.info('====================================================');

    // 1. Connect to MongoDB persistence
    await connectDB();

    // 2. Initialize Nodemailer / Ethereal SMTP transporter
    await getTransporter();

    // 3. Reconcile database & queue jobs after any previous crash or restart
    await reconcilePendingJobs();

    // 4. Start BullMQ Worker consumer
    worker = createEmailWorker();

    logger.info('BullMQ Email Worker is now active and polling for scheduled jobs.');
  } catch (err) {
    logger.error(`Fatal error starting BullMQ worker: ${err.message}`);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`Worker received ${signal}. Closing BullMQ worker and database connections...`);
  try {
    if (worker) {
      await worker.close();
      logger.info('BullMQ worker closed.');
    }
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error(`Error during graceful worker shutdown: ${err.message}`);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startWorker();
