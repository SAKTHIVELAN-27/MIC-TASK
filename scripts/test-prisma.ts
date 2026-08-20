import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing PrismaClient findMany...');
  try {
    const users = await prisma.user.findMany();
    console.log('✅ Standard Prisma Client queried successfully! Users count:', users.length);
  } catch (err) {
    console.error('❌ Prisma query error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
