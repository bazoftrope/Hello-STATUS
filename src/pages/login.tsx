import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

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

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="card-header" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Вход в систему</h1>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              Статус — Рейтинг продуктивности
            </p>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@status.app"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <p className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                Тестовые аккаунты:
              </p>
              <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem' }}>
                Руководитель: manager@status.app / manager123
              </p>
              <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                Сотрудник: employee@status.app / employee123
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
