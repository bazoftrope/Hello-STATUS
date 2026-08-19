import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { monthStartISO, todayISO } from '@/lib/dates';

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
      <div style={{ fontSize: '0.8125rem' }}>
        <span style={{ color: 'var(--color-danger)', textDecoration: 'line-through' }}>
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
    <div style={{ fontSize: '0.8125rem' }}>
      {changes.map((f) => (
        <div key={f.key} style={{ marginBottom: '2px' }}>
          <span className="text-muted">{f.label}: </span>
          <span style={{ color: 'var(--color-danger)', textDecoration: 'line-through' }}>
            {formatValue(oldVal[f.key]) || '—'}
          </span>
          {' → '}
          <span style={{ color: 'var(--color-success)' }}>
            {formatValue(newVal[f.key]) || '—'}
          </span>
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

      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Аудит-лог</h2>
          <p className="text-muted mt-sm" style={{ fontSize: '0.875rem' }}>
            Изменения записей руководителем
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-md)' }}>
          <div className="flex items-center gap-sm">
            <div>
              <label className="form-label" htmlFor="audit-from" style={{ marginBottom: '0.25rem' }}>
                С
              </label>
              <input
                id="audit-from"
                className="form-input"
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="audit-to" style={{ marginBottom: '0.25rem' }}>
                По
              </label>
              <input
                id="audit-to"
                className="form-input"
                type="date"
                value={to}
                min={from}
                max={todayISO()}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}

          {isLoading ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Загрузка...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Изменений за выбранный период нет.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Кто изменил</th>
                    <th>Сотрудник</th>
                    <th>Параметр</th>
                    <th>Действие</th>
                    <th>Изменения</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(entry.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>{entry.actorName}</td>
                      <td>{entry.entryAuthorName}</td>
                      <td>{entry.parameterName}</td>
                      <td>
                        <span
                          className={`badge ${entry.action === 'delete' ? 'badge-archived' : 'badge-active'}`}
                        >
                          {entry.action === 'delete' ? 'Удаление' : 'Изменение'}
                        </span>
                      </td>
                      <td>
                        <DiffView
                          oldVal={entry.oldValue}
                          newVal={entry.newValue}
                          action={entry.action}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
