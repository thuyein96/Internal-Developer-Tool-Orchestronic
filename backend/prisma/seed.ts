import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  await import('./seed/seed-aws-db');
  await import('./seed/seed-azure-vm-size');
  await import('./seed/seed-policy');
  await import('./seed/seed-aws-instance-type');
  // await import('./seed/seed-user');
  // await import('./seed/seed-repositories');
  // await import('./seed/seed-request');

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
