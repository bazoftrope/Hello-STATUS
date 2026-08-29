import { useState } from 'react';
import Link from 'next/link';
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
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, passwordConfirm }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Произошла ошибка при регистрации');
        return;
      }

      setIsRegistered(true);
    } catch (err) {
      setError('Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <>
        <Head>
          <title>Регистрация - Статус</title>
        </Head>

        <CenterPage>
          <Card className={styles.registerCard}>
            <CardBody>
              <Alert variant="success">
                Заявка на регистрацию отправлена. Дождитесь подтверждения руководителя и войдите в
                систему.
              </Alert>

              <div className={styles.successActions}>
                <Button onClick={() => router.push('/login')}>Перейти ко входу</Button>
              </div>
            </CardBody>
          </Card>
        </CenterPage>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Регистрация - Статус</title>
      </Head>

      <CenterPage>
        <Card className={styles.registerCard}>
          <CardHeader className="text-center">
            <h1 className={styles.registerTitle}>Регистрация</h1>
            <p className={`text-muted ${styles.registerSubtitle}`}>
              Статус — Рейтинг продуктивности
            </p>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit}>
              {error && <Alert variant="error">{error}</Alert>}

              <FormGroup>
                <FormLabel htmlFor="fullName">ФИО</FormLabel>
                <FormInput
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  required
                  disabled={isLoading}
                />
              </FormGroup>

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
                  placeholder="Минимум 6 символов"
                  minLength={6}
                  required
                  disabled={isLoading}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="passwordConfirm">Пароль ещё раз</FormLabel>
                <FormInput
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Повторите пароль"
                  minLength={6}
                  required
                  disabled={isLoading}
                />
              </FormGroup>

              <Button type="submit" block disabled={isLoading}>
                {isLoading ? 'Отправка...' : 'Зарегистрироваться'}
              </Button>
            </form>

            <div className={styles.divider}>
              <p className={`text-muted ${styles.hintText}`}>
                Уже есть аккаунт?{' '}
                <Link href="/login" className={styles.loginLink}>
                  Войти
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </CenterPage>
    </>
  );
}
