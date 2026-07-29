import { ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  if (status === 'loading') {
    return (
      <div className="page">
        <div className="page-content">
          <div className="container text-center">
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="container flex items-center justify-between">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Статус
            </h1>
          </Link>

          {session && (
            <nav className="flex items-center gap-md">
              <Link href="/" className={router.pathname === '/' ? 'active' : ''}>
                Мои действия
              </Link>
              <Link href="/history" className={router.pathname === '/history' ? 'active' : ''}>
                История
              </Link>
              <Link href="/rating" className={router.pathname === '/rating' ? 'active' : ''}>
                Рейтинг
              </Link>
              <Link href="/stats" className={router.pathname === '/stats' ? 'active' : ''}>
                Статистика
              </Link>

              {session.user.role === 'manager' && (
                <Link
                  href="/admin/parameters"
                  className={router.pathname.startsWith('/admin') ? 'active' : ''}
                >
                  Управление
                </Link>
              )}

              <div className="flex items-center gap-sm">
                <span className="text-muted">{session.user.name}</span>
                <button onClick={handleSignOut} className="btn btn-outline btn-sm">
                  Выйти
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="page-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
