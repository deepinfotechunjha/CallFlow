import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUsersWithEmailPhone() {
  try {
    console.log('Updating existing users with dummy email and phone...');
    
    // Get all users without email or phone
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: null },
          { phone: null }
        ]
      }
    });

    console.log(`Found ${users.length} users to update`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const dummyEmail = `${user.username.toLowerCase()}@example.com`;
      const dummyPhone = `+1234567${String(i).padStart(3, '0')}`;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: dummyEmail,
          phone: dummyPhone
        }
      });

      console.log(`Updated user ${user.username} with email: ${dummyEmail}, phone: ${dummyPhone}`);
    }

    console.log('All users updated successfully!');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsersWithEmailPhone();