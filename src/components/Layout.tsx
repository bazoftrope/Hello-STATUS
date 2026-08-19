import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const closeMenu = () => setMenuOpen(false);

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
        <div className="container">
          <div className="header-top">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Статус
              </h1>
            </Link>

            {session && (
              <>
                <button
                  className="hamburger"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Меню"
                >
                  {menuOpen ? '✕' : '☰'}
                </button>

                <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
                  <Link
                    href="/"
                    className={router.pathname === '/' ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    Мои действия
                  </Link>
                  <Link
                    href="/history"
                    className={router.pathname === '/history' ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    История
                  </Link>
                  <Link
                    href="/rating"
                    className={router.pathname === '/rating' ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    Рейтинг
                  </Link>
                  <Link
                    href="/stats"
                    className={router.pathname === '/stats' ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    Статистика
                  </Link>

                  {session.user.role === 'manager' && (
                    <>
                      <Link
                        href="/admin/parameters"
                        className={router.pathname === '/admin/parameters' ? 'active' : ''}
                        onClick={closeMenu}
                      >
                        Параметры
                      </Link>
                      <Link
                        href="/admin/entries"
                        className={router.pathname === '/admin/entries' ? 'active' : ''}
                        onClick={closeMenu}
                      >
                        Журнал
                      </Link>
                      <Link
                        href="/admin/audit"
                        className={router.pathname === '/admin/audit' ? 'active' : ''}
                        onClick={closeMenu}
                      >
                        Аудит
                      </Link>
                    </>
                  )}

                  <div className="nav-user">
                    <span className="text-muted">{session.user.name}</span>
                    <button onClick={handleSignOut} className="btn btn-outline btn-sm">
                      Выйти
                    </button>
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
