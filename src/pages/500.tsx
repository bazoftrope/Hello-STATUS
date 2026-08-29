import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button, ErrorCard } from '@/components/ui';

export default function Custom500() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>500 — Ошибка сервера — Статус</title>
      </Head>

      <ErrorCard
        code="500"
        title="Ошибка сервера"
        message="Произошла внутренняя ошибка. Попробуйте повторить позже."
      >
        <Button onClick={() => router.reload()}>Повторить</Button>
        <Button variant="outline" onClick={() => router.push('/')}>
          На главную
        </Button>
      </ErrorCard>
    </>
  );
}
