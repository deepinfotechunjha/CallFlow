import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample calls...');

  // Sample calls
  const calls = [
    {
      customerName: 'John Doe',
      phone: '123-456-7890',
      email: 'john@example.com',
      address: '123 Main St, City',
      problem: 'Internet connection is very slow',
      category: 'Technical Issue',
      status: 'PENDING',
      createdBy: 'host'
    },
    {
      customerName: 'Jane Smith',
      phone: '987-654-3210',
      email: 'jane@example.com',
      address: '456 Oak Ave, Town',
      problem: 'Billing inquiry about last month charges',
      category: 'Billing',
      status: 'ASSIGNED',
      assignedTo: 'user',
      createdBy: 'admin'
    },
    {
      customerName: 'Bob Johnson',
      phone: '555-123-4567',
      email: 'bob@example.com',
      address: '789 Pine Rd, Village',
      problem: 'Need information about new service plans',
      category: 'Product Inquiry',
      status: 'COMPLETED',
      assignedTo: 'user',
      completedBy: 'user',
      createdBy: 'host'
    }
  ];

  for (const callData of calls) {
    await prisma.call.create({
      data: callData
    });
  }

  console.log('✅ Sample calls created:');
  console.log('- 1 PENDING call');
  console.log('- 1 ASSIGNED call');
  console.log('- 1 COMPLETED call');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });