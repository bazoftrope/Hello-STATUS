import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/server/db';
import { auditLog, entries, parameters, users } from '@/server/db/schema';
import { isFutureISODate, isValidISODate, todayISO } from '@/lib/dates';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class EntryError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface EntryDto {
  id: string;
  userId: string;
  userName: string;
  parameterId: string;
  parameterName: string;
  quantity: number;
  weightSnapshot: number;
  points: number;
  entryDate: string;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntryFilters {
  from?: string;
  to?: string;
}

export interface EntryInput {
  parameterId: string;
  quantity: number;
  entryDate: string;
  comment?: string | null;
}

export interface EntryUpdateInput {
  quantity?: number;
  entryDate?: string;
  comment?: string | null;
}

interface Actor {
  id: string;
  role: 'employee' | 'manager';
  departmentId: string;
}

interface EntryRow {
  id: string;
  userId: string;
  parameterId: string;
  quantity: number;
  weightSnapshot: number;
  points: number;
  entryDate: string;
  comment: string | null;
}

export async function getById(id: string): Promise<EntryDto | null> {
  const rows = await selectEntries(and(eq(entries.id, id)));
  return rows.length > 0 ? rows[0] : null;
}

export async function getByUser(
  userId: string,
  filters: EntryFilters = {}
): Promise<EntryDto[]> {
  return selectEntries(
    and(
      eq(entries.userId, userId),
      filters.from ? gte(entries.entryDate, filters.from) : undefined,
      filters.to ? lte(entries.entryDate, filters.to) : undefined
    )
  );
}

export async function getByDepartment(
  departmentId: string,
  filters: EntryFilters = {}
): Promise<EntryDto[]> {
  const rows = await db
    .select({
      id: entries.id,
      userId: entries.userId,
      userName: users.fullName,
      parameterId: entries.parameterId,
      parameterName: parameters.name,
      quantity: entries.quantity,
      weightSnapshot: entries.weightSnapshot,
      points: entries.points,
      entryDate: entries.entryDate,
      comment: entries.comment,
      createdAt: entries.createdAt,
      updatedAt: entries.updatedAt,
    })
    .from(entries)
    .innerJoin(users, eq(entries.userId, users.id))
    .innerJoin(parameters, eq(entries.parameterId, parameters.id))
    .where(
      and(
        eq(users.departmentId, departmentId),
        filters.from ? gte(entries.entryDate, filters.from) : undefined,
        filters.to ? lte(entries.entryDate, filters.to) : undefined
      )
    )
    .orderBy(desc(entries.entryDate), desc(entries.createdAt));

  return rows.map(toDto);
}

export async function isUserInDepartment(
  userId: string,
  departmentId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.departmentId, departmentId)))
    .limit(1);
  return rows.length > 0;
}

export async function create(userId: string, input: EntryInput): Promise<EntryDto> {
  const [parameter] = await db
    .select()
    .from(parameters)
    .where(eq(parameters.id, input.parameterId))
    .limit(1);

  if (!parameter) {
    throw new EntryError(400, 'Параметр не найден');
  }
  if (parameter.isArchived) {
    throw new EntryError(400, 'Параметр архивирован и недоступен для новых записей');
  }

  const weightSnapshot = Number(parameter.weight);
  const points = input.quantity * weightSnapshot;

  const [row] = await db
    .insert(entries)
    .values({
      userId,
      parameterId: input.parameterId,
      quantity: input.quantity,
      weightSnapshot: weightSnapshot.toString(),
      points: points.toString(),
      entryDate: input.entryDate,
      comment: input.comment?.trim() || null,
    })
    .returning();

  const created = await getById(row.id);
  if (!created) {
    throw new EntryError(500, 'Не удалось создать запись');
  }
  return created;
}

export async function update(
  id: string,
  actor: Actor,
  input: EntryUpdateInput
): Promise<EntryDto> {
  const entry = await getRawById(id);
  if (!entry) {
    throw new EntryError(404, 'Запись не найдена');
  }

  const isAuthor = entry.userId === actor.id;
  if (!isAuthor && !(actor.role === 'manager')) {
    throw new EntryError(403, 'Недостаточно прав');
  }
  if (actor.role === 'manager' && !isAuthor) {
    const allowed = await isUserInDepartment(entry.userId, actor.departmentId);
    if (!allowed) {
      throw new EntryError(404, 'Запись не найдена');
    }
  }
  if (isAuthor && actor.role !== 'manager' && entry.entryDate !== todayISO()) {
    throw new EntryError(403, 'Можно редактировать только записи за текущий день');
  }

  const quantity = input.quantity ?? entry.quantity;
  const entryDate = input.entryDate ?? entry.entryDate;
  const comment =
    input.comment !== undefined ? (input.comment?.trim() || null) : entry.comment;

  if (isFutureISODate(entryDate)) {
    throw new EntryError(400, 'Нельзя указывать дату в будущем');
  }

  const points = quantity * entry.weightSnapshot;

  const isManagerEdit = actor.role === 'manager' && !isAuthor;
  if (isManagerEdit) {
    await writeAudit(actor.id, id, entry.userId, 'update', entry, {
      quantity,
      entryDate,
      comment,
    });
  }

  await db
    .update(entries)
    .set({
      quantity,
      entryDate,
      comment,
      points: points.toString(),
      updatedAt: new Date(),
    })
    .where(eq(entries.id, id));

  const updated = await getById(id);
  if (!updated) {
    throw new EntryError(500, 'Не удалось обновить запись');
  }
  return updated;
}

