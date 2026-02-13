import { Resource } from "@/app/(dashboard)/resources/data/schema-resources"
import { AwsRequestDetail, AzureRequestDetail } from "@/types/request"
import { Role } from "@/types/role"
import { faker } from "@faker-js/faker"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

const resourceTypes: Record<string, { singular: string; plural: string }> = {
  AwsStorage: { singular: "ST", plural: "STS" },
  AzureDatabase: { singular: "DB", plural: "DBS" },
  AzureVMInstance: { singular: "VM", plural: "VMS" },
}

export function generateResources(resourceConfig: Resource["resourceConfig"]) {
  return Object.entries(resourceConfig)
    .filter(([key, value]) => key !== "id" && Array.isArray(value))
    .map(([type, items]) => {
      const count = items.length
      const labels = resourceTypes[type] ?? {
        singular: type,
        plural: `${type}s`,
      }
      const label = count > 1 ? labels.plural : labels.singular
      return `${count} ${label}`
    })
    .join(", ")
}

export function generateRepoName() {
  const adjective = faker.word.adjective() // e.g., "fast"
  const noun = faker.word.noun() // e.g., "engine"
  return `${adjective}-${noun}`.toLowerCase() // e.g., "fast-engine"
}

export function getRepoPrefix(repoName: string): string {
  const firstPart = repoName.split("-")[0]
  return firstPart.slice(0, 2)
}

export function validateFormat(name: string) {
  return /^[a-z]+(-[a-z]+)*$/.test(name)
}

export function formatRepoName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric sequences with hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

export function checkBlank(name: string) {
  return name.trim() === ""
}

export function formatResourceCounts(resource: Record<string, number>): string {
  // Remove id key
  const { ...counts } = resource

  return Object.entries(counts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
    .join(", ")
}

export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  )
}

export function haveAdminOrIT(role?: Role): boolean {
  return role === Role.Admin || role === Role.IT
}

export function formatMB(mb: number): string {
  if (mb >= 1024 * 1024) return (mb / (1024 * 1024)).toFixed(2) + " TB"
  if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB"
  return mb + " MB"
}

export function showDestroyButtonAfterCreation(
  data: AzureRequestDetail | AwsRequestDetail
): boolean {
  if (!data) {
    console.log("❌ Data is null or undefined")
    return false
  }

  if (!data.resources) {
    console.log("❌ data.resources is null or undefined")
    return false
  }

  const resourceConfig = data.resources.resourceConfig

  if (!resourceConfig || typeof resourceConfig !== "object") {
    console.log(
      "❌ resourceConfig is null, undefined, or not an object:",
      resourceConfig
    )
    return false
  }

  console.log("🔍 Checking resourceConfig:", resourceConfig)

  // Assume everything is valid until proven otherwise
  let allResourcesHaveTerraformData = true

  for (const [key, resources] of Object.entries(resourceConfig)) {
    console.log(`\n📦 Resource type: ${key}`)

    if (!Array.isArray(resources)) {
      console.log("❌ Not an array — skipping:", resources)
      continue
    }

    if (resources.length === 0) {
      console.log("⚠️ Empty array — skipping")
      continue
    }

    const allHaveTerraform = resources.every((item, idx) => {
      const state = item?.terraformState
      const valid =
        state && typeof state === "object" && Object.keys(state).length > 0

      console.log(
        `   • Item [${idx}] terraformState:`,
        state,
        "✅ Valid:",
        valid
      )
      return valid
    })

    console.log(`👉 Result for ${key}:`, allHaveTerraform)

    // If any resource type fails, immediately set to false
    if (!allHaveTerraform) {
      allResourcesHaveTerraformData = false
    }
  }

  if (allResourcesHaveTerraformData) {
    console.log("✅ All resource types have valid terraformState.")
    return true
  } else {
    console.log(
      "❌ At least one resource type has null or invalid terraformState."
    )
    return false
  }
}
