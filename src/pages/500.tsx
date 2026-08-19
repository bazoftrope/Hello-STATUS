import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Custom500() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>500 — Ошибка сервера — Статус</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: 'var(--spacing-2xl)' }}>
            <p style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              500
            </p>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 'var(--spacing-md) 0' }}>
              Ошибка сервера
            </h1>
            <p className="text-muted mb-lg">
              Произошла внутренняя ошибка. Попробуйте повторить позже.
            </p>
            <div className="flex gap-sm" style={{ justifyContent: 'center' }}>
              <button onClick={() => router.reload()} className="btn btn-primary">
                Повторить
              </button>
              <button onClick={() => router.push('/')} className="btn btn-outline">
                На главную
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
