import fs from "fs"
import path from "path"
import { faker } from "@faker-js/faker"

import { statuses } from "./data"
import { generateRepoName } from "@/lib/utils"

const tasks = Array.from({ length: 100 }, () => ({
  id: `R-${faker.number.int({ min: 1000, max: 9999 })}`,
  title: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
  status: faker.helpers.arrayElement(statuses).value,
  date: faker.date.anytime(),
  // resources: generateResources(),
  repository: generateRepoName(),
  // label: faker.helpers.arrayElement(labels).value,
  // priority: faker.helpers.arrayElement(priorities).value,
}))

fs.writeFileSync(
  path.join(__dirname, "tasks.json"),
  JSON.stringify(tasks, null, 2)
)

console.log("✅ Tasks data generated.")
