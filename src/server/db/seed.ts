import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...');

  await db.delete(schema.auditLog);
  await db.delete(schema.entries);
  await db.delete(schema.parameters);
  await db.delete(schema.users);
  await db.delete(schema.departments);

  const [department] = await db
    .insert(schema.departments)
    .values({
      name: 'Юридический отдел',
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
      name: 'Концессия',
      weight: '7',
      description:
        'Анализ концессионного проекта на соответствие федеральному и региональному законодательству, требованиям основных условий финансирования КС, вопросы, связанные с исполнением КС.',
    },
    {
      name: 'Реструктуризация',
      weight: '5',
      description:
        'Анализ сделки о реструктуризации в рамках урегулирования проблемной задолженности / заключение новой сделки с клиентом, находящимся в красной/черной зоне проблемности в целях урегулирования проблемной задолженности. Вес критерия от 3 до 7, определяется по объему выполненной работы, объем предоставляется руководителю на верификацию.',
    },
    {
      name: 'Корпоративный контроль',
      weight: '5',
      description:
        'Анализ инструментов корпоративного контроля/механизма участия Банка в органах управления заемщика (не в соответствии с перечнем ключевых вопросов, утвержденных ВНД Банка) либо сделки с инструментами корпоративного контроля, содержащей опционы.',
    },
    {
      name: 'Банкротство',
      weight: '4',
      description:
        'Анализ последствий введения процедуры банкротства в отношении контрагента Банка – участника сделки.',
    },
    {
      name: 'Корпоративный конфликт',
      weight: '3',
      description:
        'Анализ относящихся к сделке претензий третьих лиц/корпоративного конфликта, сведений об уголовном преследовании бенефициаров/членов органов управления, привлечения к субсидиарной ответственности.',
    },
    {
      name: 'Иностранный элемент',
      weight: '2',
      description:
        'Анализ иностранного элемента в сделке (контрагент Банка – нерезидент, финансируемый/гарантируемый контракт, сделка с Банком подчиняется иностранному праву).',
    },
    {
      name: 'Указы Президента РФ',
      weight: '4',
      description:
        'Анализ сделки/цепочки сделок владения прав на доли/акции/недвижимое имущество продавца/покупателя, в которых присутствует иностранный элемент, и сделка прямо или косвенно подпадает под регулирование Указов Президента РФ по недружественным странам.',
    },
    {
      name: 'Перевод долга',
      weight: '5',
      description:
        'Сделки по переводу долга, замене застройщика, включение в структуру сделки нового застройщика.',
    },
    {
      name: 'Гос/мун земля',
      weight: '3',
      description:
        'Анализ прав на земельный участок по строительному проекту в случае, если объект будет строиться на земельном участке, права аренды/собственности на который приобретаются/приобретены из государственной, муниципальной собственности, либо земельный участок приобретен посредством цепочки сделок начиная с приватизации.',
    },
    {
      name: 'Нестандартный риск',
      weight: '7',
      description:
        'Анализ сделки по кредитованию на цели приобретения проблемных активов (имущество в рамках действующей/планируемой процедуры банкротства; права требования по просроченным долгам/кредитам; доля в уставном капитале проблемного актива), сделки «с нестандартным риском» (Решение КПКИ ЦА от 24.02.2022 № 1381 §5а «Об утверждении условий финансирования сложноструктурированных и высокодоходных сделок для девелоперов жилья»).',
    },
    {
      name: 'Отсутствующие риски',
      weight: '7',
      description:
        'Анализ сделки с инструментами, рисками, по которым отсутствует практика работы, что влечет подготовку запросов в ПД, обсуждение схем с лидерами процесса, формулирование новых рисков (нешаблонизированных).',
    },
    {
      name: 'Анализ регионального законодательства',
      weight: '4',
      description:
        'Анализ регионального законодательства в сделке (например, для заключения ДКРТ, по вопросам СЭ).',
    },
    {
      name: 'Национализация',
      weight: '5',
      description: 'Подготовка заключений в связи с исками прокуратуры о национализации активов клиента.',
    },
    {
      name: 'ПРКО 100+ страниц',
      weight: '4',
      description:
        'Согласование объемного ПРКО (100+ страниц, составляющих основную часть, приложения 2 и 3).',
    },
    {
      name: 'Проектная деятельность',
      weight: '3',
      description:
        'Участие в проектной деятельности правового департамента, методологической работе, направленной на усовершенствование процессов и нормативных документов Банка. Вес критерия от 3 до 7, определяется по объему выполненной работы, объем предоставляется руководителю на верификацию.',
    },
  ];

  for (const param of parameters) {
    const [created] = await db
      .insert(schema.parameters)
      .values({
        departmentId: department.id,
        name: param.name,
        description: param.description,
        weight: param.weight,
      })
      .returning();
    console.log('Created parameter:', created.name, `(вес ${created.weight})`);
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
