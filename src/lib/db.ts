import { JSONFilePreset } from 'lowdb/node';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export type BookingStatus = 'booked' | 'in_delivery' | 'delivered' | 'on_the_bookshelf' | 'reading' | 'return_delivery' | 'at_owner_home';

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  description: string;
  isAvailable: boolean;
  bookedByUserId: string | null;
  bookingStatus: BookingStatus | null;
  bookingConfirmed: boolean;
  bookingMovedByUserId: string | null;
  bookingPreviousStatus: BookingStatus | null;
  bookingStatusUpdatedAt: string | null;
  createdAt: string;
}

export interface DbSchema {
  users: User[];
  sessions: Session[];
  books: Book[];
}

const defaultData: DbSchema = {
  users: [],
  sessions: [],
  books: [],
};

let dbInstance: Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>> | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await JSONFilePreset<DbSchema>('db.json', defaultData);
  }
  return dbInstance;
}
