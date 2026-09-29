import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { Alert, Button, Card, CardBody, PageHeader } from '@/components/ui';
import { MyActionsTable, type MyActionsParameter } from '@/components/MyActionsTable';
import { EntryFormModal, type EntryFormValues } from '@/components/EntryFormModal';
import { todayISO } from '@/lib/dates';
import styles from './index.module.css';

type Parameter = MyActionsParameter;

interface Entry {
  id: string;
  parameterId: string;
  quantity: number;
  points: number;
  entryDate: string;
}

function formatWeight(weight: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(weight);
}

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession();
  const isManager = session?.user.role === 'manager';
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState<{ type: 'none' } | { type: 'create'; parameter: Parameter }>(
    { type: 'none' }
  );

  const load = useCallback(async () => {
    if (isManager) {
      setIsLoading(false);
      return;
    }

    try {
      const [parametersRes, entriesRes] = await Promise.all([
        fetch('/api/parameters'),
        fetch(`/api/entries?from=${todayISO()}&to=${todayISO()}`),
      ]);

      const parametersData = await parametersRes.json().catch(() => ({}));
      if (!parametersRes.ok) {
        throw new Error(parametersData.error || 'Ошибка загрузки параметров');
      }
      const entriesData = await entriesRes.json().catch(() => ({}));
      if (!entriesRes.ok) {
        throw new Error(entriesData.error || 'Ошибка загрузки записей');
      }

      setParameters(parametersData);
      setTodayEntries(entriesData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (isManager) {
      setIsLoading(false);
      return;
    }
    load();
  }, [load, sessionStatus, isManager]);

  const todayTotal = useMemo(
    () => todayEntries.reduce((sum, entry) => sum + entry.points, 0),
    [todayEntries]
  );

  const quantityByParameter = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of todayEntries) {
      map.set(entry.parameterId, (map.get(entry.parameterId) ?? 0) + entry.quantity);
    }
    return map;
  }, [todayEntries]);

  const handleQuickAdd = async (parameter: Parameter) => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameterId: parameter.id,
          quantity: 1,
          entryDate: todayISO(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка добавления действия');
      }
      setSuccess(`«${parameter.name}»: +1 (${formatWeight(parameter.weight)} балл)`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления действия');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (values: EntryFormValues) => {
    if (modal.type !== 'create') return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameterId: modal.parameter.id,
          quantity: Number(values.quantity),
          entryDate: values.entryDate,
          comment: values.comment || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка добавления действия');
      }
      setModal({ type: 'none' });
      setSuccess('Действие добавлено');
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <Layout>
        <p className="text-muted text-center" style={{ padding: '2rem' }}>
          Загрузка...
        </p>
      </Layout>
    );
  }

  if (isManager) {
    return (
      <Layout>
        <Head>
          <title>Панель руководителя - Статус</title>
        </Head>

        <PageHeader
          title="Панель руководителя"
          subtitle="Вы не ведёте личные действия — ваша роль управление отделом"
        />

        <Card>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                Руководители не ведут личные действия и не участвуют в рейтинге.
                <br />
                Для внесения действий за сотрудников используйте{' '}
                <strong style={{ color: 'var(--color-text)' }}>Журнал записей</strong>.
              </p>
              <div
                className="flex gap-sm"
                style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}
              >
                <Button href="/admin/entries">Журнал записей</Button>
                <Button href="/stats" variant="outline">
                  Статистика подразделения
                </Button>
                <Button href="/rating" variant="outline">
                  Рейтинг отдела
                </Button>
                <Button href="/history" variant="outline">
                  История подразделения
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <div
          className="flex gap-sm"
          style={{ marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Card padding="md" style={{ flex: '1 1 200px', maxWidth: '280px' }}>
            <p className={`text-muted ${styles.statLabel}`}>Управление</p>
            <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>Параметры и сотрудники</p>
            <div className="flex gap-sm" style={{ marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <Button href="/admin/parameters" size="sm" variant="outline">
                Параметры
              </Button>
              <Button href="/admin/employees" size="sm" variant="outline">
                Сотрудники
              </Button>
            </div>
          </Card>
          <Card padding="md" style={{ flex: '1 1 200px', maxWidth: '280px' }}>
            <p className={`text-muted ${styles.statLabel}`}>Контроль</p>
            <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>Аудит изменений</p>
            <div style={{ marginTop: '0.75rem' }}>
              <Button href="/admin/audit" size="sm" variant="outline">
                Аудит-лог
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Мои действия - Статус</title>
      </Head>

      <PageHeader
        title="Мои действия"
        subtitle={
          new Date().toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        }
        actions={
          <Card padding="md" className="text-right">
            <p className={`text-muted ${styles.statLabel}`}>Баллов за сегодня</p>
            <p className={styles.statValue}>{formatWeight(todayTotal)}</p>
          </Card>
        }
      />

      <Card>
        <CardBody>
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <MyActionsTable
            parameters={parameters}
            quantityByParameter={quantityByParameter}
            isSaving={isSaving}
            isLoading={isLoading}
            onQuickAdd={handleQuickAdd}
            onOpenCreate={(p) => setModal({ type: 'create', parameter: p })}
          />
        </CardBody>
      </Card>

      {modal.type === 'create' && (
        <EntryFormModal
          parameterName={modal.parameter.name}
          isSaving={isSaving}
          onSubmit={handleCreate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </Layout>
  );
}
