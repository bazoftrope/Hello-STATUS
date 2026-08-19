import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['employee', 'manager']);

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: roleEnum('role').default('employee').notNull(),
  departmentId: uuid('department_id')
    .references(() => departments.id)
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const parameters = pgTable('parameters', {
  id: uuid('id').defaultRandom().primaryKey(),
  departmentId: uuid('department_id')
    .references(() => departments.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  weight: decimal('weight', { precision: 10, scale: 2 }).default('1.00').notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const entries = pgTable('entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  parameterId: uuid('parameter_id')
    .references(() => parameters.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  weightSnapshot: decimal('weight_snapshot', { precision: 10, scale: 2 }).notNull(),
  points: decimal('points', { precision: 10, scale: 2 }).notNull(),
  entryDate: date('entry_date').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id')
    .references(() => users.id)
    .notNull(),
  entryId: uuid('entry_id').notNull(),
  entryUserId: uuid('entry_user_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  parameters: many(parameters),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  entries: many(entries),
  auditLogs: many(auditLog),
}));

export const parametersRelations = relations(parameters, ({ one, many }) => ({
  department: one(departments, {
    fields: [parameters.departmentId],
    references: [departments.id],
  }),
  entries: many(entries),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
  parameter: one(parameters, {
    fields: [entries.parameterId],
    references: [parameters.id],
  }),
  auditLogs: many(auditLog),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(users, {
    fields: [auditLog.actorId],
    references: [users.id],
  }),
  entry: one(entries, {
    fields: [auditLog.entryId],
    references: [entries.id],
  }),
}));
