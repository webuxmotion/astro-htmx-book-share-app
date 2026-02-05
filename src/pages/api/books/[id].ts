import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = await getDb();
  const bookIndex = db.data.books.findIndex(
    b => b.id === params.id && b.userId === locals.user!.id
  );

  if (bookIndex === -1) {
    return new Response('<p class="error">Book not found.</p>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const formData = await request.formData();
  const title = formData.get('title')?.toString().trim();
  const author = formData.get('author')?.toString().trim();
  const description = formData.get('description')?.toString().trim() ?? '';
  const isAvailable = formData.get('isAvailable') === 'on';

  if (!title || !author) {
    return new Response('<p class="error">Title and Author are required.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  db.data.books[bookIndex] = {
    ...db.data.books[bookIndex],
    title,
    author,
    description,
    isAvailable,
  };
  await db.write();

  return new Response(null, {
    status: 200,
    headers: { 'HX-Redirect': '/books/my' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = await getDb();
  const bookIndex = db.data.books.findIndex(
    b => b.id === params.id && b.userId === locals.user!.id
  );

  if (bookIndex === -1) {
    return new Response('Not found', { status: 404 });
  }

  db.data.books.splice(bookIndex, 1);
  await db.write();

  return new Response('', { status: 200 });
};
