import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultServiceCategories = [
  'Laptop Service',
  'CCTV Repair',
  'CCTV Installation',
  'Phone Repair',
  'Computer Repair',
  'Network Setup',
  'Software Installation',
  'Hardware Upgrade'
];

async function seedServiceCategories() {
  console.log('Seeding service categories...');
  
  for (const categoryName of defaultServiceCategories) {
    try {
      await prisma.serviceCategory.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
      console.log(`✓ ${categoryName}`);
    } catch (error) {
      console.log(`✗ ${categoryName} - ${error.message}`);
    }
  }
  
  console.log('Service categories seeded successfully!');
}

seedServiceCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
