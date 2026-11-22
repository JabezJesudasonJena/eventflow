import {
    integer,
    text,
    timestamp,
    uuid,
    varchar
} from 'drizzle-orm/pg-core';

import {users} from './user.js';
import {events } from './events.js';

import {pgTable, pgEnum} from 'drizzle-orm/pg-core';

export const ticketStatusEnum = pgEnum('ticket-status', [
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'CANCELLED'
]);

export const tickets = pgTable('tickets', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('eventId')
        .notNull()
        .references(() => events.id),
    userId: uuid('userId')
        .notNull()
        .references(() => users.id),
    quantity: integer('quantity').default(1).notNull(),
    totalPrice: integer('total_price').notNull(),
    status: ticketStatusEnum('status').notNull().default('PENDING').notNull(),
    ticketCode: varchar('ticket_code', { length: 20 }).notNull().unique(),
    purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;