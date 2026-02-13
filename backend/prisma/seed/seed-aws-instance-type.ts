import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(
    process.cwd(),
    'prisma',
    'seed',
    'data',
    'ec2-instance-types.json',
  );
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  const records = data.InstanceTypes.map((it) => ({
    name: it.InstanceType,
    numberOfCores: it.VCpuInfo?.DefaultVCpus ?? 0,
    memoryInMB: it.MemoryInfo?.SizeInMiB ?? 0,
    raw: it,
  }));

  // delete old data first
  await prisma.awsInstanceType.deleteMany({});
  await prisma.awsInstanceType.createMany({
    data: records,
    skipDuplicates: true, // avoid errors if some IDs already exist
  });
}

main()
  .then(() => console.log('Saved all EC2 instance types as JSON'))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
