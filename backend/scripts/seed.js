import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_HOST_USERNAME;
  const password = process.env.SEED_HOST_PASSWORD;

  if (!username || !password) {
    console.error('SEED_HOST_USERNAME and SEED_HOST_PASSWORD environment variables are required');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password: hashedPassword,
      email: `${username}@example.com`,
      phone: '1234567890',
      role: 'HOST',
      secretPassword: 'DEFAULTSECRET'
    }
  });

  console.log('HOST user created:', user.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });