import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial users...');

  // Create HOST user
  const hostPassword = await bcrypt.hash('host123', 10);
  const host = await prisma.user.upsert({
    where: { username: 'host' },
    update: {},
    create: {
      username: 'host',
      password: hostPassword,
      email: 'host@callflow.com',
      phone: '+1234567890',
      role: 'HOST',
      secretPassword: 'SECRET123'
    }
  });

  // Create ADMIN user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@callflow.com',
      phone: '+1234567889',
      role: 'ADMIN'
    }
  });

  // Create USER
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: userPassword,
      email: 'user@callflow.com',
      phone: '+1234567888',
      role: 'ENGINEER'
    }
  });

  // Create second HOST user
  const host2Password = await bcrypt.hash('host456', 10);
  const host2 = await prisma.user.upsert({
    where: { username: 'host2' },
    update: {},
    create: {
      username: 'host2',
      password: host2Password,
      email: 'host2@callflow.com',
      phone: '+1234567891',
      role: 'HOST',
      secretPassword: 'SECRET456'
    }
  });

  console.log('✅ Users created:');
  console.log('HOST: username=host, password=host123');
  console.log('ADMIN: username=admin, password=admin123');
  console.log('USER: username=user, password=user123');
  console.log('HOST2: username=host2, password=host456, email=host2@callflow.com, secretPassword=SECRET456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });