import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import {
  addDaysISO,
  monthStartISO,
  quarterStartISO,
  todayISO,
  weekStartISO,
  yearStartISO,
} from '@/lib/dates';

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

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Рейтинг отдела</h2>
      </div>

      <div className="card mb-lg" style={{ padding: 'var(--spacing-md)' }}>
        <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
            <button
              key={key}
              className={`btn btn-sm ${period === key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPeriod(key)}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}

          {period === 'custom' && (
            <>
              <input
                className="form-input"
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ width: 'auto' }}
              />
              <span className="text-muted">—</span>
              <input
                className="form-input"
                type="date"
                value={customTo}
                min={customFrom}
                max={todayISO()}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ width: 'auto' }}
              />
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}

          {isLoading ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Загрузка...
            </p>
          ) : data.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Нет данных за выбранный период.
            </p>
          ) : (
            <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '3rem', textAlign: 'center' }}>#</th>
                  <th>Сотрудник</th>
                  <th style={{ textAlign: 'center' }}>Записей</th>
                  <th style={{ textAlign: 'right' }}>Баллы</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.userId}>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {index + 1}
                    </td>
                    <td>
                      <strong>{row.userName}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>{row.entryCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatWeight(row.totalPoints)}
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
