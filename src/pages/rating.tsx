import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import {
  Alert,
  Button,
  Card,
  CardBody,
  FormInput,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import {
  addDaysISO,
  monthStartISO,
  quarterStartISO,
  todayISO,
  weekStartISO,
  yearStartISO,
} from '@/lib/dates';
import styles from './rating.module.css';

interface RatingRow {
  userId: string;
  userName: string;
  totalPoints: number;
  entryCount: number;
}

type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
  custom: 'Диапазон',
};

function formatWeight(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getPeriodDates(key: PeriodKey, customFrom: string, customTo: string) {
  const today = todayISO();
  switch (key) {
    case 'today':
      return { from: today, to: today };
    case 'week':
      return { from: weekStartISO(), to: today };
    case 'month':
      return { from: monthStartISO(), to: today };
    case 'quarter':
      return { from: quarterStartISO(), to: today };
    case 'year':
      return { from: yearStartISO(), to: today };
    case 'custom':
      return { from: customFrom, to: customTo };
  }
}

export default function RatingPage() {
  const [data, setData] = useState<RatingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customFrom, setCustomFrom] = useState(monthStartISO());
  const [customTo, setCustomTo] = useState(todayISO());

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { from, to } = getPeriodDates(period, customFrom, customTo);
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/api/rating?${params.toString()}`);
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || 'Ошибка загрузки рейтинга');
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки рейтинга');
    } finally {
      setIsLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <Head>
        <title>Рейтинг - Статус</title>
      </Head>

      <PageHeader title="Рейтинг отдела" />

      <Card padding="md" className="mb-lg">
        <div className={`flex items-center gap-sm ${styles.filterWrap}`}>
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={period === key ? 'primary' : 'outline'}
              onClick={() => setPeriod(key)}
            >
              {PERIOD_LABELS[key]}
            </Button>
          ))}

          {period === 'custom' && (
            <>
              <FormInput
                autoWidth
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="text-muted">—</span>
              <FormInput
                autoWidth
                type="date"
                value={customTo}
                min={customFrom}
                max={todayISO()}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardBody>
          {error && <Alert variant="error">{error}</Alert>}

          {isLoading ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>Загрузка...</p>
          ) : data.length === 0 ? (
            <p className={`text-muted text-center ${styles.emptyState}`}>
              Нет данных за выбранный период.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th align="center" style={{ width: '3rem' }}>
                    #
                  </Th>
                  <Th>Сотрудник</Th>
                  <Th align="center">Записей</Th>
                  <Th align="right">Баллы</Th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.userId}>
                    <Td align="center" semibold>
                      {index + 1}
                    </Td>
                    <Td>
                      <strong>{row.userName}</strong>
                    </Td>
                    <Td align="center">{row.entryCount}</Td>
                    <Td align="right" bold>
                      {formatWeight(row.totalPoints)}
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
