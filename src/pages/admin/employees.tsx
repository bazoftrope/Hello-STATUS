import Head from 'next/head';
import { Layout } from '@/components/Layout';

export default function EmployeesPage() {
  return (
    <Layout>
      <Head>
        <title>Сотрудники - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Сотрудники</h2>
        <button className="btn btn-primary">Добавить сотрудника</button>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            Здесь будет список сотрудников отдела с управлением ролями.
            <br />
            Раздел будет реализован в будущих этапах.
          </p>
        </div>
      </div>
    </Layout>
  );
}
