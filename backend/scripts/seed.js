import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_HOST_USERNAME;
  const password = process.env.SEED_HOST_PASSWORD;
  const secretPassword = process.env.SEED_SECRET_PASSWORD;

  if (!username || !password || !secretPassword) {
    console.error('SEED_HOST_USERNAME, SEED_HOST_PASSWORD, and SEED_SECRET_PASSWORD environment variables are required');
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
      secretPassword
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