import { Email, EMAIL_STATUSES } from '../models/Email.js';
import { getEmailQueue, addEmailJob } from '../queues/emailQueue.js';
import { logger } from '../utils/logger.js';

export async function reconcilePendingJobs() {
  logger.info('[RecoveryService] Running database-queue reconciliation check...');
  const queue = getEmailQueue();

  try {
    // 1. Recover interrupted 'processing' emails after unexpected crash/restart
    const interruptedEmails = await Email.find({ status: EMAIL_STATUSES.PROCESSING });
    if (interruptedEmails.length > 0) {
      logger.warn(`[RecoveryService] Found ${interruptedEmails.length} emails stuck in 'processing' state.`);
      for (const email of interruptedEmails) {
        const job = await queue.getJob(email._id.toString());
        if (!job) {
          // Job not found in queue; reset status to scheduled to permit re-dispatch
          logger.info(`[RecoveryService] Re-enqueuing interrupted email [${email._id}]`);
          await addEmailJob(email);
          email.status = EMAIL_STATUSES.SCHEDULED;
          await email.save();
        }
      }
    }

    // 2. Reconcile 'scheduled' emails in DB with Redis jobs
    const now = new Date();
    const scheduledEmails = await Email.find({
      status: EMAIL_STATUSES.SCHEDULED,
      scheduledAt: { $gte: new Date(now.getTime() - 60000) }, // Future or recent past
    });

    let reEnqueuedCount = 0;
    for (const email of scheduledEmails) {
      const job = await queue.getJob(email._id.toString());
      if (!job) {
        logger.info(`[RecoveryService] Restoring missing queue job for scheduled email [${email._id}]`);
        await addEmailJob(email);
        reEnqueuedCount++;
      }
    }

    logger.info(`[RecoveryService] Reconciliation completed. Re-enqueued ${reEnqueuedCount} missing jobs.`);
  } catch (err) {
    logger.error(`[RecoveryService] Reconciliation error: ${err.message}`);
  }
}
