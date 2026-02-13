import { Engine, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  let dataPath = path.join(
    process.cwd(),
    'prisma',
    'seed',
    'data',
    'db-postgres-instance-class.json',
  );
  let raw = fs.readFileSync(dataPath, 'utf-8');
  let data = JSON.parse(raw);

  let records = data.map((it) => ({
    engine: Engine.PostgreSQL,
    DBInstanceClass: it.DBInstanceClass,
    raw: it,
    MinStorageSize: parseInt(it.MinStorageSize, 10),
    MaxStorageSize: parseInt(it.MaxStorageSize, 10),
  }));

  // delete old data first
  await prisma.awsDatabaseType.deleteMany({
    where: { engine: Engine.PostgreSQL },
  });
  await prisma.awsDatabaseType.createMany({
    data: records,
    skipDuplicates: true, // avoid errors if some IDs already exist
  });

  dataPath = path.join(
    process.cwd(),
    'prisma',
    'seed',
    'data',
    'db-mysql-instance-class.json',
  );
  raw = fs.readFileSync(dataPath, 'utf-8');
  data = JSON.parse(raw);

  records = data.map((it) => ({
    engine: Engine.MySQL,
    DBInstanceClass: it.DBInstanceClass,
    raw: it,
    MinStorageSize: parseInt(it.MinStorageSize, 10),
    MaxStorageSize: parseInt(it.MaxStorageSize, 10),
  }));

  // delete old data first
  await prisma.awsDatabaseType.deleteMany({
    where: { engine: Engine.MySQL },
  });
  await prisma.awsDatabaseType.createMany({
    data: records,
    skipDuplicates: true, // avoid errors if some IDs already exist
  });
}

main()
  .then(() => console.log('Saved all DB instance types as JSON'))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
