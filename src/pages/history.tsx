import Head from 'next/head';
import { Layout } from '@/components/Layout';

export default function HistoryPage() {
  return (
    <Layout>
      <Head>
        <title>История - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Моя история</h2>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            Здесь будет список записей с фильтром по периоду.
            <br />
            Раздел будет реализован на Этапе 3.
          </p>
        </div>
      </div>
    </Layout>
  );
}
