import Head from 'next/head';
import { Layout } from '@/components/Layout';

export default function ParametersPage() {
  return (
    <Layout>
      <Head>
        <title>Параметры - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Параметры отдела</h2>
        <button className="btn btn-primary">Добавить параметр</button>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-muted text-center" style={{ padding: '2rem' }}>
            Здесь будет CRUD справочника параметров: название, описание, вес, архивирование.
            <br />
            Раздел будет реализован на Этапе 2.
          </p>
        </div>
      </div>
    </Layout>
  );
}
