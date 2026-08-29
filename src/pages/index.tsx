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
import { todayISO } from '@/lib/dates';
import styles from './index.module.css';

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
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h3 className={styles.modalTitle}>Добавить действие</h3>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Закрыть
          </Button>
        </ModalHeader>

        <ModalBody>
          {error && <Alert variant="error">{error}</Alert>}

          <p className={`text-muted mb-md ${styles.parameterHint}`}>
            Параметр: <strong>{parameterName}</strong>
          </p>

          <FormGroup>
            <FormLabel htmlFor="entry-quantity">Количество</FormLabel>
            <FormInput
              id="entry-quantity"
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
            <FormLabel htmlFor="entry-date">Дата</FormLabel>
            <FormInput
              id="entry-date"
              type="date"
              max={todayISO()}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
              disabled={isSaving}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="entry-comment">Комментарий</FormLabel>
            <FormTextarea
              id="entry-comment"
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

          {isLoading ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>Загрузка...</p>
          ) : parameters.length === 0 ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>
              Активные параметры не найдены. Обратитесь к руководителю.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Действие</Th>
                  <Th>Вес</Th>
                  <Th align="center">Сегодня</Th>
                  <Th align="right">Действия</Th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <div>
                        <strong>{p.name}</strong>
                      </div>
                      {p.description && (
                        <div className={`text-muted ${styles.description}`}>{p.description}</div>
                      )}
                    </Td>
                    <Td>{formatWeight(p.weight)}</Td>
                    <Td align="center" semibold>
                      {quantityByParameter.get(p.id) ?? 0}
                    </Td>
                    <Td align="right">
                      <div className={styles.actions}>
                        <Button size="sm" onClick={() => handleQuickAdd(p)} disabled={isSaving}>
                          +1
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModal({ type: 'create', parameter: p })}
                          disabled={isSaving}
                        >
                          Добавить
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
