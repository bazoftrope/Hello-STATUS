import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import {
  monthStartISO,
  quarterStartISO,
  todayISO,
  weekStartISO,
  yearStartISO,
} from '@/lib/dates';

interface DailyStat {
  date: string;
  points: number;
  entryCount: number;
}

interface ParameterStat {
  parameterId: string;
  parameterName: string;
  totalPoints: number;
  totalQuantity: number;
  entryCount: number;
}

interface PersonalStats {
  daily: DailyStat[];
  byParameter: ParameterStat[];
  totalPoints: number;
  totalEntries: number;
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

const BAR_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

function DailyChart({ data }: { data: DailyStat[] }) {
  if (data.length === 0) return null;

  const maxPoints = Math.max(...data.map((d) => d.points), 1);
  const chartWidth = Math.max(data.length * 40, 300);
  const barWidth = Math.max(Math.min(28, (chartWidth / data.length) * 0.6), 12);
  const chartHeight = 200;
  const padding = { top: 20, right: 10, bottom: 50, left: 50 };
  const plotHeight = chartHeight - padding.top - padding.bottom;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={chartWidth + padding.left + padding.right} height={chartHeight}>
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padding.top + plotHeight * (1 - frac);
          const val = Math.round(maxPoints * frac);
          return (
            <g key={frac}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth + padding.left}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="#9ca3af"
                fontSize="11"
              >
                {val}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = padding.left + i * (chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
          const barH = (d.points / maxPoints) * plotHeight;
          const y = padding.top + plotHeight - barH;
          const label = d.date.slice(5);
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={BAR_COLORS[i % BAR_COLORS.length]}
                rx={3}
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fill="#111827"
                fontSize="10"
                fontWeight="600"
              >
                {d.points > 0 ? formatWeight(d.points) : ''}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight - padding.bottom + 15}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="10"
                transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight - padding.bottom + 15})`}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ParameterChart({ data }: { data: ParameterStat[] }) {
  if (data.length === 0) return null;

  const maxPoints = Math.max(...data.map((d) => d.totalPoints), 1);
  const barHeight = 28;
  const gap = 8;
  const labelWidth = 180;
  const chartWidth = 500;
  const totalHeight = data.length * (barHeight + gap);

  return (
    <svg width={labelWidth + chartWidth + 60} height={totalHeight}>
      {data.map((d, i) => {
        const y = i * (barHeight + gap);
        const barW = (d.totalPoints / maxPoints) * chartWidth;
        return (
          <g key={d.parameterId}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fill="#111827"
              fontSize="12"
            >
              {d.parameterName}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(barW, 2)}
              height={barHeight}
              fill={BAR_COLORS[i % BAR_COLORS.length]}
              rx={4}
            />
            <text
              x={labelWidth + barW + 8}
              y={y + barHeight / 2 + 4}
              fill="#111827"
              fontSize="12"
              fontWeight="600"
            >
              {formatWeight(d.totalPoints)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<PersonalStats | null>(null);
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

      const res = await fetch(`/api/stats/personal?${params.toString()}`);
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || 'Ошибка загрузки статистики');
      }
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
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
        <title>Статистика - Статус</title>
      </Head>

      <div className="flex items-center justify-between mb-lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Моя статистика</h2>
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

      {error && <div className="alert alert-error mb-lg">{error}</div>}

      {isLoading ? (
        <div className="card">
          <div className="card-body">
            <p className="text-muted text-center" style={{ padding: '2rem' }}>
              Загрузка...
            </p>
          </div>
        </div>
      ) : stats ? (
        <>
          <div className="flex gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: 'var(--spacing-md)', flex: '1 1 200px' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                Всего баллов
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {formatWeight(stats.totalPoints)}
              </p>
            </div>
            <div className="card" style={{ padding: 'var(--spacing-md)', flex: '1 1 200px' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                Всего записей
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {stats.totalEntries}
              </p>
            </div>
            <div className="card" style={{ padding: 'var(--spacing-md)', flex: '1 1 200px' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                Параметров
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {stats.byParameter.length}
              </p>
            </div>
          </div>

          {stats.daily.length > 0 && (
            <div className="card mb-lg">
              <div className="card-header">
                <strong>Баллы по дням</strong>
              </div>
              <div className="card-body">
                <DailyChart data={stats.daily} />
              </div>
            </div>
          )}

          {stats.byParameter.length > 0 && (
            <div className="card mb-lg">
              <div className="card-header">
                <strong>Разрез по параметрам</strong>
              </div>
              <div className="card-body" style={{ overflowX: 'auto' }}>
                <ParameterChart data={stats.byParameter} />
              </div>
            </div>
          )}

          {stats.byParameter.length > 0 && (
            <div className="card">
              <div className="card-header">
                <strong>Детали по параметрам</strong>
              </div>
              <div className="card-body">
                <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Параметр</th>
                      <th style={{ textAlign: 'center' }}>Кол-во</th>
                      <th style={{ textAlign: 'center' }}>Записей</th>
                      <th style={{ textAlign: 'right' }}>Баллы</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byParameter.map((p) => (
                      <tr key={p.parameterId}>
                        <td>{p.parameterName}</td>
                        <td style={{ textAlign: 'center' }}>{p.totalQuantity}</td>
                        <td style={{ textAlign: 'center' }}>{p.entryCount}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatWeight(p.totalPoints)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </Layout>
  );
}
