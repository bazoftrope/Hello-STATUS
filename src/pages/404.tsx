import Head from 'next/head';
import { Button, ErrorCard } from '@/components/ui';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 — Страница не найдена — Статус</title>
      </Head>

      <ErrorCard
        code="404"
        title="Страница не найдена"
        message="Запрашиваемая страница не существует или была перемещена."
      >
        <Button href="/">На главную</Button>
      </ErrorCard>
    </>
  );
}
