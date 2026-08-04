import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';

interface Parameter {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  weight: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

type ModalState = { type: 'none' } | { type: 'create' } | { type: 'edit'; parameter: Parameter };

interface FormValues {
  name: string;
  description: string;
  weight: string;
}

interface ParameterFormModalProps {
  title: string;
  initial?: Parameter;
  isSaving: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
  onClose: () => void;
}

function ParameterFormModal({ title, initial, isSaving, onSubmit, onClose }: ParameterFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [weight, setWeight] = useState(initial ? String(initial.weight) : '1');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({ name, description, weight });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении');
    }
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSaving}>
            Закрыть
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="param-name">
              Название
            </label>
            <input
              id="param-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              placeholder="Например: Подготовка документов"
              required
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="param-description">
              Описание
            </label>
            <textarea
              id="param-description"
              className="form-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Необязательно"
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="param-weight">
              Вес
            </label>
            <input
              id="param-weight"
              className="form-input"
              type="number"
              step="0.1"
              min="0.01"
              max="1000"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              disabled={isSaving}
            />
            <p className="text-muted mt-sm" style={{ fontSize: '0.75rem' }}>
              Баллы = вес × количество. Изменение веса не влияет на уже начисленные баллы.
            </p>
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

export default function ParametersPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/parameters?includeArchived=true');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки параметров');
      }
      setParameters(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки параметров');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка создания параметра');
      }
      setModal({ type: 'none' });
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (values: FormValues) => {
    if (modal.type !== 'edit') return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/parameters/${modal.parameter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка сохранения параметра');
      }
      setModal({ type: 'none' });
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (parameter: Parameter) => {
    if (!window.confirm(`Архивировать параметр «${parameter.name}»?`)) return;
    await setArchived(parameter, true);
  };

  const handleRestore = async (parameter: Parameter) => {
    if (!window.confirm(`Восстановить параметр «${parameter.name}»?`)) return;
    await setArchived(parameter, false);
  };

  const setArchived = async (parameter: Parameter, isArchived: boolean) => {
    try {
      const res = await fetch(`/api/parameters/${parameter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка изменения параметра');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения параметра');
    }
  };

  const sortedParameters = useMemo(() => {
    return [...parameters].sort((a, b) => {
      if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [parameters]);

  const activeCount = parameters.filter((p) => !p.isArchived).length;
  const archivedCount = parameters.length - activeCount;

  return (
    <Layout>
      <Head>
        <title>Параметры - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Параметры отдела</h2>
          <p className="text-muted mt-sm" style={{ fontSize: '0.875rem' }}>
            Активных: {activeCount} · В архиве: {archivedCount}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'create' })}>
          Добавить параметр
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}

          {isLoading ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Загрузка...
            </p>
          ) : sortedParameters.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Параметры не найдены. Добавьте первый параметр.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Вес</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {sortedParameters.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="text-muted">{p.description ?? '—'}</td>
                    <td>{formatWeight(p.weight)}</td>
                    <td>
                      {p.isArchived ? (
                        <span className="badge badge-archived">Архив</span>
                      ) : (
                        <span className="badge badge-active">Активен</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setModal({ type: 'edit', parameter: p })}
                        >
                          Изменить
                        </button>
                        {p.isArchived ? (
                          <button className="btn btn-outline btn-sm" onClick={() => handleRestore(p)}>
                            Восстановить
                          </button>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => handleArchive(p)}>
                            Архивировать
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.type === 'create' && (
        <ParameterFormModal
          title="Новый параметр"
          isSaving={isSaving}
          onSubmit={handleCreate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'edit' && (
        <ParameterFormModal
          title="Изменить параметр"
          initial={modal.parameter}
          isSaving={isSaving}
          onSubmit={handleUpdate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </Layout>
  );
}
