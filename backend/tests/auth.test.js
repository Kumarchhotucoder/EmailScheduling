import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';

describe('Authentication API Endpoints', () => {
  const sampleUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(sampleUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(sampleUser.email.toLowerCase());
      expect(res.body.data.user.password).toBeUndefined();

      // Ensure user was saved in DB with hashed password
      const dbUser = await User.findOne({ email: sampleUser.email });
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(sampleUser.password);
    });

    it('should reject registration with an invalid email address', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with a password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'shortpass@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with duplicate email with 409 Conflict', async () => {
      await request(app).post('/api/v1/auth/register').send(sampleUser);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(sampleUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in an existing user with correct credentials', async () => {
      await request(app).post('/api/v1/auth/register').send(sampleUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: sampleUser.email,
          password: sampleUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(sampleUser.email);
    });

    it('should reject login with wrong password', async () => {
      await request(app).post('/api/v1/auth/register').send(sampleUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: sampleUser.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user when authenticated with Bearer token', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(sampleUser);
      const token = regRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(sampleUser.email);
    });

    it('should reject unauthorized access without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthorized access with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
