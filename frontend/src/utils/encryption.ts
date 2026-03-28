// Encryption utilities using Web Crypto API
// Note: This is a client-side implementation for demonstration
// In production, consider using a proper encryption library

// Key derivation iterations
const ITERATIONS = 100000;

// Generate a random encryption key from password
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate random salt
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Generate random IV
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt content using AES-256-GCM
export async function encryptContent(
  content: string,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Convert to base64 for storage
  const encrypted = arrayBufferToBase64(encryptedBuffer);
  const saltBase64 = arrayBufferToBase64(salt);
  const ivBase64 = arrayBufferToBase64(iv);
  
  return {
    encrypted,
    salt: saltBase64,
    iv: ivBase64,
  };
}

// Decrypt content using AES-256-GCM
export async function decryptContent(
  encryptedData: { encrypted: string; salt: string; iv: string },
  password: string
): Promise<string> {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const encrypted = base64ToArrayBuffer(encryptedData.encrypted);
  
  const key = await deriveKey(password, salt);
  
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('解密失败：密码可能不正确');
  }
}

// Generate a random recovery key
export function generateRecoveryKey(): string {
  const array = crypto.getRandomValues(new Uint8Array(32));
  return arrayBufferToBase64(array).replace(/[+/=]/g, '').substring(0, 32);
}

// Helper: ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

// Helper: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  message: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  const messages = [
    '密码太弱',
    '密码强度：弱',
    '密码强度：弱',
    '密码强度：中等',
    '密码强度：中等',
    '密码强度：强',
    '密码强度：非常强',
  ];
  
  return {
    valid: password.length >= 8,
    score,
    message: messages[score],
  };
}

// Check if content is encrypted (simple check)
export function isEncrypted(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return !!(parsed.encrypted && parsed.salt && parsed.iv);
  } catch {
    return false;
  }
}

export default {
  encryptContent,
  decryptContent,
  generateRecoveryKey,
  validatePasswordStrength,
  isEncrypted,
};