import fs from "fs"
import path from "path"
import { faker } from "@faker-js/faker"

import { generateRepoName } from "@/lib/utils"

const repositories = Array.from({ length: 100 }, () => ({
  description: faker.hacker
    .phrase()
    .replace(/^./, (letter) => letter.toUpperCase()),
  developers: Array.from({ length: faker.number.int({ min: 3, max: 5 }) }, () =>
    faker.person.fullName()
  ),
  repository: generateRepoName(),
}))

fs.writeFileSync(
  path.join(__dirname, "repositories.json"),
  JSON.stringify(repositories, null, 2)
)

console.log("✅ Repositories data generated.")
