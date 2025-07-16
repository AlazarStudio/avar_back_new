import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 🔹 Получить все записи с заголовками для React Admin
router.get('/', async (req, res) => {
  const start = parseInt(req.query._start) || 0;
  const end = parseInt(req.query._end) || 10;
  const take = end - start;

  const [data, total] = await Promise.all([
    prisma.beratung.findMany({
      skip: start,
      take,
      orderBy: { id: 'desc' },
    }),
    prisma.beratung.count(),
  ]);

  res.setHeader(
    'Content-Range',
    `beratung ${start}-${start + data.length - 1}/${total}`
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.json(data);
});

// 🔹 Создание записи
router.post('/', async (req, res) => {
  try {
    const { name, email, message, service, phone } = req.body;

    const created = await prisma.beratung.create({
      data: {
        name,
        email,
        nachricht: message,
        service,
        phoneNumber: phone,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err); // ← добавь для отладки
    res.status(500).json({ error: 'Ошибка при создании' });
  }
});

// 🔹 Удаление записи
router.delete('/:id', async (req, res) => {
  await prisma.beratung.delete({ where: { id: +req.params.id } });
  res.json({ success: true });
});

export default router;
