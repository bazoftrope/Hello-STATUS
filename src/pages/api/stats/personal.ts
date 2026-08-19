import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { getPersonalStats } from '@/server/services/stats';
import { isValidISODate } from '@/lib/dates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  try {
    const period = parsePeriod(req.query.from, req.query.to);
    if (period === null) {
      return res.status(400).json({ error: 'Некорректный период' });
    }

    const result = await getPersonalStats(session.user.id, period);
    return res.status(200).json(result);
  } catch (err) {
    console.error(`[API] ${req.method} /api/stats/personal:`, err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

function parsePeriod(
  from: unknown,
  to: unknown
): { from?: string; to?: string } | null {
  const fromValue = typeof from === 'string' && from !== '' ? from : undefined;
  const toValue = typeof to === 'string' && to !== '' ? to : undefined;

  if (fromValue !== undefined && !isValidISODate(fromValue)) {
    return null;
  }
  if (toValue !== undefined && !isValidISODate(toValue)) {
    return null;
  }
  if (fromValue !== undefined && toValue !== undefined && fromValue > toValue) {
    return null;
  }

  return { from: fromValue, to: toValue };
}
