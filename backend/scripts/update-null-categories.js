import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateNullCategories() {
  console.log('Updating NULL categories...');
  
  const result = await prisma.carryInService.updateMany({
    where: { category: null },
    data: { category: 'Laptop Service' }
  });
  
  console.log(`✓ Updated ${result.count} records with default category`);
}

updateNullCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
