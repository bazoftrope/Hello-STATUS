import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { todayISO } from '@/lib/dates';

interface Parameter {
  id: string;
  name: string;
  description: string | null;
  weight: number;
}

interface Entry {
  id: string;
  parameterId: string;
  quantity: number;
  points: number;
  entryDate: string;
}

interface EntryFormValues {
  quantity: string;
  entryDate: string;
  comment: string;
}

interface EntryFormModalProps {
  parameterName: string;
  isSaving: boolean;
  onSubmit: (values: EntryFormValues) => Promise<void>;
  onClose: () => void;
}

function EntryFormModal({ parameterName, isSaving, onSubmit, onClose }: EntryFormModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [comment, setComment] = useState('');
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
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Добавить действие</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>
            Закрыть
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <p className="text-muted mb-md" style={{ fontSize: '0.875rem' }}>
            Параметр: <strong style={{ color: 'var(--color-text)' }}>{parameterName}</strong>
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="entry-quantity">
              Количество
            </label>
            <input
              id="entry-quantity"
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
            <label className="form-label" htmlFor="entry-date">
              Дата
            </label>
            <input
              id="entry-date"
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
            <label className="form-label" htmlFor="entry-comment">
              Комментарий
            </label>
            <textarea
              id="entry-comment"
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

function formatWeight(weight: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(weight);
}

export default function HomePage() {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <Layout>
      <Head>
        <title>Мои действия - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Мои действия</h2>
          <p className="text-muted mt-sm" style={{ fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            Баллов за сегодня
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>
            {formatWeight(todayTotal)}
          </p>
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
          ) : parameters.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Активные параметры не найдены. Обратитесь к руководителю.
            </p>
          ) : (
            <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Действие</th>
                  <th>Вес</th>
                  <th style={{ textAlign: 'center' }}>Сегодня</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <strong>{p.name}</strong>
                      </div>
                      {p.description && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td>{formatWeight(p.weight)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {quantityByParameter.get(p.id) ?? 0}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-between gap-sm" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleQuickAdd(p)}
                          disabled={isSaving}
                        >
                          +1
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setModal({ type: 'create', parameter: p })}
                          disabled={isSaving}
                        >
                          Добавить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

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
