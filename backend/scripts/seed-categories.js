import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  'Technical Issue',
  'Billing',
  'Product Inquiry',
  'Complaint',
  'Support',
  'Other'
];

async function seedCategories() {
  console.log('Seeding default categories...');
  
  for (const categoryName of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
      console.log(`✓ Category "${categoryName}" seeded`);
    } catch (error) {
      console.error(`✗ Failed to seed "${categoryName}":`, error.message);
    }
  }
  
  console.log('Category seeding completed!');
}

seedCategories()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
