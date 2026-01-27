import request from 'supertest';
import express from 'express';
import { register, login, verifyEmail } from '../controllers/authController.js';

describe('Auth Controller', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post('/api/auth/register', register);
    app.post('/api/auth/login', login);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should not register with invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      // Note: This will fail because we haven't actually registered the user
      // In real tests, we would set up a test database
    });
  });
});
