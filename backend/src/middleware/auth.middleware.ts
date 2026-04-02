import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * 认证中间件
 * 验证 JWT token 并将用户信息注入 request
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
    return;
  }

  const token = parts[1];
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // 注入用户信息到 request
  req.user = user;
  next();
}

/**
 * 可选认证中间件
 * 如果 token 存在则验证，不存在则继续（用于公开但可个性化的接口）
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  const token = parts[1];
  const user = verifyToken(token);

  if (user) {
    req.user = user;
  }

  next();
}

export default {
  authMiddleware,
  optionalAuthMiddleware,
};
