import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  FormGroup,
  FormInput,
  FormLabel,
  FormTextarea,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import styles from './parameters.module.css';

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
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h3 className={styles.modalTitle}>{title}</h3>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Закрыть
          </Button>
        </ModalHeader>

        <ModalBody>
          {error && <Alert variant="error">{error}</Alert>}

          <FormGroup>
            <FormLabel htmlFor="param-name">Название</FormLabel>
            <FormInput
              id="param-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              placeholder="Например: Подготовка документов"
              required
              disabled={isSaving}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="param-description">Описание</FormLabel>
            <FormTextarea
              id="param-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Необязательно"
              disabled={isSaving}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="param-weight">Вес</FormLabel>
            <FormInput
              id="param-weight"
              type="number"
              step="0.1"
              min="0.01"
              max="1000"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              disabled={isSaving}
            />
            <p className={`text-muted mt-sm ${styles.hint}`}>
              Баллы = вес × количество. Изменение веса не влияет на уже начисленные баллы.
            </p>
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
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

      <PageHeader
        title="Параметры отдела"
        subtitle={`Активных: ${activeCount} · В архиве: ${archivedCount}`}
        actions={
          <Button onClick={() => setModal({ type: 'create' })}>Добавить параметр</Button>
        }
      />

      <Card>
        <CardBody>
          {error && <Alert variant="error">{error}</Alert>}

          {isLoading ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>Загрузка...</p>
          ) : sortedParameters.length === 0 ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>
              Параметры не найдены. Добавьте первый параметр.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Название</Th>
                  <Th>Описание</Th>
                  <Th>Вес</Th>
                  <Th>Статус</Th>
                  <Th>Действия</Th>
                </tr>
              </thead>
              <tbody>
                {sortedParameters.map((p) => (
                  <tr key={p.id}>
                    <Td>{p.name}</Td>
                    <Td className="text-muted">{p.description ?? '—'}</Td>
                    <Td>{formatWeight(p.weight)}</Td>
                    <Td>
                      {p.isArchived ? (
                        <Badge variant="archived">Архив</Badge>
                      ) : (
                        <Badge variant="active">Активен</Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex gap-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModal({ type: 'edit', parameter: p })}
                        >
                          Изменить
                        </Button>
                        {p.isArchived ? (
                          <Button variant="outline" size="sm" onClick={() => handleRestore(p)}>
                            Восстановить
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleArchive(p)}>
                            Архивировать
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

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
