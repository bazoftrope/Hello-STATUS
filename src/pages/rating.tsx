import Head from 'next/head';
import { Layout } from '@/components/Layout';

export default function RatingPage() {
  return (
    <Layout>
      <Head>
        <title>Рейтинг - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Рейтинг отдела</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            Здесь будет таблица рейтинга сотрудников с фильтрами периодов.
            <br />
            Раздел будет реализован на Этапе 4.
          </p>
        </div>
      </div>
    </Layout>
  );
}
