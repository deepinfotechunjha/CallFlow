import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateCounters() {
  console.log('Populating customer counters...');
  
  try {
    // Get all customers and calculate their counts
    const customers = await prisma.customer.findMany({
      include: {
        calls: true,
        services: true
      }
    });
    
    console.log(`Processing ${customers.length} customers...`);
    
    for (const customer of customers) {
      const outsideCalls = customer.calls.length;
      const carryInServices = customer.services.length;
      const totalInteractions = outsideCalls + carryInServices;
      
      // Get last dates
      const lastCall = customer.calls.length > 0 
        ? customer.calls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;
      
      const lastService = customer.services.length > 0 
        ? customer.services.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;
      
      const lastActivity = [lastCall?.createdAt, lastService?.createdAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null;
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          outsideCalls,
          carryInServices,
          totalInteractions,
          lastCallDate: lastCall?.createdAt || null,
          lastServiceDate: lastService?.createdAt || null,
          lastActivityDate: lastActivity
        }
      });
      
      console.log(`✓ ${customer.name}: ${outsideCalls} calls, ${carryInServices} services, total: ${totalInteractions}`);
    }
    
    console.log('✅ Customer counters populated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

populateCounters()
  .catch(console.error)
  .finally(() => prisma.$disconnect());