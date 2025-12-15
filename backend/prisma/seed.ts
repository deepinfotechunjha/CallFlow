import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed users...');
  
  // Create engineer user
  const engineer = await prisma.user.upsert({
    where: { username: 'engineer' },
    update: {},
    create: {
      username: 'engineer',
      password: await bcrypt.hash('engineer123', 10),
      role: 'ENGINEER',
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  // Create host user
  const host = await prisma.user.upsert({
    where: { username: 'host' },
    update: {},
    create: {
      username: 'host',
      password: await bcrypt.hash('host123', 10),
      role: 'HOST',
    },
  });

  console.log('Seeding completed successfully!');
  console.log('\nHere are the login details:');
  console.log('----------------------');
  console.log('Engineer User:');
  console.log('Username: engineer');
  console.log('Password: engineer123');
  console.log('----------------------');
  console.log('Admin User:');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('----------------------');
  console.log('Host User:');
  console.log('Username: host');
  console.log('Password: host123');
  console.log('----------------------');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
