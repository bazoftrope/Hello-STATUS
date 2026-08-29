import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button, ErrorCard } from '@/components/ui';

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

      <ErrorCard
        code={statusCode ? String(statusCode) : '?'}
        title={title}
        message={message}
      >
        <Button onClick={() => router.reload()}>Повторить</Button>
        <Button variant="outline" onClick={() => router.push('/')}>
          На главную
        </Button>
      </ErrorCard>
    </>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
