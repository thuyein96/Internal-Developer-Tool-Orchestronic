import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
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
import React from "react"
import { Check, ChevronsUpDown, Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { Input } from "../../ui/input"
import { Engine } from "@/types/resource"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form"
import { azureRequestFormSchema } from "../form-schema/azure"
// import { getPolicyDB } from "@/app/api/policy/api"
// import { useQuery } from "@tanstack/react-query"

interface DatabaseEngine {
  userOption: string
  tier: string
  vCores: number
  ram: string
  SKU: string
  price: string
}

export const databaseEngines: DatabaseEngine[] = [
  {
    userOption: "Small",
    tier: "Burstable",
    vCores: 1,
    ram: "2 GB",
    SKU: "B_Standard_B1ms",
    price: "$18.98/month",
  },
  {
    userOption: "Medium",
    tier: "General Purpose",
    vCores: 2,
    ram: "8 GB",
    SKU: "GP_Standard_D2ds_v4",
    price: "$171.550/month",
  },
  {
    userOption: "Large",
    tier: "Memory Optimized",
    vCores: 4,
    ram: "16 GB",
    SKU: "MO_Standard_E4ds_v4",
    price: "$343.100/month",
  },
]

interface ResourceGroupAccordionProps {
  form: UseFormReturn<z.infer<typeof azureRequestFormSchema>>
  databaseCount: number
  dbPolicy: {
    id: string
    maxStorage: number
  }
}

export function ResourceGroupAccordionDB({
  form,
  databaseCount,
  dbPolicy,
}: Readonly<ResourceGroupAccordionProps>) {
  const lastDBRef = useRef<HTMLDivElement | null>(null)
  const [userOption, setUserOption] = React.useState<DatabaseEngine | null>(
    null
  )
  // Per-card show/hide password state
  const [showPasswordArr, setShowPasswordArr] = React.useState<boolean[]>([])

  useEffect(() => {
    setShowPasswordArr((prev) => {
      const arr = Array(databaseCount).fill(false)
      prev.forEach((val, idx) => {
        if (idx < arr.length) arr[idx] = val
      })
      return arr
    })
    if (lastDBRef.current) {
      lastDBRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [databaseCount])

  return (
    <div className="grid gap-6">
      {databaseCount > 0 && (
        <Accordion type="single" collapsible>
          {Array.from({ length: databaseCount }).map((_, i) => (
            <AccordionItem
              key={i}
              value={`database-${i}`}
              ref={i === Math.floor(databaseCount / 3) ? lastDBRef : null}
            >
              <AccordionTrigger className="cursor-pointer">
                Database #{i + 1}
              </AccordionTrigger>
              <AccordionContent forceMount>
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <CardTitle>Database #{i + 1}</CardTitle>
                      <CardDescription>
                        Configure database settings
                      </CardDescription>
                    </div>
                    <div>
                      <CardDescription>{userOption?.price}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="flex justify-between gap-4">
                      <div className="grid gap-2">
                        <FormField
                          control={form.control}
                          name={`resources.resourceConfig.dbs.${i}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-[216px]"
                                  placeholder="Enter name"
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
                          name={`resources.resourceConfig.dbs.${i}.engine`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Database Engine</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) =>
                                    field.onChange(value as Engine)
                                  }
                                >
                                  <SelectTrigger
                                    id={`db-engine-${i}`}
                                    className="w-[216px]"
                                  >
                                    <SelectValue placeholder="Choose DB engine" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={Engine.PostgreSQL}>
                                      {Engine.PostgreSQL}
                                    </SelectItem>
                                    <SelectItem value={Engine.MySQL}>
                                      {Engine.MySQL}
                                    </SelectItem>
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
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name={`resources.resourceConfig.dbs.${i}.skuName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tier / Size</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  const selected = databaseEngines.find(
                                    (engine) => engine.userOption === value
                                  )
                                  setUserOption(selected || null)
                                  field.onChange(selected?.SKU || "")
                                }}
                              >
                                <SelectTrigger
                                  id={`db-engine-${i}`}
                                  className="w-full"
                                >
                                  <SelectValue placeholder="Choose DB engine" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                  {databaseEngines.map((engine) => (
                                    <SelectItem
                                      key={engine.userOption}
                                      value={engine.userOption}
                                    >
                                      <p>{engine.userOption}</p>
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
                    <div className="flex justify-between gap-4">
                      <div className="grid gap-2">
                        <FormField
                          control={form.control}
                          name={`resources.resourceConfig.dbs.${i}.username`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter username"
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
                          name={`resources.resourceConfig.dbs.${i}.password`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Enter password"
                                    type={
                                      showPasswordArr[i] ? "text" : "password"
                                    }
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                      setShowPasswordArr((prev) => {
                                        const arr = [...prev]
                                        arr[i] = !arr[i]
                                        return arr
                                      })
                                    }
                                  >
                                    {showPasswordArr[i] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`db-engine-${i}`}>vCores</Label>
                        <Input
                          disabled
                          placeholder="Auto-filled"
                          type="number"
                          value={userOption ? userOption.vCores : ""}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`db-engine-${i}`}>RAM (GB)</Label>
                        <Input
                          disabled
                          placeholder="Auto-filled"
                          type="number"
                          value={userOption ? userOption.ram[0] : ""}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`db-engine-${i}`}>SKU</Label>
                        <Input
                          disabled
                          placeholder="Auto-filled"
                          value={
                            form.watch(
                              `resources.resourceConfig.dbs.${i}.skuName`
                            ) || ""
                          }
                        />
                      </div>
                      {form.watch(
                        `resources.resourceConfig.dbs.${i}.engine`
                      ) === Engine.PostgreSQL && (
                        <div className="grid gap-2">
                          <FormField
                            control={form.control}
                            name={`resources.resourceConfig.dbs.${i}.storageGB`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Storage</FormLabel>
                                <FormControl>
                                  <DatabaseSizeCombobox
                                    onChange={(value) => {
                                      field.onChange(value)
                                    }}
                                    dbPolicy={dbPolicy}
                                  />
                                </FormControl>
                                <FormDescription />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

const databaseSizes = [
  { value: 32768, label: 32, unit: "GB" },
  { value: 65536, label: 64, unit: "GB" },
  { value: 131072, label: 128, unit: "GB" },
  { value: 262144, label: 256, unit: "GB" },
  { value: 524288, label: 512, unit: "GB" },
  { value: 1048576, label: 1, unit: "TB" },
  { value: 2097152, label: 2, unit: "TB" },
  { value: 4194304, label: 4, unit: "TB" },
  { value: 8388608, label: 8, unit: "TB" },
  { value: 16777216, label: 16, unit: "TB" },
  { value: 33553408, label: 32, unit: "TB" },
]

export function DatabaseSizeCombobox({
  onChange,
  dbPolicy,
}: {
  onChange?: (value: number) => void
  dbPolicy: { id: string; maxStorage: number }
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<number | "">("")
  const [search, setSearch] = React.useState("")

  // Filter sizes based on number or unit (GB/TB)
  const filteredSizes = databaseSizes.filter((size) => {
    const s = search.trim().toLowerCase()
    const numberStr = size.label.toString()
    const unitStr = size.unit.toLowerCase()
    return (
      (numberStr.includes(s) || unitStr.includes(s)) &&
      size.value <= Number(dbPolicy.maxStorage * 1024)
    )
  })

  const handleSelect = (selectedValue: number) => {
    setValue(selectedValue)
    setOpen(false)
    setSearch("")
    if (onChange) onChange(selectedValue)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[213px] justify-between"
        >
          {value
            ? (() => {
                const selected = databaseSizes.find(
                  (size) => size.value === value
                )
                return selected ? `${selected.label} ${selected.unit}` : ""
              })()
            : "Select size..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search size..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No size found.</CommandEmpty>
            <CommandGroup>
              {filteredSizes.map((size) => (
                <CommandItem
                  key={size.value}
                  value={size.value.toString()}
                  onSelect={() => handleSelect(size.value)}
                >
                  {size.label} {size.unit}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === size.value ? "opacity-100" : "opacity-0"
                    )}
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
