import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { getByDepartment } from '@/server/services/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (session.user.role !== 'manager') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  try {
    if (req.method === 'GET') {
      const result = await getByDepartment(session.user.departmentId);
      return res.status(200).json(result);
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  } catch (err) {
    console.error('[API] GET /api/users:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
