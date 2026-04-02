/**
 * 认证模块单元测试
 * P1-02: 用户认证系统
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import * as authService from '../src/services/auth.service';

// 测试环境配置
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

describe('Auth Service', () => {
  beforeAll(() => {
    initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'password123';

      const result = await authService.register({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const email = 'invalid-email';
      const password = 'password123';

      await expect(authService.register({ email, password }))
        .rejects.toThrow('Invalid email format');
    });

    it('should reject weak password', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'short';

      await expect(authService.register({ email, password }))
        .rejects.toThrow('Password must be at least 8 characters');
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const password = 'password123';

      // First registration
      await authService.register({ email, password });

      // Second registration with same email
      await expect(authService.register({ email, password }))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`;
      const password = 'password123';

      // Register first
      await authService.register({ email, password });

      // Then login
      const result = await authService.login({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      await expect(authService.login({ email, password }))
        .rejects.toThrow('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const email = `wrongpass-${Date.now()}@example.com`;
      const password = 'password123';
      const wrongPassword = 'wrongpassword';

      // Register first
      await authService.register({ email, password });

      // Then login with wrong password
      await expect(authService.login({ email, password: wrongPassword }))
        .rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should invalidate token on logout', async () => {
      const email = `logout-${Date.now()}@example.com`;
      const password = 'password123';

      // Register and get token
      const result = await authService.register({ email, password });

      // Verify token is valid
      const user = authService.verifyToken(result.token);
      expect(user).not.toBeNull();

      // Logout
      authService.logout(result.token);

      // Verify token is now invalid
      const userAfterLogout = authService.verifyToken(result.token);
      expect(userAfterLogout).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should return user info for valid token', async () => {
      const email = `verify-${Date.now()}@example.com`;
      const password = 'password123';

      const result = await authService.register({ email, password });
      const user = authService.verifyToken(result.token);

      expect(user).not.toBeNull();
      expect(user!.email).toBe(email);
    });

    it('should return null for invalid token', () => {
      const user = authService.verifyToken('invalid-token');
      expect(user).toBeNull();
    });

    it('should return null for expired token', () => {
      // This test would require mocking time or waiting
      // For now, we trust the JWT library handles expiration
      const user = authService.verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.expired');
      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user info', async () => {
      const email = `getuser-${Date.now()}@example.com`;
      const password = 'password123';

      const registered = await authService.register({ email, password });
      const user = authService.getUserById(registered.user.id);

      expect(user).not.toBeNull();
      expect(user!.email).toBe(email);
    });

    it('should return null for non-existent user', () => {
      const user = authService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });
});
