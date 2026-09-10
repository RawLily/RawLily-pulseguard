import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
  console.error('[Security] ENCRYPTION_KEY not properly configured');
}

export function encrypt(text: string): string {
  try {
    if (!text) return '';
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[Security] Encryption error:', error);
    throw error;
  }
}

export function decrypt(text: string): string {
  try {
    if (!text) return '';
    
    const parts = text.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Security] Decryption error:', error);
    throw error;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const parts = hash.split(':');
    if (parts.length !== 2) {
      resolve(false);
      return;
    }

    const salt = Buffer.from(parts[0], 'hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === parts[1]);
    });
  });
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function corsMiddleware(req: NextRequest, allowedOrigins: string[] = []) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600',
      'Access-Control-Allow-Credentials': 'true'
    }
  });

  return response;
}

export function isValidJWTStructure(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export function isSuspiciousInput(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /(<script|<iframe|javascript:|onerror=|onload=|onclick=)/i,
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
    /(\.\.|\/\/|\\\\)/,
    /(\x00|\x0d|\x0a)/,
    /%27|%22|--|;/  // SQL injection
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
