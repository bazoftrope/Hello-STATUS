import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <Layout>
      <Head>
        <title>Мои действия - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Мои действия</h2>
        <p className="text-muted">
          {new Date().toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            Здесь будет таблица параметров с кнопками «+1» для фиксации действий.
            <br />
            Раздел будет реализован на Этапе 3.
          </p>
        </div>
      </div>
    </Layout>
  );
}
