import { useState } from 'react';
import {
  Alert,
  Button,
  FormGroup,
  FormInput,
  FormLabel,
  FormTextarea,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/components/ui';
import { todayISO } from '@/lib/dates';
import styles from './EntryFormModal.module.css';

export interface EntryFormValues {
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

export function EntryFormModal({ parameterName, isSaving, onSubmit, onClose }: EntryFormModalProps) {
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
