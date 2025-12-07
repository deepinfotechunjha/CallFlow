import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateCustomerStats() {
  console.log('Starting customer stats population...');

  const customers = await prisma.customer.findMany({
    include: {
      calls: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  console.log(`Found ${customers.length} customers`);

  for (const customer of customers) {
    const totalCalls = customer.calls.length;
    const lastCallDate = customer.calls.length > 0 ? customer.calls[0].createdAt : null;

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalCalls,
        lastCallDate
      }
    });

    console.log(`Updated ${customer.name} (${customer.phone}): ${totalCalls} calls, last: ${lastCallDate}`);
  }

  console.log('✅ Customer stats populated successfully!');
  await prisma.$disconnect();
}

populateCustomerStats().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
