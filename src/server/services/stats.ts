import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { entries, parameters, users } from '@/server/db/schema';

export interface StatsFilters {
  from?: string;
  to?: string;
}

export interface DailyStat {
  date: string;
  points: number;
  entryCount: number;
}

export interface ParameterStat {
  parameterId: string;
  parameterName: string;
  totalPoints: number;
  totalQuantity: number;
  entryCount: number;
}

export interface PersonalStats {
  daily: DailyStat[];
  byParameter: ParameterStat[];
  totalPoints: number;
  totalEntries: number;
}

export interface DepartmentUserStat {
  userId: string;
  userName: string;
  totalPoints: number;
  entryCount: number;
}

export interface DepartmentStats {
  users: DepartmentUserStat[];
  byParameter: ParameterStat[];
  totalPoints: number;
  totalEntries: number;
}

export async function getPersonalStats(
  userId: string,
  filters: StatsFilters = {}
): Promise<PersonalStats> {
  const [daily, byParameter, totals] = await Promise.all([
    getDailyStats(userId, filters),
    getParameterStats(userId, filters),
    getTotals(userId, filters),
  ]);

  return {
    daily,
    byParameter,
    totalPoints: totals.totalPoints,
    totalEntries: totals.totalEntries,
  };
}

export async function getDepartmentStats(
  departmentId: string,
  filters: StatsFilters = {}
): Promise<DepartmentStats> {
  const [usersStats, byParameter, totals] = await Promise.all([
    getDepartmentUserStats(departmentId, filters),
    getDepartmentParameterStats(departmentId, filters),
    getDepartmentTotals(departmentId, filters),
  ]);

  return {
    users: usersStats,
    byParameter,
    totalPoints: totals.totalPoints,
    totalEntries: totals.totalEntries,
  };
}

async function getDailyStats(
  userId: string,
  filters: StatsFilters
): Promise<DailyStat[]> {
  const rows = await db
    .select({
      date: entries.entryDate,
      points: sql<number>`cast(sum(cast(${entries.points} as numeric)) as float)`,
      entryCount: sql<number>`cast(count(${entries.id}) as int)`,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        filters.from ? gte(entries.entryDate, filters.from) : undefined,
        filters.to ? lte(entries.entryDate, filters.to) : undefined
      )
    )
    .groupBy(entries.entryDate)
    .orderBy(entries.entryDate);

  return rows.map((row) => ({
    date: row.date,
    points: Number(row.points),
    entryCount: Number(row.entryCount),
  }));
}

async function getParameterStats(
  userId: string,
  filters: StatsFilters
): Promise<ParameterStat[]> {
  const rows = await db
    .select({
      parameterId: entries.parameterId,
      parameterName: parameters.name,
      totalPoints: sql<number>`cast(sum(cast(${entries.points} as numeric)) as float)`,
      totalQuantity: sql<number>`cast(sum(${entries.quantity}) as int)`,
      entryCount: sql<number>`cast(count(${entries.id}) as int)`,
    })
    .from(entries)
    .innerJoin(parameters, eq(entries.parameterId, parameters.id))
    .where(
      and(
        eq(entries.userId, userId),
        filters.from ? gte(entries.entryDate, filters.from) : undefined,
        filters.to ? lte(entries.entryDate, filters.to) : undefined
      )
    )
    .groupBy(entries.parameterId, parameters.name)
    .orderBy(desc(sql`sum(cast(${entries.points} as numeric))`));

  return rows.map((row) => ({
    parameterId: row.parameterId,
    parameterName: row.parameterName,
    totalPoints: Number(row.totalPoints),
    totalQuantity: Number(row.totalQuantity),
    entryCount: Number(row.entryCount),
  }));
}

async function getTotals(
  userId: string,
  filters: StatsFilters
): Promise<{ totalPoints: number; totalEntries: number }> {
  const [row] = await db
    .select({
      totalPoints: sql<number>`cast(coalesce(sum(cast(${entries.points} as numeric)), 0) as float)`,
      totalEntries: sql<number>`cast(coalesce(count(${entries.id}), 0) as int)`,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        filters.from ? gte(entries.entryDate, filters.from) : undefined,
        filters.to ? lte(entries.entryDate, filters.to) : undefined
      )
    );

  return {
    totalPoints: Number(row?.totalPoints ?? 0),
    totalEntries: Number(row?.totalEntries ?? 0),
  };
}

async function getDepartmentUserStats(
  departmentId: string,
  filters: StatsFilters
): Promise<DepartmentUserStat[]> {
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

async function getDepartmentParameterStats(
  departmentId: string,
  filters: StatsFilters
): Promise<ParameterStat[]> {
  const rows = await db
    .select({
      parameterId: entries.parameterId,
      parameterName: parameters.name,
      totalPoints: sql<number>`cast(sum(cast(${entries.points} as numeric)) as float)`,
      totalQuantity: sql<number>`cast(sum(${entries.quantity}) as int)`,
      entryCount: sql<number>`cast(count(${entries.id}) as int)`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.userId, users.id))
    .innerJoin(parameters, eq(entries.parameterId, parameters.id))
    .where(
      and(
        eq(users.departmentId, departmentId),
        eq(users.isActive, true),
        filters.from ? gte(entries.entryDate, filters.from) : undefined,
        filters.to ? lte(entries.entryDate, filters.to) : undefined
      )
    )
    .groupBy(entries.parameterId, parameters.name)
    .orderBy(desc(sql`sum(cast(${entries.points} as numeric))`));

  return rows.map((row) => ({
    parameterId: row.parameterId,
    parameterName: row.parameterName,
    totalPoints: Number(row.totalPoints),
    totalQuantity: Number(row.totalQuantity),
    entryCount: Number(row.entryCount),
  }));
}

async function getDepartmentTotals(
  departmentId: string,
  filters: StatsFilters
): Promise<{ totalPoints: number; totalEntries: number }> {
  const [row] = await db
    .select({
      totalPoints: sql<number>`cast(coalesce(sum(cast(${entries.points} as numeric)), 0) as float)`,
      totalEntries: sql<number>`cast(coalesce(count(${entries.id}), 0) as int)`,
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
    );

  return {
    totalPoints: Number(row?.totalPoints ?? 0),
    totalEntries: Number(row?.totalEntries ?? 0),
  };
}
