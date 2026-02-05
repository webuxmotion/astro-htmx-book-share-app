import type { BookingStatus } from '../../lib/db';

export type Role = 'owner' | 'reader';

export const STATUSES: BookingStatus[] = [
  'booked',
  'in_delivery',
  'delivered',
  'on_the_bookshelf',
  'reading',
  'return_delivery',
  'at_owner_home',
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  booked: 'Booked',
  in_delivery: 'In Delivery',
  delivered: 'Delivered',
  on_the_bookshelf: 'On the Bookshelf',
  reading: 'Reading',
  return_delivery: 'Return Delivery',
  at_owner_home: 'At Owner Home',
};

export function getStatusIndex(status: BookingStatus): number {
  return STATUSES.indexOf(status);
}

export function isValidStatus(status: string): status is BookingStatus {
  return STATUSES.includes(status as BookingStatus);
}

export function getUserRole(userId: string, bookOwnerId: string, bookReaderId: string | null): Role | null {
  if (userId === bookOwnerId) return 'owner';
  if (userId === bookReaderId) return 'reader';
  return null;
}
