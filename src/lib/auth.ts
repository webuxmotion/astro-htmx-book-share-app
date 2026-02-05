import { hash, compare } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  db.data.sessions.push({
    token,
    userId,
    expiresAt: expiresAt.toISOString(),
  });
  await db.write();

  return { token, expiresAt };
}

export async function validateSession(token: string): Promise<string | null> {
  const db = await getDb();
  const session = db.data.sessions.find(s => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    db.data.sessions = db.data.sessions.filter(s => s.token !== token);
    await db.write();
    return null;
  }
  return session.userId;
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDb();
  db.data.sessions = db.data.sessions.filter(s => s.token !== token);
  await db.write();
}
