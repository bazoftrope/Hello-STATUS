import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import {
  EntryError,
  getRawById,
  remove,
  update,
  validateUpdateInput,
} from '@/server/services/entries';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const { id } = req.query;
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Некорректный идентификатор записи' });
  }

  try {
    if (req.method === 'PATCH') {
      const { errors, values } = validateUpdateInput(req.body);
      if (!values) {
        return res.status(400).json({ error: errors.join('; ') });
      }
      const result = await update(id, session.user, values);
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE') {
      const existing = await getRawById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Запись не найдена' });
      }
      await remove(id, session.user);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'PATCH, DELETE');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  } catch (err) {
    if (err instanceof EntryError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}
