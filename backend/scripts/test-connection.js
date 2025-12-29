import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, phone: true, role: true }
    });
    
    console.log(`👥 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}, ${user.phone}) - ${user.role}`);
    });
    
    console.log('\n🎉 Backend is ready!');
    console.log('\n📋 Test Login Credentials:');
    console.log('HOST: username=host, password=host123, secret=HOSTSECRET123');
    console.log('ADMIN: username=admin, password=admin123');
    console.log('ENGINEER: username=engineer1, password=engineer123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();