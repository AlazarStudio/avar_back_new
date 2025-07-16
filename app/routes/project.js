import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 🔹 Получить все проекты (с пагинацией и сортировкой для React Admin)
router.get('/', async (req, res) => {
  const start = parseInt(req.query._start) || 0;
  const end = parseInt(req.query._end) || 10;
  const take = end - start;
  const favorite = req.query.favorite === 'true';

  const where = req.query.favorite ? { favorite } : {};

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      skip: start,
      take,
      where,
      orderBy: { id: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  res.setHeader(
    'Content-Range',
    `projects ${start}-${start + data.length - 1}/${total}`
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.json(data);
});

// 🔹 Получить один проект
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return res.status(404).json({ error: 'Проект не найден' });
  res.json(project);
});

// 🔹 Создать проект
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      images,
      favorite = false,
    } = req.body;

    const imagePaths = Array.isArray(images)
      ? images.map((img) => (typeof img === 'string' ? img : img.src))
      : [];

    const created = await prisma.project.create({
      data: {
        title: title?.trim() || '',
        description: description || '',
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        images: imagePaths,
        favorite,
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
    const { title, description, categoryId, images, favorite } = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Проект не найден' });

    const updated = await prisma.project.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        categoryId: categoryId ? parseInt(categoryId, 10) : existing.categoryId,
        images: images || existing.images,
        favorite: typeof favorite === 'boolean' ? favorite : existing.favorite,
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
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Проект не найден' });

  await prisma.project.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
