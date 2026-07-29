import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  departments,
  users,
  parameters,
  entries,
  auditLog,
} from './schema';

export type Department = InferSelectModel<typeof departments>;
export type NewDepartment = InferInsertModel<typeof departments>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Parameter = InferSelectModel<typeof parameters>;
export type NewParameter = InferInsertModel<typeof parameters>;

export type Entry = InferSelectModel<typeof entries>;
export type NewEntry = InferInsertModel<typeof entries>;

export type AuditLogEntry = InferSelectModel<typeof auditLog>;
export type NewAuditLogEntry = InferInsertModel<typeof auditLog>;
