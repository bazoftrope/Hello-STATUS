import Head from 'next/head';
import { Layout } from '@/components/Layout';

export default function EntriesPage() {
  return (
    <Layout>
      <Head>
        <title>Журнал записей - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Журнал записей</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            Здесь будет журнал записей отдела с фильтрами и возможностью корректировки.
            <br />
            Раздел будет реализован на Этапе 4.
          </p>
        </div>
      </div>
    </Layout>
  );
}
