import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { User, RegisterDTO, LoginDTO, AuthResponse } from '../models/user';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // Access token expires in 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token expires in 7 days

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 */
function isValidPassword(password: string): boolean {
  // 至少 8 位
  return password.length >= 8;
}

/**
 * 用户注册
 */
export async function register(dto: RegisterDTO): Promise<AuthResponse> {
  const db = getDb();

  // 验证邮箱
  if (!isValidEmail(dto.email)) {
    throw new Error('Invalid email format');
  }

  // 验证密码强度
  if (!isValidPassword(dto.password)) {
    throw new Error('Password must be at least 8 characters');
  }

  // 检查邮箱是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(dto.email.toLowerCase());
  if (existing) {
    throw new Error('Email already registered');
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const id = uuidv4();
  const now = Date.now();

  // 插入用户
  db.prepare(`
    INSERT INTO users (id, email, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, dto.email.toLowerCase(), passwordHash, now, now);

  // 生成 token
  const token = generateToken(id, dto.email);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // 保存 session
  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), id, token, expiresAt, now);

  return {
    user: {
      id,
      email: dto.email,
    },
    token,
    expiresAt,
  };
}

/**
 * 用户登录
 */
export async function login(dto: LoginDTO): Promise<AuthResponse> {
  const db = getDb();

  // 查找用户
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(dto.email.toLowerCase()) as User | undefined;
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // 验证密码
  const validPassword = await bcrypt.compare(dto.password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid email or password');
  }

  // 生成 token
  const token = generateToken(user.id, user.email);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // 保存 session
  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), user.id, token, expiresAt, Date.now());

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    token,
    expiresAt,
  };
}

/**
 * 用户登出
 */
export function logout(token: string): void {
  const db = getDb();
  // 从 sessions 表中删除 token
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/**
 * 验证 token 并获取用户信息
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    // 检查 session 是否存在且未过期
    const db = getDb();
    const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?').get(token, Date.now());
    
    if (!session) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 获取当前用户信息
 */
export function getUserById(userId: string): User | null {
  const db = getDb();
  const user = db.prepare('SELECT id, email, created_at, updated_at FROM users WHERE id = ?').get(userId) as User | undefined;
  return user || null;
}

/**
 * 清理过期 sessions
 */
export function cleanupExpiredSessions(): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}

/**
 * 生成 JWT token
 */
function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export default {
  register,
  login,
  logout,
  verifyToken,
  getUserById,
  cleanupExpiredSessions,
};
