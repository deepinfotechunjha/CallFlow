import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.call.deleteMany();
    await prisma.carryInService.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    await prisma.serviceCategory.deleteMany();

    console.log('✅ Existing data cleared');

    // Create users with email and phone
    console.log('👥 Creating users...');
    
    const users = [
      {
        username: 'host',
        password: 'host123',
        email: 'host@callmanagement.com',
        phone: '+1234567890',
        role: 'HOST',
        secretPassword: 'HOSTSECRET123'
      },
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@callmanagement.com',
        phone: '+1234567891',
        role: 'ADMIN',
        secretPassword: 'DEFAULTSECRET'
      },
      {
        username: 'engineer1',
        password: 'engineer123',
        email: 'engineer1@callmanagement.com',
        phone: '+1234567892',
        role: 'ENGINEER',
        secretPassword: 'DEFAULTSECRET'
      },
      {
        username: 'engineer2',
        password: 'engineer123',
        email: 'engineer2@callmanagement.com',
        phone: '+1234567893',
        role: 'ENGINEER',
        secretPassword: 'DEFAULTSECRET'
      },
      {
        username: 'manager',
        password: 'manager123',
        email: 'manager@callmanagement.com',
        phone: '+1234567894',
        role: 'ADMIN',
        secretPassword: 'DEFAULTSECRET'
      }
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          secretPassword: userData.secretPassword
        }
      });

      console.log(`✅ Created user: ${user.username} (${user.email}, ${user.phone})`);
    }

    // Create some default categories
    console.log('📂 Creating categories...');
    const categories = [
      'Hardware Issue',
      'Software Problem',
      'Network Connectivity',
      'Installation Support',
      'Maintenance',
      'General Inquiry'
    ];

    for (const categoryName of categories) {
      await prisma.category.create({
        data: { name: categoryName }
      });
    }

    // Create some default service categories
    console.log('🔧 Creating service categories...');
    const serviceCategories = [
      'Laptop Repair',
      'Desktop Repair',
      'Mobile Repair',
      'Printer Service',
      'Network Setup',
      'Data Recovery'
    ];

    for (const serviceCategoryName of serviceCategories) {
      await prisma.serviceCategory.create({
        data: { name: serviceCategoryName }
      });
    }

    // Create some sample customers
    console.log('👤 Creating sample customers...');
    const customers = [
      {
        name: 'John Doe',
        phone: '+9876543210',
        email: 'john.doe@customer.com',
        address: '123 Main St, City'
      },
      {
        name: 'Jane Smith',
        phone: '+9876543211',
        email: 'jane.smith@customer.com',
        address: '456 Oak Ave, Town'
      },
      {
        name: 'Bob Johnson',
        phone: '+9876543212',
        email: 'bob.johnson@customer.com',
        address: '789 Pine Rd, Village'
      }
    ];

    for (const customerData of customers) {
      await prisma.customer.create({
        data: customerData
      });
    }

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('HOST: username=host, password=host123, secret=HOSTSECRET123');
    console.log('ADMIN: username=admin, password=admin123');
    console.log('ADMIN: username=manager, password=manager123');
    console.log('ENGINEER: username=engineer1, password=engineer123');
    console.log('ENGINEER: username=engineer2, password=engineer123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });