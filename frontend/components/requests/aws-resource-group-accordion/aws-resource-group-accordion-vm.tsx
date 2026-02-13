"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useEffect, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UseFormReturn } from "react-hook-form"
import z from "zod"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { AwsVmSizeDto } from "@/types/request"
import React from "react"
import { getPriceOfVM } from "@/app/api/requests/api"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form"
import { AwsVMSizeCombobox } from "../aws-combobox"
import { awsRequestFormSchema } from "../form-schema/aws"

export const operatingSystems = [
  { value: "ubuntu", label: "Ubuntu 22.04 LTS", icon: "/icon/ubuntu.png" },
  { value: "windows", label: "Windows", icon: "/icon/windows.png" },
]

interface ResourceGroupAccordionProps {
  form: UseFormReturn<z.infer<typeof awsRequestFormSchema>>
  vmCount: number
}

export function AwsResourceGroupAccordionVM({
  form,
  vmCount,
}: Readonly<ResourceGroupAccordionProps>) {
  const lastVMRef = useRef<HTMLDivElement | null>(null)
  // Per-VM selectedVmSize state
  const [selectedVmSizes, setSelectedVmSizes] = useState<
    (AwsVmSizeDto | undefined)[]
  >([])

  useEffect(() => {
    // Initialize or preserve selectedVmSizes when vmCount changes
    setSelectedVmSizes((prev) => {
      const arr = Array(vmCount).fill(undefined)
      prev.forEach((val, idx) => {
        if (idx < arr.length) arr[idx] = val
      })
      return arr
    })
    if (lastVMRef.current) {
      lastVMRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [vmCount])

  return (
    <div className="flex flex-col">
      {vmCount > 0 && (
        <Accordion type="single" collapsible>
          {Array.from({ length: vmCount }).map((_, i) => (
            <VMAccordionItem
              key={i}
              index={i}
              form={form}
              selectedVmSize={selectedVmSizes[i]}
              setSelectedVmSize={(val) => {
                setSelectedVmSizes((prev) => {
                  const arr = [...prev]
                  arr[i] = val
                  return arr
                })
              }}
              ref={i === Math.floor(vmCount / 3) ? lastVMRef : null}
            />
          ))}
        </Accordion>
      )}
    </div>
  )
}

interface VMAccordionItemProps {
  form: UseFormReturn<z.infer<typeof awsRequestFormSchema>>
  index: number
  selectedVmSize: AwsVmSizeDto | undefined
  setSelectedVmSize: (val: AwsVmSizeDto | undefined) => void
}

const VMAccordionItem = React.forwardRef<HTMLDivElement, VMAccordionItemProps>(
  ({ form, index, selectedVmSize, setSelectedVmSize }, ref) => {
    const { data, isLoading, error } = useQuery({
      queryKey: [
        "vmPrice",
        selectedVmSize?.name,
        form.getValues("resources.region"),
      ],
      queryFn: () =>
        getPriceOfVM(
          selectedVmSize?.name || "",
          form.getValues("resources.region")
        ),
      enabled: !!selectedVmSize && !!form.getValues("resources.region"),
    })

    const priceItem = data?.Items.find(
      (item) =>
        item.armSkuName === selectedVmSize?.name &&
        !item.productName.toLowerCase().includes("windows")
    )

    const price = priceItem?.retailPrice
    const currency = priceItem?.currencyCode
    return (
      <AccordionItem value={`virtual-machine-${index}`} ref={ref}>
        <AccordionTrigger className="cursor-pointer">
          Virtual Machines #{index + 1}
        </AccordionTrigger>
        <AccordionContent forceMount>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>VM #{index + 1}</CardTitle>
                <CardDescription>
                  Configure virtual machine settings
                </CardDescription>
              </div>
              <div>
                <CardDescription>
                  {isLoading
                    ? "Calculating price..."
                    : error
                      ? "Error loading price"
                      : price != null && currency
                        ? `${(price * 24 * 30).toFixed(2)} ${currency} / month`
                        : "No price available"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              <FormField
                control={form.control}
                name={`resources.resourceConfig.vms.${index}.instanceName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., web-server-1" {...field} />
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name={`resources.resourceConfig.vms.${index}.sgName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Group Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., sg-web-servers"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name={`resources.resourceConfig.vms.${index}.keyName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., keypair-name" {...field} />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* VM Size and OS */}
              <div className="flex justify-between gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name={`resources.resourceConfig.vms.${index}.awsInstanceTypeId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EC2 Instance Type</FormLabel>
                        <FormControl>
                          <AwsVMSizeCombobox
                            usePolicyFilter={false}
                            selectedValue={selectedVmSize}
                            setSelectedValue={setSelectedVmSize}
                            handleSelect={(vmSize) => {
                              console.log("✅ VM Selected:", vmSize)
                              setSelectedVmSize(vmSize)
                              field.onChange(vmSize.id)
                            }}
                          />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name={`resources.resourceConfig.vms.${index}.os`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating System</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger className="w-54">
                              <SelectValue placeholder="Choose OS" />
                            </SelectTrigger>
                            <SelectContent>
                              {operatingSystems.map((os) => (
                                <SelectItem
                                  key={os.label}
                                  value={os.value}
                                  disabled={os.value === "windows"}
                                >
                                  <div className="flex items-center gap-2">
                                    <Image
                                      src={os.icon}
                                      width={16}
                                      height={16}
                                      alt={`${os.label} icon`}
                                    />
                                    {os.label}
                                    {os.value === "windows" && (
                                      <span className="text-xs text-red-300">
                                        (Not available)
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Auto-filled VM details */}
              <div className="flex justify-between gap-4">
                <div className="grid gap-2">
                  <Label>CPU Cores</Label>
                  <Input
                    disabled
                    placeholder="Auto-filled from VM size"
                    type="number"
                    value={selectedVmSize?.numberOfCores?.toString() || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>RAM (GB)</Label>
                  <Input
                    disabled
                    placeholder="Auto-filled from VM size"
                    type="number"
                    value={
                      selectedVmSize?.memoryInMB !== undefined
                        ? (selectedVmSize.memoryInMB / 1024).toFixed(1)
                        : ""
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    )
  }
)
VMAccordionItem.displayName = "VMAccordionItem"
