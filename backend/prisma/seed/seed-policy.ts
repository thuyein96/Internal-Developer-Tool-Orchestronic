import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.azurePolicyVM.deleteMany({});
  await prisma.azurePolicyDatabase.deleteMany({});
  await prisma.azurePolicyStorage.deleteMany({});

  //Azure
  await prisma.azurePolicyVM.create({
    data: {
      name: 'Standard_B1ls',
      numberOfCores: 1,
      memoryInMB: 512,
    },
  });
  await prisma.azurePolicyDatabase.create({
    data: {
      maxStorage: 100,
    },
  });
  await prisma.azurePolicyStorage.create({
    data: {
      maxStorage: 200,
    },
  });

  //aws
  await prisma.awsPolicyVM.create({
    data: {
      name: 'm6i.xlarge',
      numberOfCores: 4,
      memoryInMB: 16384,
    },
  });
  await prisma.awsPolicyDatabase.create({
    data: {
      maxStorage: 100,
    },
  });
  await prisma.awsPolicyStorage.create({
    data: {
      maxStorage: 200,
    },
  });
}

main()
  .catch((e) => {
    console.error('Error seeding policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
