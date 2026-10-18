import { Email, EMAIL_STATUSES } from '../models/Email.js';
import { addEmailJob, removeEmailJob } from '../queues/emailQueue.js';
import { logger } from '../utils/logger.js';

export async function createScheduledEmail({ userId, recipient, subject, body, scheduledAt }) {
  const scheduledDate = new Date(scheduledAt);

  // 1. Persist initial email record in MongoDB
  const email = new Email({
    userId,
    recipient,
    subject,
    body,
    scheduledAt: scheduledDate,
    status: EMAIL_STATUSES.SCHEDULED,
  });

  await email.save();

  // 2. Schedule delayed job in BullMQ
  try {
    const job = await addEmailJob(email);
    email.jobId = job.id.toString();
    await email.save();
    return email;
  } catch (err) {
    logger.error(`Failed to enqueue BullMQ job for email [${email._id}]: ${err.message}`);
    // Rollback or mark as failed so it does not remain dangling
    email.status = EMAIL_STATUSES.FAILED;
    email.lastError = `Queue dispatch error: ${err.message}`;
    await email.save();
    throw new Error(`Failed to schedule email in queue: ${err.message}`);
  }
}

export async function getEmailsByUser({ userId, status, page = 1, limit = 10, search = '' }) {
  const query = { userId };

  if (status && Object.values(EMAIL_STATUSES).includes(status)) {
    query.status = status;
  }

  if (search && search.trim().length > 0) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [{ recipient: searchRegex }, { subject: searchRegex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Email.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Email.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
  };
}

export async function getEmailById({ userId, emailId }) {
  const email = await Email.findOne({ _id: emailId, userId });
  if (!email) {
    const error = new Error('Email record not found');
    error.statusCode = 404;
    throw error;
  }
  return email;
}

export async function cancelScheduledEmail({ userId, emailId }) {
  const email = await Email.findOne({ _id: emailId, userId });

  if (!email) {
    const error = new Error('Email not found');
    error.statusCode = 404;
    throw error;
  }

  if (email.status === EMAIL_STATUSES.CANCELLED) {
    return email;
  }

  if (email.status === EMAIL_STATUSES.SENT) {
    const error = new Error('Cannot cancel an email that has already been sent');
    error.statusCode = 400;
    throw error;
  }

  if (email.status === EMAIL_STATUSES.PROCESSING) {
    const error = new Error('Email is currently being processed and cannot be cancelled');
    error.statusCode = 400;
    throw error;
  }

  // Remove delayed job from BullMQ queue
  const jobId = email.jobId || email._id.toString();
  await removeEmailJob(jobId);

  // Update status in MongoDB
  email.status = EMAIL_STATUSES.CANCELLED;
  await email.save();

  logger.info(`Email [${email._id}] cancelled successfully by user [${userId}]`);
  return email;
}

export async function getUserDashboardStats({ userId }) {
  const [total, scheduled, sent, failed, processing, cancelled, recentActivity] = await Promise.all([
    Email.countDocuments({ userId }),
    Email.countDocuments({ userId, status: EMAIL_STATUSES.SCHEDULED }),
    Email.countDocuments({ userId, status: EMAIL_STATUSES.SENT }),
    Email.countDocuments({ userId, status: EMAIL_STATUSES.FAILED }),
    Email.countDocuments({ userId, status: EMAIL_STATUSES.PROCESSING }),
    Email.countDocuments({ userId, status: EMAIL_STATUSES.CANCELLED }),
    Email.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    counts: {
      total,
      scheduled,
      sent,
      failed,
      processing,
      cancelled,
    },
    recentActivity,
  };
}
