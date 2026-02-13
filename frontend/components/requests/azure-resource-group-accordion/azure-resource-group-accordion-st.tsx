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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UseFormReturn } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import z from "zod"
import { azureRequestFormSchema } from "../form-schema/azure"

interface ResourceGroupAccordionProps {
  form: UseFormReturn<z.infer<typeof azureRequestFormSchema>>
  storageCount: number
}

interface StorageAccessTier {
  label: "Hot" | "Cool"
  description: string
}

interface StoragePrice {
  tier: "Hot" | "Cool"
  price: string
}

const storagePrices: Record<string, StoragePrice[]> = {
  Standard_LRS: [
    {
      tier: "Hot",
      price: "$0.02 per GB/month",
    },
    {
      tier: "Cool",
      price: "$0.011 per GB/month",
    },
  ],
  Standard_GRS: [
    {
      tier: "Hot",
      price: "$0.04 per GB/month",
    },
    {
      tier: "Cool",
      price: "$0.022 per GB/month",
    },
  ],
  Standard_ZRS: [
    {
      tier: "Hot",
      price: "$0.025 per GB/month",
    },
    {
      tier: "Cool",
      price: "$0.0138 per GB/month",
    },
  ],
  Premium_LRS: [
    {
      tier: "Hot",
      price: "$0.195 per GB/month",
    },
    {
      tier: "Cool",
      price: "$0.195 per GB/month",
    },
  ],
}

const storageAccessTier: StorageAccessTier[] = [
  {
    label: "Hot",
    description:
      "Frequent access, higher cost for storage, lower cost for reads/writes",
  },
  {
    label: "Cool",
    description:
      "Infrequent access, lower cost for storage, higher cost for reads/writes",
  },
]

interface StorageSKU {
  sku: string
  description: string
  recommended: string
}

const storageSKU: StorageSKU[] = [
  {
    sku: "Standard_LRS",
    description: "Standard performance, Locally Redundant Storage (LRS)",
    recommended: "Most common, low cost, good default",
  },
  {
    sku: "Standard_GRS",
    description: "Standard, Geo-Redundant Storage (GRS)",
    recommended: "For disaster recovery across regions",
  },
  {
    sku: "Standard_ZRS",
    description: "Standard, Zone-Redundant Storage (ZRS)",
    recommended: "Higher availability, within same region",
  },
  {
    sku: "Premium_LRS",
    description: "Premium SSD-based, locally redundant",
    recommended: "For high-performance workloads",
  },
]

interface StorageKind {
  kind: string
  description: string
}

const storageKind: StorageKind[] = [
  {
    kind: "StorageV2",
    description: "General-purpose v2, supports latest features",
  },
  {
    kind: "BlobStorage",
    description: "Only Blob storage, hot/cool access tiers",
  },
  {
    kind: "FileStorage",
    description: "Premium file shares",
  },
  {
    kind: "BlockBlobStorage",
    description: "Premium block blob",
  },
]

export function ResourceGroupAccordionST({
  form,
  storageCount,
}: Readonly<ResourceGroupAccordionProps>) {
  const lastStorageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (lastStorageRef.current) {
      lastStorageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [storageCount])

  const storagePrice = storagePrices[
    form.watch(`resources.resourceConfig.sts.${storageCount - 1}.sku`)
  ]?.find(
    (price) =>
      price.tier ===
      form.watch(`resources.resourceConfig.sts.${storageCount - 1}.accessTier`)
  )

  return (
    <div className="grid gap-6">
      {storageCount > 0 && (
        <Accordion type="single" collapsible>
          {Array.from({ length: storageCount }).map((_, i) => (
            <AccordionItem
              key={i}
              value={`storage-${i}`}
              ref={i === Math.floor(storageCount / 3) ? lastStorageRef : null}
            >
              <AccordionTrigger className="cursor-pointer">
                Storage #{i + 1}
              </AccordionTrigger>
              <AccordionContent forceMount>
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <CardTitle>Storage #{i + 1}</CardTitle>
                      <CardDescription>
                        Configure storage settings
                      </CardDescription>
                    </div>
                    <div>
                      <CardDescription>{storagePrice?.price}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name={`resources.resourceConfig.sts.${i}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., mystorageaccount"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-between gap-4">
                      <div className="grid gap-2">
                        <FormField
                          control={form.control}
                          name={`resources.resourceConfig.sts.${i}.accessTier`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Access Tier</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) =>
                                    field.onChange(value)
                                  }
                                >
                                  <SelectTrigger
                                    id={`storage-access-tier-${i}`}
                                    className=" w-[213px]"
                                  >
                                    <SelectValue placeholder="Select access tier">
                                      <span>{field.value}</span>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {storageAccessTier.map((accessTier) => (
                                      <SelectItem
                                        key={accessTier.label}
                                        value={accessTier.label}
                                      >
                                        <div className="flex flex-col text-left">
                                          <span>{accessTier.label}</span>
                                          <span className="text-muted-foreground text-xs">
                                            {accessTier.description}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-2">
                        <FormField
                          control={form.control}
                          name={`resources.resourceConfig.sts.${i}.sku`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) =>
                                    field.onChange(value)
                                  }
                                >
                                  <SelectTrigger
                                    id={`storage-sku-${i}`}
                                    className=" w-[213px]"
                                  >
                                    <SelectValue placeholder="Select SKU">
                                      {field.value && (
                                        <span>{field.value}</span>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {storageSKU.map((eachSku) => (
                                      <SelectItem
                                        key={eachSku.sku}
                                        value={eachSku.sku}
                                        disabled={
                                          eachSku.sku === "Premium_LRS" ||
                                          eachSku.sku === "Standard_ZRS"
                                        }
                                      >
                                        <div className="flex flex-col text-left">
                                          <span>{eachSku.sku}</span>
                                          <span className="text-muted-foreground text-xs">
                                            {eachSku.description}
                                          </span>
                                          {(eachSku.sku === "Premium_LRS" ||
                                            eachSku.sku === "Standard_ZRS") && (
                                            <span className="text-xs text-red-300">
                                              Not available
                                            </span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name={`resources.resourceConfig.sts.${i}.kind`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kind</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => field.onChange(value)}
                              >
                                <SelectTrigger
                                  id={`storage-sku-${i}`}
                                  className=" w-[213px]"
                                >
                                  <SelectValue placeholder="Select Kind">
                                    {field.value && <span>{field.value}</span>}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {storageKind.map((eachKind) => (
                                    <SelectItem
                                      key={eachKind.kind}
                                      value={eachKind.kind}
                                      disabled={
                                        eachKind.kind === "FileStorage" ||
                                        eachKind.kind === "BlockBlobStorage"
                                      }
                                    >
                                      <div className="flex flex-col text-left">
                                        <span>{eachKind.kind}</span>
                                        <span className="text-muted-foreground text-xs">
                                          {eachKind.description}
                                        </span>
                                        {(eachKind.kind === "FileStorage" ||
                                          eachKind.kind ===
                                            "BlockBlobStorage") && (
                                          <span className="text-xs text-red-300">
                                            Not available
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
