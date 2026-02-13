"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"

const CLUSTER_SIZES = [
  {
    value: "small",
    label: "Small",
    details: "2 vCPU / 4GB RAM",
  },
  {
    value: "medium",
    label: "Medium",
    details: "4 vCPU / 8GB RAM",
  },
  {
    value: "large",
    label: "Large",
    details: "8 vCPU / 16GB RAM",
  },
]

export default function ClusterSizeCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = CLUSTER_SIZES.filter(
    (size) =>
      size.label.toLowerCase().includes(search.toLowerCase()) ||
      size.details.toLowerCase().includes(search.toLowerCase())
  )

  const selected = CLUSTER_SIZES.find((s) => s.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[216px] justify-between text-left"
        >
          <span className="truncate">
            {selected
              ? `${selected.label} (${selected.details})`
              : "Select cluster size..."}
          </span>
          <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0 z-50">
        <Command>
          <CommandInput
            placeholder="Search size..."
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />

          <CommandList className="max-h-[250px]">
            {filtered.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((size) => (
                  <CommandItem
                    key={size.value}
                    value={size.value}
                    onSelect={() => {
                      onChange(size.value)
                      setOpen(false)
                    }}
                    className="flex justify-between items-start py-3 cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{size.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {size.details}
                      </div>
                    </div>

                    <Check
                      className={`h-4 w-4 shrink-0 ${
                        selected?.value === size.value
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
