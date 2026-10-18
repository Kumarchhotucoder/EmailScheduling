import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const QUEUE_NAME = 'email-queue';

let queueInstance = null;

export function getEmailQueue() {
  if (!queueInstance) {
    queueInstance = new Queue(QUEUE_NAME, {
      connection: redisConnectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 5000,
        },
        removeOnFail: {
          age: 86400 * 7, // Keep failed jobs for 7 days
          count: 5000,
        },
      },
    });

    queueInstance.on('error', (err) => {
      logger.error(`BullMQ Queue Error: ${err.message}`);
    });
  }

  return queueInstance;
}

export async function addEmailJob(emailDoc) {
  const queue = getEmailQueue();
  const scheduledTime = new Date(emailDoc.scheduledAt).getTime();
  const now = Date.now();
  const delay = Math.max(0, scheduledTime - now);
  const jobId = emailDoc._id.toString();

  const job = await queue.add(
    'send-scheduled-email',
    {
      emailId: emailDoc._id.toString(),
      userId: emailDoc.userId.toString(),
      recipient: emailDoc.recipient,
      subject: emailDoc.subject,
    },
    {
      jobId,
      delay,
    }
  );

  logger.info(`Scheduled BullMQ job [${job.id}] for email [${emailDoc._id}] with delay of ${delay}ms`);
  return job;
}

export async function removeEmailJob(jobId) {
  const queue = getEmailQueue();
  try {
    const job = await queue.getJob(jobId);
    if (job) {
      // If it's already active, it cannot be removed
      const state = await job.getState();
      if (state === 'active') {
        throw new Error('Email job is currently being processed and cannot be cancelled');
      }
      await job.remove();
      logger.info(`Removed BullMQ job [${jobId}] from queue in state [${state}]`);
      return true;
    }
    logger.warn(`BullMQ job [${jobId}] not found in queue (may have already run or expired)`);
    return false;
  } catch (err) {
    logger.error(`Failed to remove BullMQ job [${jobId}]: ${err.message}`);
    throw err;
  }
}

export async function getQueueMetrics() {
  const queue = getEmailQueue();
  const [waiting, delayed, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getDelayedCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return {
    waiting,
    delayed,
    active,
    completed,
    failed,
    total: waiting + delayed + active + completed + failed,
  };
}
