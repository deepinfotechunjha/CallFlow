import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"
const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_HOST_USERNAME || 'host';
  const password = process.env.SEED_HOST_PASSWORD || 'host123';
  const email = process.env.SEED_HOST_EMAIL || 'deepinfotechunjha@gmail.com';
  const phone = process.env.SEED_HOST_PHONE || '8799157041';
  const secretPassword = process.env.SEED_HOST_SECRET || 'secret123';

  // Check if HOST user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username }
  });

  if (existingUser) {
    console.log(`HOST user "${username}" already exists`);
    return;
  }

  // Hash passwords
  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedSecretPassword = await bcrypt.hash(secretPassword, 10);

  // Create HOST user
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      email,
      phone,
      role: 'HOST',
      secretPassword: hashedSecretPassword
    }
  });

  console.log(`HOST user created successfully:`);
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
  console.log(`Phone: ${user.phone}`);
  console.log(`Role: ${user.role}`);
  console.log(`Password: ${password}`);
  console.log(`Secret Password: ${secretPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });