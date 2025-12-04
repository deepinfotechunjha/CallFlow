import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

(async function(){
  try {
    await prisma.$connect();
    console.log('Database connected');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Prisma connect failed:', String(err));
    process.exit(1);
  }
})();
