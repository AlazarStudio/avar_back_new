import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();

// создаём transporter ОДИН раз (без env)
const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.de',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'K764544179', // логин от почты IONOS
    pass: 'Abakarov8800', // пароль от почты
  },
  tls: { ciphers: 'TLSv1.2' },
});

// 🔹 Получить все записи (React Admin)
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

// 🔹 Создание записи + письмо на почту
router.post('/', async (req, res) => {
  try {
    const { name, email, message, service, phone } = req.body;

    // 1) Сохраняем в БД
    const created = await prisma.beratung.create({
      data: {
        name,
        email,
        nachricht: message,
        service,
        phoneNumber: phone,
      },
    });

    // 2) Отправляем письмо
    const mail = {
      from: '"Сайт AVAR" <info@avar-kiel.de>',
      to: 'info@avar-kiel.de', // шлём самому себе
      subject: `Новая заявка (Beratung): ${service || 'без услуги'}`,
      text: `Имя: ${name || '-'}
Email: ${email || '-'}
Телефон: ${phone || '-'}
Услуга: ${service || '-'}
Сообщение:
${message || '-'}

#${created.id} • ${new Date().toLocaleString()}`,
      replyTo: email || undefined,
    };

    transporter.sendMail(mail).catch((err) => {
      console.error('Email send error:', err.message);
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Create Beratung error:', err);
    res.status(500).json({ error: 'Ошибка при создании' });
  }
});

// 🔹 Удаление записи
router.delete('/:id', async (req, res) => {
  await prisma.beratung.delete({ where: { id: +req.params.id } });
  res.json({ success: true });
});

export default router;
