import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CenterPage,
  FormGroup,
  FormInput,
  FormLabel,
} from '@/components/ui';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        const callbackUrl = router.query.callbackUrl as string;
        router.push(callbackUrl || '/');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Вход - Статус</title>
      </Head>

      <CenterPage>
        <Card className={styles.loginCard}>
          <CardHeader className="text-center">
            <h1 className={styles.loginTitle}>Вход в систему</h1>
            <p className={`text-muted ${styles.loginSubtitle}`}>
              Статус — Рейтинг продуктивности
            </p>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit}>
              {error && <Alert variant="error">{error}</Alert>}

              <FormGroup>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@status.app"
                  required
                  disabled={isLoading}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="password">Пароль</FormLabel>
                <FormInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  disabled={isLoading}
                />
              </FormGroup>

              <Button type="submit" block disabled={isLoading}>
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <div className={styles.divider}>
              <p className={`text-muted ${styles.hintText}`}>Тестовые аккаунты:</p>
              <p className={`text-muted ${styles.hintSmall}`}>
                Руководитель: manager@status.app / manager123
              </p>
              <p className={`text-muted ${styles.hintSmall}`}>
                Сотрудник: employee@status.app / employee123
              </p>
              <p className={`text-muted ${styles.hintText}`}>
                Нет аккаунта?{' '}
                <Link href="/register" className={styles.registerLink}>
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </CenterPage>
    </>
  );
}