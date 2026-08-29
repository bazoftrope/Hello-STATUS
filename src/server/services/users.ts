import { and, asc, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/server/db';
import { departments, users } from '@/server/db/schema';
import type { User } from '@/server/db/types';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: 'employee' | 'manager';
  departmentId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  email: string;
  fullName: string;
  password: string;
}

export interface ValidationResult {
  errors: string[];
  values: RegisterInput | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterInput(body: unknown): ValidationResult {
  const errors: string[] = [];
  const data = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;

  const fullName = data.fullName;
  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    errors.push('Укажите ФИО');
  } else if (fullName.trim().length > 255) {
    errors.push('ФИО не должно превышать 255 символов');
  }

  const email = data.email;
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    errors.push('Укажите корректный email');
  } else if (email.trim().length > 255) {
    errors.push('Email не должен превышать 255 символов');
  }

  const password = data.password;
  if (typeof password !== 'string' || password.length < 6) {
    errors.push('Пароль должен содержать не менее 6 символов');
  } else if (password.length > 72) {
    errors.push('Пароль не должен превышать 72 символа');
  }

  const passwordConfirm = data.passwordConfirm;
  if (typeof password === 'string' && typeof passwordConfirm === 'string' && password !== passwordConfirm) {
    errors.push('Пароли не совпадают');
  }

  if (errors.length > 0) {
    return { errors, values: null };
  }

  return {
    errors,
    values: {
      email: (email as string).trim().toLowerCase(),
      fullName: (fullName as string).trim(),
      password: password as string,
    },
  };
}

export function validateSetActiveInput(body: unknown): { errors: string[]; values: boolean | null } {
  const data = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;

  if (typeof data.isActive !== 'boolean') {
    return { errors: ['Поле isActive должно быть логическим значением'], values: null };
  }

  return { errors: [], values: data.isActive };
}

export async function getDefaultDepartmentId(): Promise<string | null> {
  const rows = await db
    .select({ id: departments.id })
    .from(departments)
    .orderBy(asc(departments.createdAt))
    .limit(1);

  return rows.length > 0 ? rows[0].id : null;
}

export async function register(input: RegisterInput): Promise<UserDto> {
  const departmentId = await getDefaultDepartmentId();
  if (!departmentId) {
    throw new Error('В системе не настроен отдел. Обратитесь к руководителю');
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Пользователь с таким email уже зарегистрирован');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const [row] = await db
      .insert(users)
      .values({
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        role: 'employee',
        departmentId,
        isActive: false,
      })
      .returning();

    return toDto(row);
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      throw new Error('Пользователь с таким email уже зарегистрирован');
    }
    throw err;
  }
}

export async function getByDepartment(departmentId: string): Promise<UserDto[]> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.departmentId, departmentId))
    .orderBy(asc(users.createdAt));

  return rows.map(toDto);
}

export async function setActive(
  userId: string,
  isActive: boolean,
  departmentId: string
): Promise<UserDto | null> {
  const existing = await db
    .select({ id: users.id, departmentId: users.departmentId })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.departmentId, departmentId)))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const [row] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return row ? toDto(row) : null;
}

function toDto(row: User): UserDto {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    departmentId: row.departmentId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
