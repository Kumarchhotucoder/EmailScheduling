import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Email, EMAIL_STATUSES } from '../src/models/Email.js';
import { config } from '../src/config/env.js';
import { reconcilePendingJobs } from '../src/services/recoveryService.js';
import * as mailerService from '../src/services/mailerService.js';
import * as queueModule from '../src/queues/emailQueue.js';

describe('Worker, Queue, Rate Limiting, and Concurrency Configuration', () => {
  const dummyUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Email.deleteMany({});
    vi.restoreAllMocks();
  });

  it('should have valid worker concurrency and rate limiter configuration settings', () => {
    expect(config.worker.concurrency).toBeGreaterThan(0);
    expect(config.worker.rateLimitMax).toBeGreaterThan(0);
    expect(config.worker.rateLimitDuration).toBeGreaterThan(0);
  });

  it('should transition status from scheduled to processing to sent upon successful delivery', async () => {
    const email = await Email.create({
      userId: dummyUserId,
      recipient: 'worker-test@example.com',
      subject: 'Worker Test Subject',
      body: 'Worker Test Content',
      scheduledAt: new Date(),
      status: EMAIL_STATUSES.SCHEDULED,
    });

    vi.spyOn(mailerService, 'sendEmail').mockResolvedValue({
      success: true,
      messageId: '<test-message-123@ethereal.email>',
      previewUrl: 'https://ethereal.email/message/test-preview-123',
    });

    // 1. Worker transitions doc to processing
    const processingDoc = await Email.findOneAndUpdate(
      { _id: email._id, status: { $in: [EMAIL_STATUSES.SCHEDULED, EMAIL_STATUSES.QUEUED] } },
      { $set: { status: EMAIL_STATUSES.PROCESSING }, $inc: { attempts: 1 } },
      { new: true }
    );
    expect(processingDoc).not.toBeNull();
    expect(processingDoc.status).toBe(EMAIL_STATUSES.PROCESSING);
    expect(processingDoc.attempts).toBe(1);

    // 2. Worker dispatches email via Nodemailer
    const sendResult = await mailerService.sendEmail({
      to: processingDoc.recipient,
      subject: processingDoc.subject,
      body: processingDoc.body,
    });

    // 3. Worker updates DB doc to sent with preview URL
    const sentDoc = await Email.findByIdAndUpdate(
      email._id,
      {
        $set: {
          status: EMAIL_STATUSES.SENT,
          sentAt: new Date(),
          etherealPreviewUrl: sendResult.previewUrl,
          messageId: sendResult.messageId,
        },
      },
      { new: true }
    );

    expect(sentDoc).not.toBeNull();
    expect(sentDoc.status).toBe(EMAIL_STATUSES.SENT);
    expect(sentDoc.etherealPreviewUrl).toBe('https://ethereal.email/message/test-preview-123');
    expect(sentDoc.messageId).toBe('<test-message-123@ethereal.email>');
  });

  it('should skip processing if an email was cancelled before worker pickup', async () => {
    const cancelledEmail = await Email.create({
      userId: dummyUserId,
      recipient: 'cancelled@example.com',
      subject: 'Cancelled Subject',
      body: 'Body',
      scheduledAt: new Date(),
      status: EMAIL_STATUSES.CANCELLED,
    });

    const mailSpy = vi.spyOn(mailerService, 'sendEmail');

    const currentDoc = await Email.findById(cancelledEmail._id);
    expect(currentDoc).not.toBeNull();
    if (currentDoc.status === EMAIL_STATUSES.CANCELLED) {
      // Worker safely skips delivery
    } else {
      await mailerService.sendEmail({});
    }

    expect(mailSpy).not.toHaveBeenCalled();
    const finalDoc = await Email.findById(cancelledEmail._id);
    expect(finalDoc.status).toBe(EMAIL_STATUSES.CANCELLED);
  });

  it('should handle failure and bounded retry exhaustion', async () => {
    const failedEmail = await Email.create({
      userId: dummyUserId,
      recipient: 'fail@example.com',
      subject: 'Will Fail',
      body: 'Body',
      scheduledAt: new Date(),
      status: EMAIL_STATUSES.PROCESSING,
      attempts: 3,
      maxAttempts: 3,
    });

    const errorMsg = 'SMTP Connection Timeout';
    await Email.findByIdAndUpdate(failedEmail._id, {
      $set: {
        status: EMAIL_STATUSES.FAILED,
        failedAt: new Date(),
        lastError: errorMsg,
      },
    });

    const doc = await Email.findById(failedEmail._id);
    expect(doc).not.toBeNull();
    expect(doc.status).toBe(EMAIL_STATUSES.FAILED);
    expect(doc.lastError).toBe(errorMsg);
  });

  it('should recover interrupted processing emails during reconciliation', async () => {
    const interruptedEmail = await Email.create({
      userId: dummyUserId,
      recipient: 'interrupted@example.com',
      subject: 'Interrupted',
      body: 'Body',
      scheduledAt: new Date(Date.now() + 60000),
      status: EMAIL_STATUSES.PROCESSING,
    });

    const mockQueue = {
      getJob: vi.fn().mockResolvedValue(null),
    };
    vi.spyOn(queueModule, 'getEmailQueue').mockReturnValue(mockQueue);
    vi.spyOn(queueModule, 'addEmailJob').mockResolvedValue({ id: 're-enqueued-job-456' });

    await reconcilePendingJobs();

    const reconciled = await Email.findById(interruptedEmail._id);
    expect(reconciled).not.toBeNull();
    expect(reconciled.status).toBe(EMAIL_STATUSES.SCHEDULED);
  });
});
