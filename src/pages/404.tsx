import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 — Страница не найдена — Статус</title>
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
              404
            </p>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 'var(--spacing-md) 0' }}>
              Страница не найдена
            </h1>
            <p className="text-muted mb-lg">
              Запрашиваемая страница не существует или была перемещена.
            </p>
            <Link href="/" className="btn btn-primary">
              На главную
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
