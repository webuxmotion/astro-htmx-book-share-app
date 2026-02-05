import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = await getDb();
  const book = db.data.books.find(b => b.id === params.id);

  if (!book) {
    return new Response('Book not found', { status: 404 });
  }

  if (book.userId === locals.user.id) {
    return new Response('You cannot book your own book', { status: 400 });
  }

  if (!book.isAvailable) {
    return new Response('Book is not available', { status: 400 });
  }

  if (book.bookedByUserId) {
    return new Response('Book is already booked', { status: 400 });
  }

  book.bookedByUserId = locals.user.id;
  await db.write();

  return new Response(null, {
    status: 200,
    headers: { 'HX-Trigger': 'bookingChanged' },
  });
};
