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

  // Only the person who booked it or the owner can unbook
  if (book.bookedByUserId !== locals.user.id && book.userId !== locals.user.id) {
    return new Response('Not authorized', { status: 403 });
  }

  book.bookedByUserId = null;
  book.bookingStatus = null;
  book.bookingConfirmed = false;
  book.bookingMovedByUserId = null;
  book.bookingPreviousStatus = null;
  book.bookingStatusUpdatedAt = new Date().toISOString();
  await db.write();

  return new Response(null, {
    status: 200,
    headers: { 'HX-Trigger': 'bookingChanged' },
  });
};
