import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export function getClient() {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL не задан. Добавьте переменную окружения DATABASE_URL с вашей строкой подключения к PostgreSQL.'
    );
  }

  return postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 30,
    max_lifetime: 60 * 30,
  });
}

const client = getClient();

export const db = drizzle(client, { schema });
