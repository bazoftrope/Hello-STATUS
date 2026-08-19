import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { getByDepartment } from '@/server/services/audit';
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

  if (session.user.role !== 'manager') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  try {
    const from = typeof req.query.from === 'string' && req.query.from !== '' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' && req.query.to !== '' ? req.query.to : undefined;

    if (from !== undefined && !isValidISODate(from)) {
      return res.status(400).json({ error: 'Некорректная дата' });
    }
    if (to !== undefined && !isValidISODate(to)) {
      return res.status(400).json({ error: 'Некорректная дата' });
    }

    const result = await getByDepartment(session.user.departmentId, { from, to });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[API] GET /api/audit:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
