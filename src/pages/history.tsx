import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { monthStartISO, todayISO } from '@/lib/dates';

interface Entry {
  id: string;
  parameterName: string;
  quantity: number;
  points: number;
  entryDate: string;
  comment: string | null;
}

interface EditFormValues {
  quantity: string;
  entryDate: string;
  comment: string;
}

type ModalState = { type: 'none' } | { type: 'edit'; entry: Entry };

interface EditFormModalProps {
  entry: Entry;
  isSaving: boolean;
  onSubmit: (values: EditFormValues) => Promise<void>;
  onClose: () => void;
}

function EditFormModal({ entry, isSaving, onSubmit, onClose }: EditFormModalProps) {
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [comment, setComment] = useState(entry.comment ?? '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({ quantity, entryDate, comment });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении');
    }
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Изменить запись</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>
            Закрыть
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <p className="text-muted mb-md" style={{ fontSize: '0.875rem' }}>
            Параметр: <strong style={{ color: 'var(--color-text)' }}>{entry.parameterName}</strong>
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-quantity">
              Количество
            </label>
            <input
              id="edit-quantity"
              className="form-input"
              type="number"
              min={1}
              max={100000}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-date">
              Дата
            </label>
            <input
              id="edit-date"
              className="form-input"
              type="date"
              max={todayISO()}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-comment">
              Комментарий
            </label>
            <textarea
              id="edit-comment"
              className="form-input"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Необязательно"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatWeight(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/entries?from=${from}&to=${to}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки записей');
      }
      setEntries(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки записей');
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPoints = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.points, 0),
    [entries]
  );

  const handleUpdate = async (values: EditFormValues) => {
    if (modal.type !== 'edit') return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/entries/${modal.entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: Number(values.quantity),
          entryDate: values.entryDate,
          comment: values.comment || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка сохранения записи');
      }
      setModal({ type: 'none' });
      setSuccess('Запись обновлена');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения записи');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: Entry) => {
    if (!window.confirm('Удалить запись?')) return;
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка удаления записи');
      }
      setSuccess('Запись удалена');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления записи');
    }
  };

  return (
    <Layout>
      <Head>
        <title>История - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Моя история</h2>
          <p className="text-muted mt-sm" style={{ fontSize: '0.875rem' }}>
            Баллов за период: <strong style={{ color: 'var(--color-text)' }}>{formatWeight(totalPoints)}</strong>
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-md)' }}>
          <div className="flex items-center gap-sm">
            <div>
              <label className="form-label" htmlFor="filter-from" style={{ marginBottom: '0.25rem' }}>
                С
              </label>
              <input
                id="filter-from"
                className="form-input"
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="filter-to" style={{ marginBottom: '0.25rem' }}>
                По
              </label>
              <input
                id="filter-to"
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
          {success && <div className="alert alert-success">{success}</div>}

          {isLoading ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Загрузка...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Записей за выбранный период нет.
            </p>
          ) : (
            <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Параметр</th>
                  <th style={{ textAlign: 'center' }}>Кол-во</th>
                  <th style={{ textAlign: 'right' }}>Баллы</th>
                  <th>Комментарий</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isToday = entry.entryDate === todayISO();
                  return (
                    <tr key={entry.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{entry.entryDate}</td>
                      <td>{entry.parameterName}</td>
                      <td style={{ textAlign: 'center' }}>{entry.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatWeight(entry.points)}</td>
                      <td className="text-muted">{entry.comment ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {isToday ? (
                          <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setModal({ type: 'edit', entry })}
                            >
                              Изменить
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(entry)}
                            >
                              Удалить
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Записи прошлых дней не редактируются
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {modal.type === 'edit' && (
        <EditFormModal
          entry={modal.entry}
          isSaving={isSaving}
          onSubmit={handleUpdate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </Layout>
  );
}
