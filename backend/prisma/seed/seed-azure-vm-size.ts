import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface AzureVMSizeData {
  name: string;
  numberOfCores: number;
  maxDataDiskCount: number;
  memoryInMB: number;
  osDiskSizeInMB: number;
  resourceDiskSizeInMB: number;
}

async function seedAzureVMSizes() {
  try {
    console.log('🚀 Starting Azure VM Size seeding...');

    // Read the JSON data file
    const dataPath = path.join(
      process.cwd(),
      'prisma',
      'seed',
      'data',
      'southeastasia-vm-sizes.json',
    );

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const parsedData = JSON.parse(rawData) as unknown;

    if (!Array.isArray(parsedData)) {
      throw new Error('Invalid JSON format: expected an array');
    }

    const vmSizes = parsedData as AzureVMSizeData[];

    console.log(`📦 Found ${vmSizes.length} VM sizes to seed`);

    // Clear existing data
    await prisma.azureVMSize.deleteMany({});
    console.log('🗑️  Cleared existing Azure VM Size data');

    // Seed the data in batches for better performance
    const batchSize = 100;
    let seededCount = 0;

    for (let i = 0; i < vmSizes.length; i += batchSize) {
      const batch = vmSizes.slice(i, i + batchSize);

      await prisma.azureVMSize.createMany({
        data: batch.map((vmSize) => ({
          name: vmSize.name,
          numberOfCores: vmSize.numberOfCores,
          maxDataDiskCount: vmSize.maxDataDiskCount,
          memoryInMB: vmSize.memoryInMB,
          osDiskSizeInMB: vmSize.osDiskSizeInMB,
          resourceDiskSizeInMB: vmSize.resourceDiskSizeInMB,
        })),
        skipDuplicates: true,
      });

      seededCount += batch.length;
      console.log(`✅ Seeded ${seededCount}/${vmSizes.length} Azure VM sizes`);
    }

    console.log('🎉 Azure VM Size seeding completed successfully!');
    return seededCount;
  } catch (error) {
    console.error('❌ Error seeding Azure VM sizes:', error);
    throw error;
  }
}

async function main() {
  await seedAzureVMSizes();
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
  .finally(() => {
    void prisma.$disconnect();
  });
