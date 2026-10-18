import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Email, EMAIL_STATUSES } from '../src/models/Email.js';

// Mock BullMQ queue calls to isolate API logic
vi.mock('../src/queues/emailQueue.js', () => ({
  QUEUE_NAME: 'email-queue',
  getEmailQueue: vi.fn(),
  addEmailJob: vi.fn().mockResolvedValue({ id: 'mock_bullmq_job_123' }),
  removeEmailJob: vi.fn().mockResolvedValue(true),
  getQueueMetrics: vi.fn().mockResolvedValue({ waiting: 0, delayed: 1, active: 0, completed: 0, failed: 0 }),
}));

describe('Email Scheduling API Endpoints', () => {
  let userTokenA;
  let userIdA;
  let userTokenB;
  let userIdB;

  beforeEach(async () => {
    await User.deleteMany({});
    await Email.deleteMany({});

    // Create User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'Password123!',
    });
    userTokenA = resA.body.data.token;
    userIdA = resA.body.data.user.id;

    // Create User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123!',
    });
    userTokenB = resB.body.data.token;
    userIdB = resB.body.data.user.id;
  });

  describe('POST /api/v1/emails/schedule', () => {
    it('should schedule an email for a future date and time', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

      const res = await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          recipient: 'client@example.com',
          subject: 'Project Kickoff Meeting',
          body: 'Looking forward to our scheduled kickoff call.',
          scheduledAt: futureDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(EMAIL_STATUSES.SCHEDULED);
      expect(res.body.data.recipient).toBe('client@example.com');
      expect(res.body.data.jobId).toBe('mock_bullmq_job_123');
      expect(res.body.data.userId).toBe(userIdA);
    });

    it('should reject email scheduling with past timestamp', async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago

      const res = await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          recipient: 'client@example.com',
          subject: 'Past Reminder',
          body: 'This should be rejected.',
          scheduledAt: pastDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should reject email scheduling with invalid recipient email format', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          recipient: 'not-an-email',
          subject: 'Invalid Email',
          body: 'Body content',
          scheduledAt: futureDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject email scheduling with empty body or empty subject', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          recipient: 'valid@example.com',
          subject: '',
          body: '',
          scheduledAt: futureDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('User Isolation and Scoping (GET /api/v1/emails)', () => {
    it('should list only emails belonging to the authenticated user', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

      // User A schedules an email
      await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          recipient: 'recipient-a@example.com',
          subject: 'Email for User A',
          body: 'Body A',
          scheduledAt: futureDate,
        });

      // User B schedules an email
      await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          recipient: 'recipient-b@example.com',
          subject: 'Email for User B',
          body: 'Body B',
          scheduledAt: futureDate,
        });

      // Request as User A
      const resA = await request(app)
        .get('/api/v1/emails')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].recipient).toBe('recipient-a@example.com');

      // Request as User B
      const resB = await request(app)
        .get('/api/v1/emails')
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.length).toBe(1);
      expect(resB.body.data[0].recipient).toBe('recipient-b@example.com');
    });

    it('should prevent User A from retrieving details of User B email', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

      const createRes = await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          recipient: 'user-b-secret@example.com',
          subject: 'Confidential',
          body: 'Secret data',
          scheduledAt: futureDate,
        });

      const emailIdB = createRes.body.data._id;

      // User A tries to view User B's email
      const res = await request(app)
        .get(`/api/v1/emails/${emailIdB}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/emails/:id/cancel', () => {
    it('should successfully cancel an eligible scheduled email', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

      const createRes = await request(app)
        .post('/api/v1/emails/schedule')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          recipient: 'cancel-me@example.com',
          subject: 'Subject to cancel',
          body: 'Body',
          scheduledAt: futureDate,
        });

      const emailId = createRes.body.data._id;

      const cancelRes = await request(app)
        .delete(`/api/v1/emails/${emailId}/cancel`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe(EMAIL_STATUSES.CANCELLED);

      // Verify DB record
      const dbEmail = await Email.findById(emailId);
      expect(dbEmail.status).toBe(EMAIL_STATUSES.CANCELLED);
    });

    it('should reject cancellation of an already sent email', async () => {
      // Create email directly in DB marked as sent
      const sentEmail = await Email.create({
        userId: userIdA,
        recipient: 'sent@example.com',
        subject: 'Already Sent',
        body: 'Content',
        scheduledAt: new Date(),
        status: EMAIL_STATUSES.SENT,
        sentAt: new Date(),
      });

      const res = await request(app)
        .delete(`/api/v1/emails/${sentEmail._id}/cancel`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already been sent');
    });
  });

  describe('GET /api/v1/emails/stats', () => {
    it('should return accurate dashboard statistics for authenticated user', async () => {
      const now = new Date();

      await Email.create([
        {
          userId: userIdA,
          recipient: 'stat1@example.com',
          subject: 'Scheduled 1',
          body: 'body',
          scheduledAt: new Date(now.getTime() + 10000),
          status: EMAIL_STATUSES.SCHEDULED,
        },
        {
          userId: userIdA,
          recipient: 'stat2@example.com',
          subject: 'Sent 1',
          body: 'body',
          scheduledAt: now,
          status: EMAIL_STATUSES.SENT,
          sentAt: now,
        },
        {
          userId: userIdA,
          recipient: 'stat3@example.com',
          subject: 'Failed 1',
          body: 'body',
          scheduledAt: now,
          status: EMAIL_STATUSES.FAILED,
          failedAt: now,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/emails/stats')
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.counts.total).toBe(3);
      expect(res.body.data.counts.scheduled).toBe(1);
      expect(res.body.data.counts.sent).toBe(1);
      expect(res.body.data.counts.failed).toBe(1);
      expect(res.body.data.recentActivity.length).toBe(3);
    });
  });
});
