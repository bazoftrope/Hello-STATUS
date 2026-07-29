import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...');

  const [department] = await db
    .insert(schema.departments)
    .values({
      name: 'Отдел разработки',
    })
    .returning();

  console.log('Created department:', department.name);

  const managerPasswordHash = await bcrypt.hash('manager123', 12);
  const [manager] = await db
    .insert(schema.users)
    .values({
      email: 'manager@status.app',
      passwordHash: managerPasswordHash,
      fullName: 'Иванов Иван Иванович',
      role: 'manager',
      departmentId: department.id,
    })
    .returning();

  console.log('Created manager:', manager.email);

  const employeePasswordHash = await bcrypt.hash('employee123', 12);
  const [employee] = await db
    .insert(schema.users)
    .values({
      email: 'employee@status.app',
      passwordHash: employeePasswordHash,
      fullName: 'Петров Петр Петрович',
      role: 'employee',
      departmentId: department.id,
    })
    .returning();

  console.log('Created employee:', employee.email);

  const parameters = [
    {
      departmentId: department.id,
      name: 'Подготовка документов',
      description: 'Подготовка и оформление рабочей документации',
      weight: '1.5',
    },
    {
      departmentId: department.id,
      name: 'Код ревью',
      description: 'Проведение код ревью для коллег',
      weight: '2.0',
    },
    {
      departmentId: department.id,
      name: 'Менторство',
      description: 'Помощь и наставничество новым сотрудникам',
      weight: '2.5',
    },
    {
      departmentId: department.id,
      name: 'Исправление багов',
      description: 'Поиск и исправление ошибок в коде',
      weight: '1.0',
    },
    {
      departmentId: department.id,
      name: 'Написание тестов',
      description: 'Создание unit и интеграционных тестов',
      weight: '1.5',
    },
  ];

  for (const param of parameters) {
    const [created] = await db
      .insert(schema.parameters)
      .values(param)
      .returning();
    console.log('Created parameter:', created.name);
  }

  console.log('Seed completed!');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    client.end();
  });
