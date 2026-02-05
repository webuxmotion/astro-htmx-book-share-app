import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
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

  const db = await getDb();
  const book = {
    id: uuidv4(),
    userId: locals.user.id,
    title,
    author,
    description,
    isAvailable,
    createdAt: new Date().toISOString(),
  };

  db.data.books.push(book);
  await db.write();

  return new Response(null, {
    status: 200,
    headers: { 'HX-Redirect': '/books/my' },
  });
};
