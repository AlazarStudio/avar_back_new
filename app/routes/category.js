import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/categories?_start=0&_end=10
router.get('/', async (req, res) => {
  const start = parseInt(req.query._start) || 0;
  const end = parseInt(req.query._end) || 10;
  const take = end - start;

  const [data, total] = await Promise.all([
    prisma.category.findMany({ skip: start, take }),
    prisma.category.count(),
  ]);

  res.setHeader('Content-Range', `categories ${start}-${start + data.length - 1}/${total}`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.json(data);
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  const id = +req.params.id;
  const item = await prisma.category.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const created = await prisma.category.create({ data: { title } });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  const { title } = req.body;
  const updated = await prisma.category.update({
    where: { id: +req.params.id },
    data: { title },
  });
  res.json(updated);
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: +req.params.id } });
  res.json({ success: true });
});

export default router;
