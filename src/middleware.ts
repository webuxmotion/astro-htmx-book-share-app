import { defineMiddleware } from 'astro:middleware';
import { validateSession } from './lib/auth';
import { getDb } from './lib/db';

const PROTECTED_ROUTES = ['/books/my', '/books/booked', '/books/add', '/books/edit', '/dashboard'];

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionToken = context.cookies.get('session')?.value;

  if (sessionToken) {
    const userId = await validateSession(sessionToken);
    if (userId) {
      const db = await getDb();
      const user = db.data.users.find(u => u.id === userId);
      if (user) {
        context.locals.user = {
          id: user.id,
          username: user.username,
          email: user.email,
        };
      }
    } else {
      context.cookies.delete('session', { path: '/' });
    }
  }

  const isProtected = PROTECTED_ROUTES.some(route =>
    context.url.pathname.startsWith(route)
  );

  if (isProtected && !context.locals.user) {
    return context.redirect('/login');
  }

  return next();
});
