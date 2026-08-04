import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import {
  create,
  getByDepartment,
  validateCreateInput,
} from '@/server/services/parameters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (req.method === 'GET') {
    const includeArchived =
      session.user.role === 'manager' &&
      (req.query.includeArchived === 'true' || req.query.includeArchived === '1');
    const result = await getByDepartment(session.user.departmentId, includeArchived);
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    if (session.user.role !== 'manager') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { errors, values } = validateCreateInput(req.body);
    if (!values) {
      return res.status(400).json({ error: errors.join('; ') });
    }

    const created = await create(session.user.departmentId, values);
    return res.status(201).json(created);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Метод не поддерживается' });
}
