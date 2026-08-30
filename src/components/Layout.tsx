import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, ThemeToggle } from '@/components/ui';
import styles from './Layout.module.css';

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
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <div className={`${styles.container} text-center`}>
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.headerTop}>
            <Link href="/" className={styles.brandLink}>
              <img src="/icons/status.png" alt="Статус" className={styles.brandLogo} />
            </Link>

            {session && (
              <>
                <button
                  className={styles.hamburger}
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Меню"
                >
                  {menuOpen ? '✕' : '☰'}
                </button>

                <nav className={`${styles.navLinks}${menuOpen ? ` ${styles.open}` : ''}`}>
                  <Link
                    href="/"
                    className={router.pathname === '/' ? styles.active : ''}
                    onClick={closeMenu}
                  >
                    Мои действия
                  </Link>
                  <Link
                    href="/history"
                    className={router.pathname === '/history' ? styles.active : ''}
                    onClick={closeMenu}
                  >
                    История
                  </Link>
                  <Link
                    href="/rating"
                    className={router.pathname === '/rating' ? styles.active : ''}
                    onClick={closeMenu}
                  >
                    Рейтинг
                  </Link>
                  <Link
                    href="/stats"
                    className={router.pathname === '/stats' ? styles.active : ''}
                    onClick={closeMenu}
                  >
                    Статистика
                  </Link>

                  {session.user.role === 'manager' && (
                    <>
                      <Link
                        href="/admin/employees"
                        className={router.pathname === '/admin/employees' ? styles.active : ''}
                        onClick={closeMenu}
                      >
                        Сотрудники
                      </Link>
                      <Link
                        href="/admin/parameters"
                        className={router.pathname === '/admin/parameters' ? styles.active : ''}
                        onClick={closeMenu}
                      >
                        Параметры
                      </Link>
                      <Link
                        href="/admin/entries"
                        className={router.pathname === '/admin/entries' ? styles.active : ''}
                        onClick={closeMenu}
                      >
                        Журнал
                      </Link>
                      <Link
                        href="/admin/audit"
                        className={router.pathname === '/admin/audit' ? styles.active : ''}
                        onClick={closeMenu}
                      >
                        Аудит
                      </Link>
                    </>
                  )}

                  <div className={styles.navUser}>
                    <ThemeToggle />
                    <span className="text-muted">{session.user.name}</span>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      Выйти
                    </Button>
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.pageContent}>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  );
}
