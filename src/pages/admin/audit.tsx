import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import {
  Alert,
  Badge,
  Card,
  CardBody,
  FormInput,
  FormLabel,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { monthStartISO, todayISO } from '@/lib/dates';
import styles from './audit.module.css';

interface AuditEntry {
  id: string;
  createdAt: string;
  actorName: string;
  entryAuthorName: string;
  parameterName: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return JSON.stringify(val);
}

function DiffView({
  oldVal,
  newVal,
  action,
}: {
  oldVal: Record<string, unknown> | null;
  newVal: Record<string, unknown> | null;
  action: string;
}) {
  if (action === 'delete' && oldVal) {
    return (
      <div className={styles.diff}>
        <span className={styles.oldValue}>
          {formatValue(oldVal.quantity)} × {formatValue(oldVal.comment ?? '—')}
        </span>
      </div>
    );
  }

  if (!oldVal || !newVal) return <span className="text-muted">—</span>;

  const fields: { key: string; label: string }[] = [
    { key: 'quantity', label: 'Кол-во' },
    { key: 'entryDate', label: 'Дата' },
    { key: 'comment', label: 'Комментарий' },
  ];

  const changes = fields.filter(
    (f) => formatValue(oldVal[f.key]) !== formatValue(newVal[f.key])
  );

  if (changes.length === 0) return <span className="text-muted">Без изменений</span>;

  return (
    <div className={styles.diff}>
      {changes.map((f) => (
        <div key={f.key} className={styles.diffRow}>
          <span className="text-muted">{f.label}: </span>
          <span className={styles.oldValue}>{formatValue(oldVal[f.key]) || '—'}</span>
          {' → '}
          <span className={styles.newValue}>{formatValue(newVal[f.key]) || '—'}</span>
        </div>
      ))}
    </div>
  );
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/audit?from=${from}&to=${to}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки аудит-лога');
      }
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки аудит-лога');
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <Head>
        <title>Аудит-лог - Статус</title>
      </Head>

      <PageHeader
        title="Аудит-лог"
        subtitle="Изменения записей руководителем"
        actions={
          <Card padding="md">
            <div className="flex items-center gap-sm">
              <div>
                <FormLabel htmlFor="audit-from" className={styles.filterLabel}>
                  С
                </FormLabel>
                <FormInput
                  id="audit-from"
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <FormLabel htmlFor="audit-to" className={styles.filterLabel}>
                  По
                </FormLabel>
                <FormInput
                  id="audit-to"
                  type="date"
                  value={to}
                  min={from}
                  max={todayISO()}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
          </Card>
        }
      />

      <Card>
        <CardBody>
          {error && <Alert variant="error">{error}</Alert>}

          {isLoading ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>Загрузка...</p>
          ) : entries.length === 0 ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>
              Изменений за выбранный период нет.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Кто изменил</Th>
                  <Th>Сотрудник</Th>
                  <Th>Параметр</Th>
                  <Th>Действие</Th>
                  <Th>Изменения</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <Td nowrap>
                      {new Date(entry.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Td>
                    <Td>{entry.actorName}</Td>
                    <Td>{entry.entryAuthorName}</Td>
                    <Td>{entry.parameterName}</Td>
                    <Td>
                      <Badge variant={entry.action === 'delete' ? 'archived' : 'active'}>
                        {entry.action === 'delete' ? 'Удаление' : 'Изменение'}
                      </Badge>
                    </Td>
                    <Td>
                      <DiffView
                        oldVal={entry.oldValue}
                        newVal={entry.newValue}
                        action={entry.action}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Layout>
  );
}
