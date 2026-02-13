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
// import { Input } from "@/components/ui/input"
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
import {
  Check,
  CheckIcon,
  ChevronsUpDown,
  ChevronsUpDownIcon,
  Eye,
  EyeOff,
} from "lucide-react"

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
import { awsRequestFormSchema } from "../form-schema/aws"
import { getDBInstanceClasses } from "@/app/api/cloud-provider/api"
import { useQuery } from "@tanstack/react-query"
// import { getPolicyDB } from "@/app/api/policy/api"
// import { useQuery } from "@tanstack/react-query"

interface ResourceGroupAccordionProps {
  form: UseFormReturn<z.infer<typeof awsRequestFormSchema>>
  databaseCount: number
  dbPolicy: {
    id: string
    maxStorage: number
  }
}

export function AwsResourceGroupAccordionDB({
  form,
  databaseCount,
  dbPolicy,
}: Readonly<ResourceGroupAccordionProps>) {
  const lastDBRef = useRef<HTMLDivElement | null>(null)
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
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="flex justify-between gap-4">
                      <div className="grid gap-2">
                        <FormField
                          control={form.control}
                          name={`resources.resourceConfig.dbs.${i}.dbName`}
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
                    <div className="flex justify-between gap-4">
                      <div className="grid gap-2">
                        <FormField
                          control={form.control}
                          name={`resources.resourceConfig.dbs.${i}.awsDatabaseTypeId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instance Class</FormLabel>
                              <FormControl>
                                <DatabaseInstanceClassCombobox
                                  engine={form.watch(
                                    `resources.resourceConfig.dbs.${i}.engine`
                                  )}
                                  onChange={field.onChange}
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
                          name={`resources.resourceConfig.dbs.${i}.dbAllocatedStorage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allocated Storage</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter allocated storage"
                                  value={field.value ?? ""}
                                  max={dbPolicy.maxStorage}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value)
                                    )
                                  }
                                />
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
                        <FormField
                          control={form.control}
                          name={`resources.resourceConfig.dbs.${i}.dbUsername`}
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
                          name={`resources.resourceConfig.dbs.${i}.dbPassword`}
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
                    {/* <div className="flex justify-between gap-4">
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
                                  />
                                </FormControl>
                                <FormDescription />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div> */}
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

export function DatabaseInstanceClassCombobox({
  engine,
  onChange,
}: {
  engine: Engine | undefined
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState("")

  const { data, error, isLoading } = useQuery({
    queryKey: ["db-instance-classes", search, engine],
    queryFn: () =>
      getDBInstanceClasses({
        search: search,
        page: 1,
        limit: 20,
        minStorageSize: undefined,
        maxStorageSize: undefined,
        engine: engine ? engine : Engine.PostgreSQL,
      }),
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <span className="truncate">
            {selected ? selected : "Select Database Instance..."}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search Database Instance..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <CommandEmpty>Loading Database Instances...</CommandEmpty>
            )}
            {error && (
              <CommandEmpty>Error loading Database Instances.</CommandEmpty>
            )}
            {!isLoading && !error && (!data || data.length === 0) && (
              <CommandEmpty>No Database Instance found.</CommandEmpty>
            )}
            <CommandGroup>
              {data?.map((each) => (
                <CommandItem
                  className="flex items-start gap-3 py-3 cursor-pointer"
                  key={each.id}
                  value={each.DBInstanceClass}
                  onSelect={(currentValue) => {
                    setSelected(currentValue)
                    setOpen(false)
                    onChange(each.id)
                  }}
                  disabled={each.DBInstanceClass !== "db.t3.micro"}
                >
                  <div className="flex-1">
                    <p>{each.DBInstanceClass}</p>
                    {each.DBInstanceClass !== "db.t3.micro" && (
                      <span className="text-xs text-red-300">
                        Not available
                      </span>
                    )}
                  </div>
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected === each.DBInstanceClass
                        ? "opacity-100"
                        : "opacity-0"
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
}: {
  onChange?: (value: number) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<number | "">("")
  const [search, setSearch] = React.useState("")

  // Filter sizes based on number or unit (GB/TB)
  const filteredSizes = databaseSizes.filter((size) => {
    const s = search.trim().toLowerCase()
    const numberStr = size.label.toString()
    const unitStr = size.unit.toLowerCase()
    return numberStr.includes(s) || unitStr.includes(s)
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
