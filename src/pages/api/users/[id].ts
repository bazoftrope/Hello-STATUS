import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { setActive, validateSetActiveInput } from '@/server/services/users';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (session.user.role !== 'manager') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const { id } = req.query;
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Некорректный идентификатор пользователя' });
  }

  try {
    if (req.method === 'PATCH') {
      const { errors, values } = validateSetActiveInput(req.body);
      if (values === null) {
        return res.status(400).json({ error: errors.join('; ') });
      }

      if (values === false && id === session.user.id) {
        return res.status(400).json({ error: 'Нельзя деактивировать собственный аккаунт' });
      }

      const result = await setActive(id, values, session.user.departmentId);
      if (!result) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
      }

      return res.status(200).json(result);
    }

    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  } catch (err) {
    console.error(`[API] PATCH /api/users/${id}:`, err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
