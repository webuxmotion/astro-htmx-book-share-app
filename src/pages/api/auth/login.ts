import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { verifyPassword, createSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return new Response('<p class="error">All fields are required.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const db = await getDb();
  const user = db.data.users.find(u => u.email === email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return new Response('<p class="error">Invalid email or password.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

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
