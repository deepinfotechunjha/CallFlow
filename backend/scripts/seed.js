import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  // Require seed credentials via environment variables to avoid dummy defaults
  const username = process.env.SEED_HOST_USERNAME;
  const password = process.env.SEED_HOST_PASSWORD;
  const role = 'HOST';

  if (!username || !password) {
    console.error('SEED_HOST_USERNAME and SEED_HOST_PASSWORD must be set to run the seed script. Aborting.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hashed, role },
    create: { username, password: hashed, role },
  });

  console.log(`Seeded user: ${user.username} (role=${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
