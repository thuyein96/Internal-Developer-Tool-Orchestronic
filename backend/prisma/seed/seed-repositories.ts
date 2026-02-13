import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const repositories = Array.from({ length: 10 }).map(() => ({
    name: `repo-${faker.word.adjective()}-${faker.word.noun()}-${faker.number.int({ min: 1, max: 999 })}`,
    description: faker.lorem.sentence(),
    resourcesId: faker.string.uuid(),
  }));

  await prisma.repository.createMany({
    data: repositories,
  });
}

main()
  .catch((e) => {
    console.error('Error seeding repositories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
