import { faker } from '@faker-js/faker';

const resourceTypes = ['VM', 'DB', 'ST'];
export function generateResources() {
  const counts: Record<string, number> = {};

  const types = faker.helpers
    .shuffle(resourceTypes)
    .slice(0, faker.number.int({ min: 1, max: 3 }));

  for (const type of types) {
    counts[type] = faker.number.int({ min: 1, max: 3 });
  }

  const formatted = Object.entries(counts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

  return formatted;
}

export function generateRepoName() {
  const adjective = faker.word.adjective(); // e.g., "fast"
  const noun = faker.word.noun(); // e.g., "engine"
  return `${adjective}-${noun}`.toLowerCase();
}
