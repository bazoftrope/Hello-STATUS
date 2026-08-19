import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/server/db';
import { auditLog, parameters, users } from '@/server/db/schema';

export interface AuditFilters {
  from?: string;
  to?: string;
}

export interface AuditEntry {
  id: string;
  createdAt: Date;
  actorName: string;
  entryAuthorName: string;
  parameterName: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}

export async function getByDepartment(
  departmentId: string,
  filters: AuditFilters = {}
): Promise<AuditEntry[]> {
  const rows = await db
    .select({
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      action: auditLog.action,
      oldValue: auditLog.oldValue,
      newValue: auditLog.newValue,
      actorName: users.fullName,
      entryUserId: auditLog.entryUserId,
    })
    .from(auditLog)
    .innerJoin(users, eq(auditLog.actorId, users.id))
    .where(
      and(
        eq(users.departmentId, departmentId),
        filters.from ? gte(auditLog.createdAt, new Date(filters.from + 'T00:00:00')) : undefined,
        filters.to ? lte(auditLog.createdAt, new Date(filters.to + 'T23:59:59')) : undefined
      )
    )
    .orderBy(desc(auditLog.createdAt));

  const authorIds = [...new Set(rows.map((r) => r.entryUserId))];
  const authorMap = new Map<string, string>();

  if (authorIds.length > 0) {
    const authors = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users);
    for (const a of authors) {
      if (authorIds.includes(a.id)) {
        authorMap.set(a.id, a.fullName);
      }
    }
  }

  const paramIds = [
    ...new Set(
      rows
        .map((r) => {
          const parsed = safeParse(r.oldValue);
          return isRecord(parsed) && typeof parsed.parameterId === 'string'
            ? parsed.parameterId
            : null;
        })
        .filter((id): id is string => id !== null)
    ),
  ];
  const paramMap = new Map<string, string>();

  if (paramIds.length > 0) {
    const params = await db
      .select({ id: parameters.id, name: parameters.name })
      .from(parameters);
    for (const p of params) {
      if (paramIds.includes(p.id)) {
        paramMap.set(p.id, p.name);
      }
    }
  }

  return rows.map((row) => {
    const parsedOld = row.oldValue ? safeParse(row.oldValue) : null;
    const parsedNew = row.newValue ? safeParse(row.newValue) : null;

    const parameterId =
      isRecord(parsedOld) && typeof parsedOld.parameterId === 'string'
        ? parsedOld.parameterId
        : null;

    return {
      id: row.id,
      createdAt: row.createdAt,
      actorName: row.actorName,
      entryAuthorName: authorMap.get(row.entryUserId) ?? 'Неизвестный',
      parameterName: parameterId ? (paramMap.get(parameterId) ?? 'Неизвестный') : 'Удалено',
      action: row.action,
      oldValue: isRecord(parsedOld) ? parsedOld : null,
      newValue: isRecord(parsedNew) ? parsedNew : null,
    };
  });
}

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
