import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import {
  Alert,
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
import { monthStartISO, todayISO } from '@/lib/dates';
import styles from './entries.module.css';

interface Entry {
  id: string;
  userId: string;
  userName: string;
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

interface CreateFormValues {
  userId: string;
  parameterId: string;
  quantity: string;
  entryDate: string;
  comment: string;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role: string;
}

interface Parameter {
  id: string;
  name: string;
  weight: number;
  isArchived: boolean;
}

type ModalState = { type: 'none' } | { type: 'edit'; entry: Entry } | { type: 'create' };

function EditFormModal({
  entry,
  isSaving,
  onSubmit,
  onClose,
}: {
  entry: Entry;
  isSaving: boolean;
  onSubmit: (values: EditFormValues) => Promise<void>;
  onClose: () => void;
}) {
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
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h3 className={styles.modalTitle}>Корректировка записи</h3>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Закрыть
          </Button>
        </ModalHeader>

        <ModalBody>
          {error && <Alert variant="error">{error}</Alert>}

          <p className={`text-muted mb-md ${styles.parameterHint}`}>
            Сотрудник: <strong>{entry.userName}</strong>
            <br />
            Параметр: <strong>{entry.parameterName}</strong>
          </p>

          <FormGroup>
            <FormLabel htmlFor="admin-edit-quantity">Количество</FormLabel>
            <FormInput
              id="admin-edit-quantity"
              type="number"
              min={1}
              max={100000}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={isSaving}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="admin-edit-date">Дата</FormLabel>
            <FormInput
              id="admin-edit-date"
              type="date"
              max={todayISO()}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
              disabled={isSaving}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="admin-edit-comment">Комментарий</FormLabel>
            <FormTextarea
              id="admin-edit-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Необязательно"
              disabled={isSaving}
            />
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

function CreateEntryModal({
  isSaving,
  onSubmit,
  onClose,
}: {
  isSaving: boolean;
  onSubmit: (values: CreateFormValues) => Promise<void>;
  onClose: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [parameterId, setParameterId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [comment, setComment] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [error, setError] = useState('');
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [usersRes, paramsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/parameters'),
        ]);
        const usersData = await usersRes.json().catch(() => []);
        const paramsData = await paramsRes.json().catch(() => []);
        if (usersRes.ok && Array.isArray(usersData)) {
          setEmployees(usersData.filter((u: Employee) => u.isActive && u.role === 'employee'));
          if (usersData.filter((u: Employee) => u.isActive && u.role === 'employee').length > 0) {
            setUserId(usersData.filter((u: Employee) => u.isActive && u.role === 'employee')[0].id);
          }
        }
        if (paramsRes.ok && Array.isArray(paramsData)) {
          const active = paramsData.filter((p: Parameter) => !p.isArchived);
          setParameters(active);
          if (active.length > 0) setParameterId(active[0].id);
        }
      } catch {
        setError('Ошибка загрузки справочников');
      } finally {
        setIsLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!userId) {
      setError('Выберите сотрудника');
      return;
    }
    if (!parameterId) {
      setError('Выберите параметр');
      return;
    }
    try {
      await onSubmit({ userId, parameterId, quantity, entryDate, comment });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h3 className={styles.modalTitle}>Добавить запись за сотрудника</h3>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Закрыть
          </Button>
        </ModalHeader>

        <ModalBody>
          {error && <Alert variant="error">{error}</Alert>}
          {isLoadingOptions ? (
            <p className="text-muted text-center">Загрузка...</p>
          ) : (
            <>
              <FormGroup>
                <FormLabel htmlFor="admin-create-user">Сотрудник</FormLabel>
                <select
                  id="admin-create-user"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  {employees.length === 0 && <option value="">Нет активных сотрудников</option>}
                  {employees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="admin-create-parameter">Параметр</FormLabel>
                <select
                  id="admin-create-parameter"
                  value={parameterId}
                  onChange={(e) => setParameterId(e.target.value)}
                  required
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  {parameters.length === 0 && <option value="">Нет активных параметров</option>}
                  {parameters.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (вес {p.weight})
                    </option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="admin-create-quantity">Количество</FormLabel>
                <FormInput
                  id="admin-create-quantity"
                  type="number"
                  min={1}
                  max={100000}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="admin-create-date">Дата</FormLabel>
                <FormInput
                  id="admin-create-date"
                  type="date"
                  max={todayISO()}
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="admin-create-comment">Комментарий</FormLabel>
                <FormTextarea
                  id="admin-create-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Необязательно"
                  disabled={isSaving}
                />
              </FormGroup>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSaving || isLoadingOptions}>
            {isSaving ? 'Сохранение...' : 'Добавить'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function formatWeight(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminEntriesPage() {
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
    setError('');
    try {
      const res = await fetch(`/api/entries?from=${from}&to=${to}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка загрузки записей');
      }
      setEntries(data);
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
    () => entries.reduce((sum, e) => sum + e.points, 0),
    [entries]
  );

  const handleUpdate = async (values: EditFormValues) => {
    if (modal.type !== 'edit') return;
    setIsSaving(true);
    setSuccess('');
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
        throw new Error(data.error || 'Ошибка сохранения');
      }
      setModal({ type: 'none' });
      setSuccess('Запись обновлена (изменение зафиксировано в аудит-логе)');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (values: CreateFormValues) => {
    setIsSaving(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: values.userId,
          parameterId: values.parameterId,
          quantity: Number(values.quantity),
          entryDate: values.entryDate,
          comment: values.comment || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка создания записи');
      }
      setModal({ type: 'none' });
      setSuccess('Запись добавлена за сотрудника (зафиксировано в аудит-логе)');
      await load();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Ошибка создания записи');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: Entry) => {
    if (!window.confirm(`Удалить запись «${entry.parameterName}» (${entry.userName})?`)) return;
    setSuccess('');
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка удаления');
      }
      setSuccess('Запись удалена (удаление зафиксировано в аудит-логе)');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Журнал записей - Статус</title>
      </Head>

      <PageHeader
        title="Журнал записей"
        subtitle={`Записей: ${entries.length} | Баллов: ${formatWeight(totalPoints)}`}
        actions={
          <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
            <Card padding="md">
              <div className="flex items-center gap-sm">
                <div>
                  <FormLabel htmlFor="admin-from" className={styles.filterLabel}>
                    С
                  </FormLabel>
                  <FormInput
                    id="admin-from"
                    type="date"
                    value={from}
                    max={to}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="admin-to" className={styles.filterLabel}>
                    По
                  </FormLabel>
                  <FormInput
                    id="admin-to"
                    type="date"
                    value={to}
                    min={from}
                    max={todayISO()}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
            </Card>
            <Button onClick={() => setModal({ type: 'create' })}>Добавить за сотрудника</Button>
          </div>
        }
      />

      <Card>
        <CardBody>
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {isLoading ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>Загрузка...</p>
          ) : entries.length === 0 ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>
              Записей за выбранный период нет.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Сотрудник</Th>
                  <Th>Параметр</Th>
                  <Th align="center">Кол-во</Th>
                  <Th align="right">Баллы</Th>
                  <Th>Комментарий</Th>
                  <Th align="right">Действия</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <Td nowrap>{entry.entryDate}</Td>
                    <Td>{entry.userName}</Td>
                    <Td>{entry.parameterName}</Td>
                    <Td align="center">{entry.quantity}</Td>
                    <Td align="right" semibold>
                      {formatWeight(entry.points)}
                    </Td>
                    <Td className="text-muted">{entry.comment ?? '—'}</Td>
                    <Td align="right">
                      <div className={styles.actions}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModal({ type: 'edit', entry })}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(entry)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {modal.type === 'edit' && (
        <EditFormModal
          entry={modal.entry}
          isSaving={isSaving}
          onSubmit={handleUpdate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'create' && (
        <CreateEntryModal
          isSaving={isSaving}
          onSubmit={handleCreate}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </Layout>
  );
}
