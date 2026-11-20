import {pgTable, uuid, varchar, timestamp, pgEnum} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['USER', 'ORGANIZER','ADMIN']);

// Users table
export const users  = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: roleEnum('role').notNull().default('USER'),

    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})


export type IUser = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;