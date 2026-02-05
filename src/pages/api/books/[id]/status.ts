import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import type { BookingStatus } from '../../../../lib/db';
import {
  getUserRole,
  isValidStatus,
} from '../../../../modules/kanban/booking-rules';

export const POST: APIRoute = async ({ params, locals, request }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = await getDb();
  const book = db.data.books.find(b => b.id === params.id);

  if (!book) {
    return new Response('Book not found', { status: 404 });
  }

  if (!book.bookedByUserId || !book.bookingStatus) {
    return new Response('Book has no active booking', { status: 400 });
  }

  const role = getUserRole(locals.user.id, book.userId, book.bookedByUserId);
  if (!role) {
    return new Response('Not authorized', { status: 403 });
  }

  const formData = await request.formData();
  const action = formData.get('action') as string;

  if (action === 'move') {
    const targetStatus = formData.get('status') as string;

    if (!targetStatus || !isValidStatus(targetStatus)) {
      return new Response('Invalid status', { status: 400 });
    }

    // Anyone can move to any column, even if not yet confirmed
    book.bookingPreviousStatus = book.bookingStatus;
    book.bookingStatus = targetStatus as BookingStatus;
    book.bookingConfirmed = false;
    book.bookingMovedByUserId = locals.user.id;
    book.bookingStatusUpdatedAt = new Date().toISOString();

    await db.write();

    return new Response(null, {
      status: 200,
      headers: { 'HX-Trigger': 'boardChanged, bookingChanged' },
    });
  }

  if (action === 'confirm') {
    if (book.bookingConfirmed) {
      return new Response('Already confirmed', { status: 400 });
    }

    // Only the OTHER person (not the one who moved) can confirm
    if (book.bookingMovedByUserId === locals.user.id) {
      return new Response('You cannot confirm your own move', { status: 403 });
    }

    book.bookingConfirmed = true;
    book.bookingMovedByUserId = null;
    book.bookingPreviousStatus = null;
    book.bookingStatusUpdatedAt = new Date().toISOString();

    // If confirmed at terminal state, complete the booking
    if (book.bookingStatus === 'at_owner_home') {
      book.bookedByUserId = null;
      book.bookingStatus = null;
      book.bookingConfirmed = false;
      book.bookingMovedByUserId = null;
      book.bookingPreviousStatus = null;
    }

    await db.write();

    return new Response(null, {
      status: 200,
      headers: { 'HX-Trigger': 'boardChanged, bookingChanged' },
    });
  }

  if (action === 'decline') {
    if (book.bookingConfirmed) {
      return new Response('Cannot decline — already confirmed', { status: 400 });
    }

    // Only the OTHER person can decline
    if (book.bookingMovedByUserId === locals.user.id) {
      return new Response('You cannot decline your own move', { status: 403 });
    }

    // Decline reverts to previous status
    book.bookingStatus = book.bookingPreviousStatus ?? 'booked';
    book.bookingConfirmed = true;
    book.bookingMovedByUserId = null;
    book.bookingPreviousStatus = null;
    book.bookingStatusUpdatedAt = new Date().toISOString();
    await db.write();

    return new Response(null, {
      status: 200,
      headers: { 'HX-Trigger': 'boardChanged, bookingChanged' },
    });
  }

  return new Response('Invalid action', { status: 400 });
};
