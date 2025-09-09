import { hash } from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdmin() {
  const password = await hash('ijd298uy!iun0');

  // Сначала удаляем старого
  await prisma.user.deleteMany({
    where: { login: 'admin' },
  });

  // Потом создаём нового
  await prisma.user.create({
    data: {
      login: 'admin',
      email: 'admin@admin.com',
      name: 'avaradmin',
      password,
    },
  });

  console.log('✅ Admin user recreated');
  process.exit();
}

seedAdmin();
