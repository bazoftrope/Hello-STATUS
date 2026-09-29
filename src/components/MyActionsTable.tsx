import { useState } from 'react';
import { Button, Table, Td, Th } from '@/components/ui';
import styles from './MyActionsTable.module.css';

export interface MyActionsParameter {
  id: string;
  name: string;
  description: string | null;
  weight: number;
}

interface MyActionsTableProps {
  parameters: MyActionsParameter[];
  quantityByParameter: Map<string, number>;
  isSaving: boolean;
  isLoading?: boolean;
  onQuickAdd: (parameter: MyActionsParameter) => void;
  onOpenCreate: (parameter: MyActionsParameter) => void;
}

function formatWeight(weight: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(weight);
}

export function MyActionsTable({
  parameters,
  quantityByParameter,
  isSaving,
  isLoading = false,
  onQuickAdd,
  onOpenCreate,
}: MyActionsTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <p className={`text-muted text-center ${styles.emptyState}`}>Загрузка...</p>;
  }

  if (parameters.length === 0) {
    return (
      <p className={`text-muted text-center ${styles.emptyState}`}>
        Активные параметры не найдены. Обратитесь к руководителю.
      </p>
    );
  }

  return (
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
        {parameters.map((p) => {
          const isExpanded = expandedIds.has(p.id);
          const hasDescription = Boolean(p.description);
          return (
            <tr key={p.id} className={hasDescription ? styles.rowExpandable : undefined}>
              <Td className={styles.nameCell}>
                <div
                  className={`${styles.nameWrap} ${hasDescription ? styles.nameWrapClickable : ''}`}
                  onClick={() => hasDescription && toggle(p.id)}
                  role={hasDescription ? 'button' : undefined}
                  tabIndex={hasDescription ? 0 : undefined}
                  aria-expanded={hasDescription ? isExpanded : undefined}
                  aria-label={hasDescription ? (isExpanded ? 'Скрыть описание' : 'Показать описание') : undefined}
                  title={hasDescription ? (isExpanded ? 'Скрыть описание' : 'Показать описание') : undefined}
                  onKeyDown={(e) => {
                    if (hasDescription && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      toggle(p.id);
                    }
                  }}
                >
                  <strong className={styles.name}>{p.name}</strong>
                  {hasDescription && (
                    <span
                      className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  )}
                </div>
                {hasDescription && isExpanded && (
                  <div className={`text-muted ${styles.description} ${styles.descriptionExpanded}`}>
                    {p.description}
                  </div>
                )}
              </Td>
              <Td>{formatWeight(p.weight)}</Td>
              <Td align="center" semibold>
                {quantityByParameter.get(p.id) ?? 0}
              </Td>
              <Td align="right">
                <div className={styles.actions}>
                  <Button size="sm" onClick={() => onQuickAdd(p)} disabled={isSaving}>
                    +1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenCreate(p)}
                    disabled={isSaving}
                  >
                    Добавить
                  </Button>
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
