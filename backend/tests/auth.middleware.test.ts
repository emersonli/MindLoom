/**
 * Auth Middleware 单元测试
 * P3-01: 后端单元测试 - Middleware 模块
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import * as authService from '../src/services/auth.service';

const JWT_SECRET = 'test-secret-key-for-unit-tests';

// 模拟 Express Request/Response
function createMockRequest(overrides?: any) {
  return {
    headers: {},
    user: undefined,
    ...overrides,
  };
}

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
}

function createMockNext() {
  const next = jest.fn();
  return next;
}

describe('Auth Middleware', () => {
  let testUserId: string;
  let validToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    initDatabase();
    
    // 创建测试用户并获取 token
    testUserId = uuidv4();
    const testEmail = `middleware-test-${Date.now()}@example.com`;
    
    const db = getDb();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, testEmail, 'hash', Date.now(), Date.now());
    
    // 生成有效 token
    validToken = jwt.sign({ userId: testUserId, email: testEmail }, JWT_SECRET, { expiresIn: '15m' });
    
    // 保存 session
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), testUserId, validToken, Date.now() + 15 * 60 * 1000, Date.now());
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('authMiddleware', () => {
    it('should reject request without authorization header', () => {
      const { authMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      authMiddleware(req as any, res as any, next);
      
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Authorization header required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', () => {
      const { authMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest({
        headers: {
          authorization: 'InvalidFormat',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      authMiddleware(req as any, res as any, next);
      
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Invalid authorization format. Use: Bearer <token>' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with non-Bearer scheme', () => {
      const { authMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest({
        headers: {
          authorization: 'Basic some-token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      authMiddleware(req as any, res as any, next);
      
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Invalid authorization format. Use: Bearer <token>' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      const { authMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      authMiddleware(req as any, res as any, next);
      
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', () => {
      const { authMiddleware } = require('../src/middleware/auth.middleware');
      
      // 生成过期 token
      const expiredToken = jwt.sign(
        { userId: testUserId, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: '-1h' } // 已过期
      );
      
      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      authMiddleware(req as any, res as any, next);
      
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid token and attach user to request', () => {
      const { authMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      authMiddleware(req as any, res as any, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe(testUserId);
    });

    it('should reject token that exists in JWT but not in sessions table', () => {
      const { authMiddleware } = require('../src/middleware/auth.middleware');
      
      // 生成有效 JWT 但未在 sessions 表中注册的 token
      const orphanToken = jwt.sign(
        { userId: uuidv4(), email: 'orphan@example.com' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      
      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${orphanToken}`,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      authMiddleware(req as any, res as any, next);
      
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should call next without error when no authorization header', () => {
      const { optionalAuthMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      optionalAuthMiddleware(req as any, res as any, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should attach user when valid token is provided', () => {
      const { optionalAuthMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      optionalAuthMiddleware(req as any, res as any, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe(testUserId);
    });

    it('should call next without error when invalid token is provided', () => {
      const { optionalAuthMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      optionalAuthMiddleware(req as any, res as any, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should handle malformed authorization header gracefully', () => {
      const { optionalAuthMiddleware } = require('../src/middleware/auth.middleware');
      
      const req = createMockRequest({
        headers: {
          authorization: 'Malformed',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      optionalAuthMiddleware(req as any, res as any, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
