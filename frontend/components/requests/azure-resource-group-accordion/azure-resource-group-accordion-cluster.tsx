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
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { VmSizeDto } from "@/types/request"
import React from "react"
import { fetchClusterSizes } from "@/app/api/policy/azure/api"
import { getPriceOfVM } from "@/app/api/requests/api"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form"
import { azureRequestFormSchema } from "../form-schema/azure"

export const operatingSystems = [
  { value: "ubuntu", label: "Ubuntu 22.04 LTS", icon: "/icon/ubuntu.png" },
  { value: "windows", label: "Windows", icon: "/icon/windows.png" },
]

interface ResourceGroupAccordionProps {
  form: UseFormReturn<z.infer<typeof azureRequestFormSchema>>
  vmCount: number
}

export function ResourceGroupAccordionCluster({
  form,
  vmCount,
}: Readonly<ResourceGroupAccordionProps>) {
  const lastVMRef = useRef<HTMLDivElement | null>(null)
  // Per-VM selectedVmSize state
  const [selectedVmSizes, setSelectedVmSizes] = useState<
    (VmSizeDto | undefined)[]
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
  form: UseFormReturn<z.infer<typeof azureRequestFormSchema>>
  index: number
  selectedVmSize: VmSizeDto | undefined
  setSelectedVmSize: (val: VmSizeDto | undefined) => void
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
                name={`resources.resourceConfig.vms.${index}.name`}
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

              {/* VM Size and OS */}
              <div className="flex justify-between gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name={`resources.resourceConfig.vms.${index}.sizeId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VM Size</FormLabel>
                        <FormControl>
                          <AzureClusterSizeCombobox
                            usePolicyFilter={false}
                            selectedValue={selectedVmSize}
                            setSelectedValue={setSelectedVmSize}
                            handleSelect={(vmSize) => {
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

interface AzureClusterSizeComboboxProps {
  selectedValue: VmSizeDto | undefined
  setSelectedValue: (val: VmSizeDto | undefined) => void
  portal?: boolean
  handleSelect?: (vmSize: VmSizeDto) => void
  defaultValue?: string
  usePolicyFilter?: boolean
}


export function AzureClusterSizeCombobox({
  selectedValue,
  setSelectedValue,
  portal = true,
  handleSelect,
  defaultValue,
  usePolicyFilter = false,
}: AzureClusterSizeComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const {
    data: vmSizes,
    isLoading,
    error,
  } = useQuery<VmSizeDto[]>({
    queryKey: ["azure-cluster-sizes", searchValue],
    queryFn: () => fetchClusterSizes(searchValue, 1, 20, usePolicyFilter),
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[216px] justify-between text-left"
          defaultValue={defaultValue}
        >
          <span className="truncate">
            {selectedValue ? selectedValue.name : "Select VM Size..."}
          </span>
          <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent portal={portal} className="w-[400px] p-0 z-50">
        <Command>
          <CommandInput
            placeholder="Search VM sizes..."
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px]">
            {isLoading && <CommandEmpty>Loading VM sizes...</CommandEmpty>}
            {error && <CommandEmpty>Error loading VM sizes.</CommandEmpty>}
            {!isLoading && !error && (!vmSizes || vmSizes.length === 0) && (
              <CommandEmpty>No VM Size found.</CommandEmpty>
            )}
            <CommandGroup>
              {vmSizes?.map((vmSize) => (
                <CommandItem
                  key={vmSize.id}
                  value={vmSize.name}
                  onSelect={() => {
                    handleSelect?.(vmSize)
                    setSelectedValue?.(vmSize)
                    setOpen(false)
                  }}
                  disabled={vmSize.name.toLowerCase() !== "standard_d2s_v3"}
                  className="flex items-start gap-3 py-3 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="font-medium">{vmSize.name}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <div>vCPUs: {vmSize.numberOfCores}</div>
                      <div>RAM: {Math.round(vmSize.memoryInMB / 1024)} GB</div>
                      <div>
                        OS Disk: {Math.round(vmSize.osDiskSizeInMB / 1024)} GB
                      </div>
                      <div>Max Disks: {vmSize.maxDataDiskCount}</div>
                    </div>
                    {vmSize.name.toLowerCase() !== "standard_d2s_v3" && (
                      <div className="text-xs text-red-300 mt-1">
                        Not available
                      </div>
                    )}
                  </div>
                  <Check
                    className={`h-4 w-4 shrink-0 ${
                      selectedValue?.id === vmSize.id
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
