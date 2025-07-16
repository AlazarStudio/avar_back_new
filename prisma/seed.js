import { hash } from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdmin() {
  const password = await hash('admin');

  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      email: 'admin@admin.com',
      name: 'admin',
      password,
    },
  });

  console.log('✅ Admin user created');
  process.exit();
}

seedAdmin();
