import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 🔹 Получить все отзывы
router.get('/', async (req, res) => {
  const start = parseInt(req.query._start) || 0;
  const end = parseInt(req.query._end) || 10;
  const take = end - start;

  const [data, total] = await Promise.all([
    prisma.feedback.findMany({
      skip: start,
      take,
      orderBy: { id: 'desc' },
    }),
    prisma.feedback.count(),
  ]);

  res.setHeader(
    'Content-Range',
    `feedback ${start}-${start + data.length - 1}/${total}`
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.json(data);
});

// 🔹 Создать отзыв
router.post('/', async (req, res) => {
  try {
    const { name, description, images } = req.body;

    const created = await prisma.feedback.create({
      data: {
        name: name?.trim() || '',
        description: description || '',
        images: images || [],
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Ошибка при создании отзыва:', err);
    res.status(500).json({ error: 'Ошибка при создании' });
  }
});

// 🔹 Обновить отзыв
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, images } = req.body;

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        name: name?.trim() || '',
        description: description || '',
        images: images || [],
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Ошибка при обновлении отзыва:', err);
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
});

// 🔹 Удалить отзыв
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.feedback.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при удалении отзыва:', err);
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
});

export default router;
