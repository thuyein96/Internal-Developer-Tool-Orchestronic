import fs from "fs"
import path from "path"
import { faker } from "@faker-js/faker"

import { generateRepoName } from "@/lib/utils"

const resources = Array.from({ length: 100 }, () => {
  const repoName = generateRepoName()
  return {
    name: `${repoName}-rg`,
    // resources: generateResources(),
    developers: Array.from(
      { length: faker.number.int({ min: 3, max: 5 }) },
      () => faker.person.fullName()
    ),
    repository: repoName,
  }
})

fs.writeFileSync(
  path.join(__dirname, "resources.json"),
  JSON.stringify(resources, null, 2)
)

console.log("✅ Resources data generated.")
