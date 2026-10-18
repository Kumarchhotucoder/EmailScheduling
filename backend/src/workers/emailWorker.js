import { Worker } from 'bullmq';
import { QUEUE_NAME } from '../queues/emailQueue.js';
import { redisConnectionOptions } from '../config/redis.js';
import { config } from '../config/env.js';
import { Email, EMAIL_STATUSES } from '../models/Email.js';
import { sendEmail } from '../services/mailerService.js';
import { logger } from '../utils/logger.js';

let workerInstance = null;

export function createEmailWorker() {
  if (workerInstance) {
    return workerInstance;
  }

  const workerOptions = {
    connection: redisConnectionOptions,
    concurrency: config.worker.concurrency,
    limiter: {
      max: config.worker.rateLimitMax,
      duration: config.worker.rateLimitDuration,
    },
  };

  logger.info(
    `Initializing BullMQ Email Worker with concurrency=${config.worker.concurrency}, ` +
    `limiter={max: ${config.worker.rateLimitMax}, duration: ${config.worker.rateLimitDuration}ms}`
  );

  workerInstance = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { emailId } = job.data;
      logger.info(`[Worker] Started processing job [${job.id}] for Email ID [${emailId}] (attempt ${job.attemptsMade + 1})`);

      // 1. Fetch current email state from MongoDB
      const email = await Email.findById(emailId);
      if (!email) {
        logger.warn(`[Worker] Email [${emailId}] not found in database. Discarding job.`);
        return { skipped: true, reason: 'not_found' };
      }

      // 2. Check for cancellation or prior completion
      if (email.status === EMAIL_STATUSES.CANCELLED) {
        logger.info(`[Worker] Email [${emailId}] is marked as CANCELLED. Skipping delivery.`);
        return { skipped: true, reason: 'cancelled' };
      }

      if (email.status === EMAIL_STATUSES.SENT) {
        logger.info(`[Worker] Email [${emailId}] is already SENT. Skipping duplicate execution.`);
        return { skipped: true, reason: 'already_sent' };
      }

      // 3. Atomically transition state to PROCESSING
      const updatedEmail = await Email.findOneAndUpdate(
        {
          _id: emailId,
          status: { $in: [EMAIL_STATUSES.SCHEDULED, EMAIL_STATUSES.QUEUED] },
        },
        {
          $set: { status: EMAIL_STATUSES.PROCESSING },
          $inc: { attempts: 1 },
        },
        { new: true }
      );

      if (!updatedEmail) {
        logger.warn(`[Worker] Email [${emailId}] status could not be transitioned to PROCESSING (current status: ${email.status}). Skipping.`);
        return { skipped: true, reason: 'invalid_state_transition' };
      }

      // 4. Send email via Nodemailer & Ethereal SMTP
      try {
        const sendResult = await sendEmail({
          to: updatedEmail.recipient,
          subject: updatedEmail.subject,
          body: updatedEmail.body,
        });

        // 5. Update database record to SENT
        await Email.findByIdAndUpdate(emailId, {
          $set: {
            status: EMAIL_STATUSES.SENT,
            sentAt: new Date(),
            etherealPreviewUrl: sendResult.previewUrl,
            messageId: sendResult.messageId,
            lastError: null,
          },
        });

        logger.info(`[Worker] Successfully sent email [${emailId}] to ${updatedEmail.recipient}`);
        if (sendResult.previewUrl) {
          logger.info(`[Worker] Ethereal Preview URL: ${sendResult.previewUrl}`);
        }

        return {
          success: true,
          emailId,
          messageId: sendResult.messageId,
          previewUrl: sendResult.previewUrl,
        };
      } catch (err) {
        logger.error(`[Worker] Error sending email [${emailId}]: ${err.message}`);

        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 3);

        await Email.findByIdAndUpdate(emailId, {
          $set: {
            status: isLastAttempt ? EMAIL_STATUSES.FAILED : EMAIL_STATUSES.SCHEDULED,
            failedAt: new Date(),
            lastError: err.message,
          },
        });

        // Rethrow error so BullMQ tracks failed attempt and triggers backoff retry if attempts remain
        throw err;
      }
    },
    workerOptions
  );

  workerInstance.on('completed', (job, result) => {
    logger.info(`[Worker] Job [${job.id}] completed successfully: ${JSON.stringify(result)}`);
  });

  workerInstance.on('failed', (job, err) => {
    logger.error(`[Worker] Job [${job?.id || 'unknown'}] failed: ${err.message}`);
  });

  workerInstance.on('error', (err) => {
    logger.error(`[Worker] Unhandled BullMQ worker error: ${err.message}`);
  });

  return workerInstance;
}
