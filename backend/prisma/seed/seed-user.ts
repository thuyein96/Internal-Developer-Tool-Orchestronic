import { PrismaClient, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {}

main()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      console.error('❌ Seeding error:', e.message);
    } else {
      console.error('❌ Seeding error:', e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
