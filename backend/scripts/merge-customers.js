import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeCustomers() {
  console.log('Starting customer merge...');
  
  try {
    // Get all CarryInCustomers
    const carryInCustomers = await prisma.carryInCustomer.findMany({
      include: { services: true }
    });
    
    console.log(`Found ${carryInCustomers.length} carry-in customers to merge`);
    
    for (const carryInCustomer of carryInCustomers) {
      // Check if customer already exists in Customer table
      let customer = await prisma.customer.findUnique({
        where: { phone: carryInCustomer.phone }
      });
      
      if (customer) {
        // Update existing customer with carry-in service count
        const serviceCount = carryInCustomer.services.length;
        const lastService = carryInCustomer.services.length > 0 
          ? carryInCustomer.services.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          : null;
        
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            carryInServices: serviceCount,
            totalInteractions: customer.outsideCalls + serviceCount,
            lastServiceDate: lastService?.createdAt || null,
            lastActivityDate: lastService?.createdAt > customer.lastCallDate 
              ? lastService.createdAt 
              : customer.lastCallDate
          }
        });
        
        // Update CarryInService records to point to unified Customer
        await prisma.carryInService.updateMany({
          where: { customerId: carryInCustomer.id },
          data: { customerId: customer.id }
        });
        
        console.log(`✓ Merged carry-in customer: ${carryInCustomer.name} (${serviceCount} services)`);
      } else {
        // Create new customer from CarryInCustomer
        const serviceCount = carryInCustomer.services.length;
        const lastService = carryInCustomer.services.length > 0 
          ? carryInCustomer.services.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          : null;
        
        const newCustomer = await prisma.customer.create({
          data: {
            name: carryInCustomer.name,
            phone: carryInCustomer.phone,
            email: carryInCustomer.email,
            address: carryInCustomer.address,
            createdAt: carryInCustomer.createdAt,
            outsideCalls: 0,
            carryInServices: serviceCount,
            totalInteractions: serviceCount,
            lastServiceDate: lastService?.createdAt || null,
            lastActivityDate: lastService?.createdAt || carryInCustomer.createdAt
          }
        });
        
        // Update CarryInService records to point to new Customer
        await prisma.carryInService.updateMany({
          where: { customerId: carryInCustomer.id },
          data: { customerId: newCustomer.id }
        });
        
        console.log(`✓ Created new customer: ${carryInCustomer.name} (${serviceCount} services)`);
      }
    }
    
    // Update existing Customer records to use outsideCalls instead of totalCalls
    const customers = await prisma.customer.findMany();
    for (const customer of customers) {
      if (customer.totalCalls && customer.totalCalls > 0) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            outsideCalls: customer.totalCalls,
            totalInteractions: customer.totalCalls + customer.carryInServices
          }
        });
      }
    }
    
    console.log('✅ Customer merge completed successfully!');
  } catch (error) {
    console.error('❌ Error during merge:', error);
    throw error;
  }
}

mergeCustomers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());