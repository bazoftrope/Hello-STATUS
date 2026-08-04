import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import {
  getById,
  update,
  validateUpdateInput,
} from '@/server/services/parameters';

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
    return res.status(400).json({ error: 'Некорректный идентификатор параметра' });
  }

  const existing = await getById(id);
  if (!existing || existing.departmentId !== session.user.departmentId) {
    return res.status(404).json({ error: 'Параметр не найден' });
  }

  if (req.method === 'PATCH') {
    const { errors, values } = validateUpdateInput(req.body);
    if (!values) {
      return res.status(400).json({ error: errors.join('; ') });
    }

    const result = await update(id, values);
    return res.status(200).json(result);
  }

  res.setHeader('Allow', 'PATCH');
  return res.status(405).json({ error: 'Метод не поддерживается' });
}