export async function remove(id: string, actor: Actor): Promise<void> {
  const entry = await getRawById(id);
  if (!entry) {
    throw new EntryError(404, 'Запись не найдена');
  }

  const isAuthor = entry.userId === actor.id;
  if (!isAuthor && !(actor.role === 'manager')) {
    throw new EntryError(403, 'Недостаточно прав');
  }
  if (actor.role === 'manager' && !isAuthor) {
    const allowed = await isUserInDepartment(entry.userId, actor.departmentId);
    if (!allowed) {
      throw new EntryError(404, 'Запись не найдена');
    }
  }
  if (isAuthor && actor.role !== 'manager' && entry.entryDate !== todayISO()) {
    throw new EntryError(403, 'Можно удалять только записи за текущий день');
  }

  if (actor.role === 'manager' && !isAuthor) {
    await writeAudit(actor.id, id, entry.userId, 'delete', entry, null);
  }

  await db.delete(entries).where(eq(entries.id, id));
}

export interface ValidationResult<T> {
  errors: string[];
  values: T | null;
}

export function validateCreateInput(body: unknown): ValidationResult<EntryInput> {
  const errors: string[] = [];
  const data = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >;

  const parameterId = data.parameterId;
  if (typeof parameterId !== 'string' || !UUID_RE.test(parameterId)) {
    errors.push('Некорректный идентификатор параметра');
  }

  const quantity = parseQuantity(data.quantity);
  if (quantity === null) {
    errors.push('Количество должно быть целым числом не менее 1');
  }

  const entryDate = parseEntryDate(data.entryDate);
  if (entryDate === null) {
    errors.push('Дата записи обязательна и не может быть в будущем');
  }

  if (
    data.comment !== undefined &&
    data.comment !== null &&
    typeof data.comment !== 'string'
  ) {
    errors.push('Комментарий должен быть строкой');
  }

  if (errors.length > 0) {
    return { errors, values: null };
  }

  return {
    errors,
    values: {
      parameterId: parameterId as string,
      quantity: quantity as number,
      entryDate: entryDate as string,
      comment: (data.comment as string | undefined) ?? null,
    },
  };
}

export function validateUpdateInput(body: unknown): ValidationResult<EntryUpdateInput> {
  const errors: string[] = [];
  const data = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const values: EntryUpdateInput = {};

  if (data.quantity !== undefined) {
    const quantity = parseQuantity(data.quantity);
    if (quantity === null) {
      errors.push('Количество должно быть целым числом не менее 1');
    } else {
      values.quantity = quantity;
    }
  }

  if (data.entryDate !== undefined) {
    const entryDate = parseEntryDate(data.entryDate);
    if (entryDate === null) {
      errors.push('Некорректная дата записи');
    } else {
      values.entryDate = entryDate;
    }
  }

  if (data.comment !== undefined) {
    if (data.comment !== null && typeof data.comment !== 'string') {
      errors.push('Комментарий должен быть строкой');
    } else {
      values.comment = data.comment;
    }
  }

  if (errors.length > 0) {
    return { errors, values: null };
  }

  if (Object.keys(values).length === 0) {
    return { errors: ['Нет полей для изменения'], values: null };
  }

  return { errors, values };
}

export async function getRawById(id: string): Promise<EntryRow | null> {
  const rows = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    id: row.id,
    userId: row.userId,
    parameterId: row.parameterId,
    quantity: row.quantity,
    weightSnapshot: Number(row.weightSnapshot),
    points: Number(row.points),
    entryDate: row.entryDate,
    comment: row.comment,
  };
}

function selectEntries(where: ReturnType<typeof and>) {
  return db
    .select({
      id: entries.id,
      userId: entries.userId,
      userName: users.fullName,
      parameterId: entries.parameterId,
      parameterName: parameters.name,
      quantity: entries.quantity,
      weightSnapshot: entries.weightSnapshot,
      points: entries.points,
      entryDate: entries.entryDate,
      comment: entries.comment,
      createdAt: entries.createdAt,
      updatedAt: entries.updatedAt,
    })
    .from(entries)
    .innerJoin(users, eq(entries.userId, users.id))
    .innerJoin(parameters, eq(entries.parameterId, parameters.id))
    .where(where)
    .orderBy(desc(entries.entryDate), desc(entries.createdAt))
    .then((rows) => rows.map(toDto));
}

function toDto(row: {
  id: string;
  userId: string;
  userName: string;
  parameterId: string;
  parameterName: string;
  quantity: number;
  weightSnapshot: string;
  points: string;
  entryDate: string;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}): EntryDto {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    parameterId: row.parameterId,
    parameterName: row.parameterName,
    quantity: row.quantity,
    weightSnapshot: Number(row.weightSnapshot),
    points: Number(row.points),
    entryDate: row.entryDate,
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseQuantity(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed >= 1 && parsed <= 100000 ? parsed : null;
}

function parseEntryDate(value: unknown): string | null {
  if (typeof value !== 'string' || !isValidISODate(value)) {
    return null;
  }
  if (isFutureISODate(value)) {
    return null;
  }
  return value;
}

function serializeEntry(entry: EntryRow): string {
  return JSON.stringify({
    userId: entry.userId,
    parameterId: entry.parameterId,
    quantity: entry.quantity,
    entryDate: entry.entryDate,
    comment: entry.comment,
  });
}

async function writeAudit(
  actorId: string,
  entryId: string,
  entryUserId: string,
  action: 'update' | 'delete',
  oldEntry: EntryRow,
  newEntry: { quantity: number; entryDate: string; comment: string | null } | null
): Promise<void> {
  await db.insert(auditLog).values({
    actorId,
    entryId,
    entryUserId,
    action,
    oldValue: serializeEntry(oldEntry),
    newValue: newEntry ? JSON.stringify(newEntry) : null,
  });
}
