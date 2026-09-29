import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import {
  create,
  EntryError,
  getByDepartment,
  getByUser,
  isUserInDepartment,
  validateCreateInput,
} from '@/server/services/entries';
import { isValidISODate } from '@/lib/dates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    if (req.method === 'GET') {
      const period = parsePeriod(req.query.from, req.query.to);
      if (period === null) {
        return res.status(400).json({ error: 'Некорректный период' });
      }

      const userId = req.query.userId;

      if (session.user.role !== 'manager') {
        if (userId !== undefined && userId !== session.user.id) {
          return res.status(403).json({ error: 'Недостаточно прав' });
        }
        const result = await getByUser(session.user.id, period);
        return res.status(200).json(result);
      }

      if (typeof userId === 'string' && userId !== session.user.id) {
        const allowed = await isUserInDepartment(userId, session.user.departmentId);
        if (!allowed) {
          return res.status(404).json({ error: 'Сотрудник не найден' });
        }
        const result = await getByUser(userId, period);
        return res.status(200).json(result);
      }

      if (userId === undefined) {
        const result = await getByDepartment(session.user.departmentId, period);
        return res.status(200).json(result);
      }

      // Руководитель пытается получить свои личные записи — не положено
      return res.status(403).json({ error: 'Руководители не ведут личные действия' });
    }

    if (req.method === 'POST') {
      const { errors, values } = validateCreateInput(req.body);
      if (!values) {
        return res.status(400).json({ error: errors.join('; ') });
      }
      const requestedUserId = (req.body as Record<string, unknown>).userId;
      // Руководители не ведут личные действия: без userId им запрещено создавать за себя
      if (session.user.role === 'manager') {
        if (
          requestedUserId === undefined ||
          requestedUserId === null ||
          requestedUserId === '' ||
          requestedUserId === session.user.id
        ) {
          return res.status(403).json({
            error: 'Руководители не ведут личные действия. Укажите сотрудника (userId) в «Журнале записей»',
          });
        }
      }
      // Руководитель может указать userId для создания записи за сотрудника
      let targetUserId = session.user.id;
      if (requestedUserId !== undefined && requestedUserId !== null && requestedUserId !== '') {
        if (typeof requestedUserId !== 'string') {
          return res.status(400).json({ error: 'Некорректный идентификатор сотрудника' });
        }
        if (session.user.role !== 'manager') {
          return res.status(403).json({ error: 'Недостаточно прав' });
        }
        if (requestedUserId !== session.user.id) {
          const allowed = await isUserInDepartment(requestedUserId, session.user.departmentId);
          if (!allowed) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
          }
        }
        targetUserId = requestedUserId;
      }
      const actor = {
        id: session.user.id,
        role: session.user.role as 'employee' | 'manager',
        departmentId: session.user.departmentId,
      };
      const created = await create(targetUserId, values, actor);
      return res.status(201).json(created);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  } catch (err) {
    if (err instanceof EntryError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
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
