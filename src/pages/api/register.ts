import { NextApiRequest, NextApiResponse } from 'next';
import { register, validateRegisterInput } from '@/server/services/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  const { errors, values } = validateRegisterInput(req.body);
  if (!values) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  try {
    const user = await register(values);
    return res.status(201).json(user);
  } catch (err) {
    if (err instanceof Error && err.message.includes('уже зарегистрирован')) {
      return res.status(409).json({ error: err.message });
    }

    console.error('[API] POST /api/register:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
