// prisma/seed.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cloudProviders = ['AWS', 'Azure'];

  const requestsData = Array.from({ length: 10 }).map(() => ({
    id: faker.string.uuid(),
    repositoryName: `repo-${faker.word.adjective()}-${faker.word.noun()}`,
    resourceGroup: `resource-group-${faker.word.noun()}-${faker.number.int({ min: 100, max: 999 })}`,
    description: faker.lorem.sentence(),
    resourcesId: `resources-${faker.string.alphanumeric(10)}`,
    resources: {
      VM: faker.number.int({ min: 0, max: 4 }),
      DB: faker.number.int({ min: 0, max: 4 }),
      ST: faker.number.int({ min: 0, max: 4 }),
    },
    region: faker.location.city().toLowerCase().replace(/\s+/g, '-'),
    cloudProvider: faker.helpers.arrayElement(cloudProviders),
    userId: faker.string.uuid(),
    userName: faker.internet.userName(),
    displayCode: `display-${faker.string.alphanumeric(8)}`,
    ownerId: faker.string.uuid(),
    repositoryId: `repo-${faker.string.alphanumeric(12)}`,
  }));

  await prisma.request.createMany({
    data: requestsData,
  });

  await prisma.request.createMany({
    data: requestsData,
  });
}

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
``;
