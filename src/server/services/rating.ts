import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { entries, users } from '@/server/db/schema';

export interface RatingFilters {
  from?: string;
  to?: string;
}

export interface RatingRow {
  userId: string;
  userName: string;
  totalPoints: number;
  entryCount: number;
}

export async function getByDepartment(
  departmentId: string,
  filters: RatingFilters = {}
): Promise<RatingRow[]> {
  const rows = await db
    .select({
      userId: entries.userId,
      userName: users.fullName,
      totalPoints: sql<number>`cast(sum(cast(${entries.points} as numeric)) as float)`,
      entryCount: sql<number>`cast(count(${entries.id}) as int)`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.userId, users.id))
    .where(
      and(
        eq(users.departmentId, departmentId),
        eq(users.isActive, true),
        filters.from ? gte(entries.entryDate, filters.from) : undefined,
        filters.to ? lte(entries.entryDate, filters.to) : undefined
      )
    )
    .groupBy(entries.userId, users.fullName)
    .orderBy(desc(sql`sum(cast(${entries.points} as numeric))`));

  return rows.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    totalPoints: Number(row.totalPoints),
    entryCount: Number(row.entryCount),
  }));
}
