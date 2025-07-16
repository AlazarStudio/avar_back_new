import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 🔹 Получить все проекты (с пагинацией и сортировкой для React Admin)
router.get('/', async (req, res) => {
  const start = parseInt(req.query._start) || 0;
  const end = parseInt(req.query._end) || 10;
  const take = end - start;

  const [data, total] = await Promise.all([
    prisma.handwerk.findMany({
      skip: start,
      take,
      orderBy: { id: 'desc' },
    }),
    prisma.handwerk.count(),
  ]);

  res.setHeader(
    'Content-Range',
    `handwerk ${start}-${start + data.length - 1}/${total}`
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.json(data);
});

// 🔹 Получить один проект
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const handwerk = await prisma.handwerk.findUnique({ where: { id } });
  if (!handwerk) return res.status(404).json({ error: 'Проект не найден' });
  res.json(handwerk);
});

// 🔹 Создать проект
router.post('/', async (req, res) => {
  try {
    const { title, description, images } = req.body;

    const imagePaths = Array.isArray(images)
      ? images.map((img) => (typeof img === 'string' ? img : img.src))
      : [];

    const created = await prisma.handwerk.create({
      data: {
        title: title?.trim() || '',
        description: description || '',
        images: imagePaths,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Ошибка при создании проекта:', err);
    res
      .status(500)
      .json({ error: err.message || 'Ошибка при создании проекта' });
  }
});

// 🔹 Обновить проект
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, images } = req.body;

    const existing = await prisma.handwerk.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Проект не найден' });

    const updated = await prisma.handwerk.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        images: images || existing.images,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Ошибка при обновлении проекта:', err);
    res.status(500).json({ error: 'Ошибка при обновлении проекта' });
  }
});

// 🔹 Удалить проект
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await prisma.handwerk.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Проект не найден' });

  await prisma.handwerk.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
