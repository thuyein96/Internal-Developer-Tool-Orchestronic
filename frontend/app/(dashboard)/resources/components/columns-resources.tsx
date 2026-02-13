"use client"

import { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import { Resource } from "../data/schema-resources"
import { generateResources } from "@/lib/utils"
import { cloudProviders, regions } from "@/types/resource"
import Image from "next/image"

export const columnsResources: ColumnDef<Resource>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="">{row.getValue("name")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "cloudProvider",
    meta: {
      title: "Cloud Provider",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cloud Provider" />
    ),
    cell: ({ row }) => {
      const cloudProvider = cloudProviders.find(
        (provider) => provider.value === row.getValue("cloudProvider")
      )

      if (!cloudProvider) {
        return null
      }

      return (
        <div className="flex space-x-2">
          <Image
            src={cloudProvider.icon}
            width={16}
            height={16}
            alt={`${cloudProvider.label} Icon`}
          />
          <span>{cloudProvider.label}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "region",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Region" />
    ),
    cell: ({ row }) => {
      let region
      const cloudProvider = cloudProviders.find(
        (provider) => provider.value === row.getValue("cloudProvider")
      )
      if (cloudProvider) {
        region = regions[cloudProvider.value].find(
          (r) => r.value === row.getValue("region")
        )
      }
      return (
        <div className="flex space-x-2">
          <span className="flex items-center gap-2">
            {region?.flag && (
              <Image
                src={region.flag}
                width={16}
                height={16}
                alt={`${region.label} Flag`}
              />
            )}
            {region?.label}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "resourceConfig",
    meta: {
      title: "Resources",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resources" />
    ),
    cell: ({ row }) => {
      const resourceConfig = row.getValue(
        "resourceConfig"
      ) as Resource["resourceConfig"]
      return (
        <div className="flex space-x-2">
          <span className="">{generateResources(resourceConfig)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "repository",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Repository" />
    ),
    cell: ({ row }) => {
      const repository = row.getValue("repository") as
        | Resource["repository"]
        | null

      if (!repository) {
        return <span className="text-muted-foreground">no repo found</span>
      }

      return <span>{repository.name}</span>
    },
  },
]
