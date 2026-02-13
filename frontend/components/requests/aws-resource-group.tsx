"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

import { useSelector } from "react-redux"
import { RootState } from "@/app/state/store"
import { UseFormReturn } from "react-hook-form"
import z from "zod"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { CloudProvider, cloudProviders, regions } from "@/types/resource"
import { AwsResourceGroupAccordionVM } from "./aws-resource-group-accordion/aws-resource-group-accordion-vm"
import { AwsResourceGroupAccordionST } from "./aws-resource-group-accordion/aws-resource-group-accordion-st"
import { AwsResourceGroupAccordionDB } from "./aws-resource-group-accordion/aws-resource-group-accordion-db"
import { awsRequestFormSchema } from "./form-schema/aws"

interface ResourceGroupProps {
  form: UseFormReturn<z.infer<typeof awsRequestFormSchema>>
  cloudProvider: CloudProvider
  setCloudProvider: (value: CloudProvider) => void
  dbPolicy: {
    id: string
    maxStorage: number
  }
}

export default function AwsResourceGroup({
  form,
  cloudProvider,
  setCloudProvider,
  dbPolicy,
}: Readonly<ResourceGroupProps>) {
  const [vmCount, setVmCount] = useState(0)
  const [storageCount, setStorageCount] = useState(0)
  const [databaseCount, setDatabaseCount] = useState(0)
  const repoName = useSelector((state: RootState) => state.repoName.value)

  useEffect(() => {
    if (vmCount === 0) {
      form.setValue("resources.resourceConfig.vms", [], {
        shouldValidate: false,
        shouldDirty: true,
      })
      form.clearErrors("resources.resourceConfig.vms")
    }

    if (storageCount === 0) {
      form.setValue("resources.resourceConfig.sts", [], {
        shouldValidate: false,
        shouldDirty: true,
      })
      form.clearErrors("resources.resourceConfig.sts")
    }

    if (databaseCount === 0) {
      form.setValue("resources.resourceConfig.dbs", [], {
        shouldValidate: false,
        shouldDirty: true,
      })
      form.clearErrors("resources.resourceConfig.dbs")
    }
  }, [vmCount, form, storageCount, databaseCount])

  useEffect(() => {
    setVmCount(0)
    setStorageCount(0)
    setDatabaseCount(0)
  }, [cloudProvider])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Group</CardTitle>
        <CardDescription>
          Group related resources together to simplify management, access
          control, and organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-start w-135">
          <div className="grid w-[165px]">
            <Label htmlFor="resource-group-name">Resource Group Name</Label>
            <p className="truncate">rg-{repoName}</p>
          </div>
          <FormField
            control={form.control}
            name="resources.cloudProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cloud Provider</FormLabel>
                <FormControl>
                  <Select
                    value={cloudProvider}
                    onValueChange={(value: CloudProvider) => {
                      field.onChange(value)
                      setCloudProvider(value)
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cloudProviders.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <Image
                              src={option.icon}
                              width={16}
                              height={16}
                              alt={`${option.label} Icon`}
                            />
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-2">
            <Label htmlFor="resource-group-provider">Availability Zone</Label>
            <Select
              value={form.watch("resources.region")}
              onValueChange={(value) =>
                form.setValue("resources.region", value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions[cloudProvider].map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={
                      option.flag === "https://flagsapi.com/US/flat/16.png"
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Image
                        src={option.flag}
                        width={16}
                        height={16}
                        alt={`${option.label} Icon`}
                      />
                      {option.label}
                      {option.flag ===
                        "https://flagsapi.com/US/flat/16.png" && (
                        <span className="text-xs text-red-300">
                          (Not available)
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 mt-6 w-135">
          <Label htmlFor="resources">Resources</Label>
          <div>
            <div className="flex gap-6">
              <Label htmlFor="vm" className="w-60">
                Virtual Machines
              </Label>
              <Input
                value={vmCount}
                id="vm"
                placeholder="e.g., 2"
                type="number"
                min={0}
                onChange={(e) => setVmCount(Number(e.target.value))}
              />
            </div>
            <AwsResourceGroupAccordionVM form={form} vmCount={vmCount} />
          </div>
          <div className="">
            <div className="flex gap-6">
              <Label htmlFor="storage" className="w-60">
                Storage
              </Label>
              <Input
                value={storageCount}
                id="storage"
                placeholder="e.g., 1"
                type="number"
                min={0}
                onChange={(e) => setStorageCount(Number(e.target.value))}
              />
            </div>
            <AwsResourceGroupAccordionST
              form={form}
              storageCount={storageCount}
            />
          </div>
          <div className="">
            <div className="flex gap-6">
              <Label htmlFor="sql" className="w-60">
                Database
              </Label>
              <Input
                value={databaseCount}
                id="database"
                placeholder="e.g., 1"
                type="number"
                min={0}
                onChange={(e) => setDatabaseCount(Number(e.target.value))}
              />
            </div>
            <AwsResourceGroupAccordionDB
              form={form}
              databaseCount={databaseCount}
              dbPolicy={dbPolicy}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
