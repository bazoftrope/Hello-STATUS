import Head from 'next/head';
import { Layout } from '@/components/Layout';

export default function StatsPage() {
  return (
    <Layout>
      <Head>
        <title>Статистика - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Моя статистика</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            Здесь будут графики баллов по дням и разрез по параметрам.
            <br />
            Раздел будет реализован на Этапе 4.
          </p>
        </div>
      </div>
    </Layout>
  );
}
