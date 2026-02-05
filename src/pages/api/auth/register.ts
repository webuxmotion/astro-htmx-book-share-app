import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { hashPassword, createSession } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const username = formData.get('username')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!username || !email || !password) {
    return new Response('<p class="error">All fields are required.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (password.length < 6) {
    return new Response('<p class="error">Password must be at least 6 characters.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const db = await getDb();

  if (db.data.users.find(u => u.email === email)) {
    return new Response('<p class="error">Email already registered.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (db.data.users.find(u => u.username === username)) {
    return new Response('<p class="error">Username already taken.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: uuidv4(),
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.data.users.push(user);
  await db.write();

  const { token, expiresAt } = await createSession(user.id);

  cookies.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    expires: expiresAt,
    path: '/',
  });

  return new Response(null, {
    status: 200,
    headers: { 'HX-Redirect': '/' },
  });
};
