import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding new HOST user...');

  // Create second HOST user
  const host2Password = await bcrypt.hash('host456', 10);
  
  try {
    const host2 = await prisma.user.create({
      data: {
        username: 'host2',
        password: host2Password,
        email: 'shruti308patel@gmail.com',
        phone: '+9876543210',
        role: 'HOST',
        secretPassword: 'SECRET456'
      }
    });

    console.log('✅ New HOST user created:');
    console.log('Username: host2');
    console.log('Password: host456');
    console.log('Email: host2@callflow.com');
    console.log('Secret Password: SECRET456');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ User already exists or phone/email conflict');
    } else {
      console.error('Error:', error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });