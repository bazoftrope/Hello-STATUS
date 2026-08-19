import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface ErrorProps {
  statusCode: number | null;
}

function ErrorPage({ statusCode }: ErrorProps) {
  const router = useRouter();

  const title = statusCode === 404 ? 'Страница не найдена' : 'Ошибка';
  const message =
    statusCode === 404
      ? 'Запрашиваемая страница не существует.'
      : statusCode
        ? `Произошла ошибка (${statusCode}).`
        : 'Произошла неизвестная ошибка.';

  return (
    <>
      <Head>
        <title>{statusCode ? `${statusCode} — ` : ''}{title} — Статус</title>
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
              {statusCode || '?'}
            </p>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 'var(--spacing-md) 0' }}>
              {title}
            </h1>
            <p className="text-muted mb-lg">{message}</p>
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

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
