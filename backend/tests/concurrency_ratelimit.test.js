import { describe, it, expect, afterAll } from 'vitest';
import { Queue, Worker } from 'bullmq';
import { redisConnectionOptions } from '../src/config/redis.js';

describe('Live BullMQ Concurrency & Rate Limiting Enforcement', () => {
  const queuesToClean = [];
  const workersToClose = [];

  afterAll(async () => {
    for (const worker of workersToClose) {
      await worker.close();
    }
    for (const queue of queuesToClean) {
      await queue.drain();
      await queue.clean(0, 1000, 'completed');
      await queue.clean(0, 1000, 'failed');
      await queue.close();
    }
  });

  it('should enforce worker concurrency limit simultaneously under load', async () => {
    const queueName = `test-concurrency-${Date.now()}`;
    const testQueue = new Queue(queueName, { connection: redisConnectionOptions });
    queuesToClean.push(testQueue);

    const CONCURRENCY_LIMIT = 3;
    const TOTAL_JOBS = 6;
    let currentlyActive = 0;
    let maxSimultaneousActive = 0;
    const completedJobIds = [];

    const testWorker = new Worker(
      queueName,
      async (job) => {
        currentlyActive++;
        if (currentlyActive > maxSimultaneousActive) {
          maxSimultaneousActive = currentlyActive;
        }

        // Simulate async I/O work
        await new Promise((resolve) => setTimeout(resolve, 250));

        currentlyActive--;
        completedJobIds.push(job.id);
        return { done: true };
      },
      {
        connection: redisConnectionOptions,
        concurrency: CONCURRENCY_LIMIT,
      }
    );
    workersToClose.push(testWorker);

    // Enqueue 6 jobs at once
    const promises = [];
    for (let i = 1; i <= TOTAL_JOBS; i++) {
      promises.push(testQueue.add(`job-${i}`, { idx: i }));
    }
    await Promise.all(promises);

    // Wait until all 6 jobs complete
    await new Promise((resolve) => {
      testWorker.on('completed', () => {
        if (completedJobIds.length === TOTAL_JOBS) {
          resolve();
        }
      });
    });

    expect(completedJobIds.length).toBe(TOTAL_JOBS);
    // Verified: Maximum active jobs at any instant must NOT exceed CONCURRENCY_LIMIT
    expect(maxSimultaneousActive).toBeLessThanOrEqual(CONCURRENCY_LIMIT);
    expect(maxSimultaneousActive).toBe(CONCURRENCY_LIMIT);
  }, 15000);

  it('should enforce queue rate limiting and throttle excess jobs into subsequent time windows', async () => {
    const queueName = `test-ratelimit-${Date.now()}`;
    const testQueue = new Queue(queueName, { connection: redisConnectionOptions });
    queuesToClean.push(testQueue);

    // Rate limit: Maximum 2 jobs per 1000ms duration
    const RATE_LIMIT_MAX = 2;
    const RATE_LIMIT_DURATION = 1000;
    const startTimestamps = [];

    const testWorker = new Worker(
      queueName,
      async (job) => {
        const now = Date.now();
        startTimestamps.push(now);
        return { jobIndex: job.data.idx, startedAt: now };
      },
      {
        connection: redisConnectionOptions,
        concurrency: 5, // High concurrency to prove rate limiter restricts execution, not concurrency
        limiter: {
          max: RATE_LIMIT_MAX,
          duration: RATE_LIMIT_DURATION,
        },
      }
    );
    workersToClose.push(testWorker);

    // Enqueue 4 jobs simultaneously
    for (let i = 1; i <= 4; i++) {
      await testQueue.add(`rate-job-${i}`, { idx: i });
    }

    // Wait for all 4 jobs to complete
    await new Promise((resolve) => {
      testWorker.on('completed', () => {
        if (startTimestamps.length === 4) {
          resolve();
        }
      });
    });

    expect(startTimestamps.length).toBe(4);

    // Jobs 1 and 2 start immediately in Window 1
    const window1Gap = Math.abs(startTimestamps[1] - startTimestamps[0]);
    expect(window1Gap).toBeLessThan(300); // executed together in window 1

    // Job 3 MUST have been delayed until Window 2 (at least ~900-1000ms after Job 1)
    const window2Delay = startTimestamps[2] - startTimestamps[0];
    expect(window2Delay).toBeGreaterThanOrEqual(850); // Enforces rate limiter delay
  }, 15000);
});
