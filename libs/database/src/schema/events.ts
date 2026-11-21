import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    text,
    integer,
    pgEnum,
} from 'drizzle-orm/pg-core';

import {users} from "./user.js"

export const evnetStatusEnum = pgEnum('event-status',[
    'DRAFT',
    'PUBLISHED',
    'CANCELLED',
]);

export const events = pgTable('events', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    date: timestamp('date').notNull().notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    capacity: integer('capacity').notNull(),
    price: integer('price').default(0).notNull(),
    status: evnetStatusEnum('status').notNull().default('DRAFT'),
    organizerId: uuid('organizerId')
        .notNull()
        .references(() => users.id),
    
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});


export type IEvent = typeof events.$inferSelect;