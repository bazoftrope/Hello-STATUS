import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { parameters } from '@/server/db/schema';
import type { Parameter } from '@/server/db/types';

export interface ParameterDto {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  weight: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParameterInput {
  name: string;
  description?: string | null;
  weight: number;
}

export type ParameterUpdateInput = Partial<ParameterInput> & { isArchived?: boolean };

export async function getByDepartment(
  departmentId: string,
  includeArchived = false
): Promise<ParameterDto[]> {
  const where = includeArchived
    ? eq(parameters.departmentId, departmentId)
    : and(eq(parameters.departmentId, departmentId), eq(parameters.isArchived, false));

  const rows = await db.select().from(parameters).where(where).orderBy(asc(parameters.name));

  return rows.map(toDto);
}

export async function getById(id: string): Promise<ParameterDto | null> {
  const rows = await db.select().from(parameters).where(eq(parameters.id, id)).limit(1);
  return rows.length > 0 ? toDto(rows[0]) : null;
}

export async function create(departmentId: string, input: ParameterInput): Promise<ParameterDto> {
  const [row] = await db
    .insert(parameters)
    .values({
      departmentId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      weight: input.weight.toString(),
    })
    .returning();

  return toDto(row);
}

export async function update(id: string, input: ParameterUpdateInput): Promise<ParameterDto | null> {
  const values: Partial<typeof parameters.$inferInsert> = { updatedAt: new Date() };

  if (input.name !== undefined) values.name = input.name.trim();
  if (input.description !== undefined) values.description = input.description?.trim() || null;
  if (input.weight !== undefined) values.weight = input.weight.toString();
  if (input.isArchived !== undefined) values.isArchived = input.isArchived;

  const [row] = await db.update(parameters).set(values).where(eq(parameters.id, id)).returning();
  return row ? toDto(row) : null;
}

export async function archive(id: string): Promise<ParameterDto | null> {
  return update(id, { isArchived: true });
}

export interface ValidationResult {
  errors: string[];
  values: ParameterInput | null;
}

export function validateCreateInput(body: unknown): ValidationResult {
  const errors: string[] = [];
  const data = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;

  const name = data.name;
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Название параметра обязательно');
  } else if (name.trim().length > 255) {
    errors.push('Название параметра не должно превышать 255 символов');
  }

  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.push('Описание должно быть строкой');
  }

  const weight = parseWeight(data.weight);
  if (weight === null) {
    errors.push('Вес должен быть положительным числом не более 1000');
  }

  if (errors.length > 0) {
    return { errors, values: null };
  }

  return {
    errors,
    values: {
      name: name as string,
      description: (data.description as string | undefined) ?? null,
      weight: weight as number,
    },
  };
}

export function validateUpdateInput(body: unknown): {
  errors: string[];
  values: ParameterUpdateInput | null;
} {
  const errors: string[] = [];
  const data = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const values: ParameterUpdateInput = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Название параметра не может быть пустым');
    } else if (data.name.trim().length > 255) {
      errors.push('Название параметра не должно превышать 255 символов');
    } else {
      values.name = data.name;
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Описание должно быть строкой');
    } else {
      values.description = data.description;
    }
  }

  if (data.weight !== undefined) {
    const weight = parseWeight(data.weight);
    if (weight === null) {
      errors.push('Вес должен быть положительным числом не более 1000');
    } else {
      values.weight = weight;
    }
  }

  if (data.isArchived !== undefined) {
    if (typeof data.isArchived !== 'boolean') {
      errors.push('Поле isArchived должно быть логическим значением');
    } else {
      values.isArchived = data.isArchived;
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

function parseWeight(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 && value <= 1000 ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 && parsed <= 1000 ? parsed : null;
  }
  return null;
}

function toDto(row: Parameter): ParameterDto {
  return {
    id: row.id,
    departmentId: row.departmentId,
    name: row.name,
    description: row.description,
    weight: Number(row.weight),
    isArchived: row.isArchived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
