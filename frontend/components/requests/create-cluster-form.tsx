"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import z from "zod"
import { VmSizeDto, AwsVmSizeDto } from "@/types/request"
import { CloudProvider, cloudProviders, regions } from "@/types/resource"
import { createCluster } from "@/app/api/requests/api"
import { AzureClusterSizeCombobox } from "./azure-resource-group-accordion/azure-resource-group-accordion-cluster"
import { AwsVMSizeCombobox } from "./aws-combobox"

interface ResourceGroup {
  id: string
  name: string
  region: string
  cloudProvider: string
}

interface ResourceGroupResponse {
  resources: ResourceGroup
}

// Schema for individual cluster
const clusterConfigSchema = z.object({
  clusterName: z.string().min(3, "Cluster name must be at least 3 characters"),
  nodes: z.coerce.number().min(1, "Must be at least 1 node"),
  sizeId: z.string().min(1, "Cluster size is required"),
  vmSize: z.any().optional(),
})

const clusterFormSchema = z.object({
  resourceGroup: z.string().min(1, "Resource group is required"),
  cloudProvider: z.nativeEnum(CloudProvider),
  region: z.string().min(1, "Region is required"),
  numberOfClusters: z.coerce
    .number()
    .min(1, "Must be at least 1 cluster")
    .max(10, "Maximum 10 clusters"),
  clusters: z.array(clusterConfigSchema),
})

type ClusterFormType = z.infer<typeof clusterFormSchema>

export default function ClientClusterForm() {
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>(
    CloudProvider.AWS
  )
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRgName, setNewRgName] = useState("")
  const [dialogMode, setDialogMode] = useState<"select" | "create">("select")

  const [resourceGroups, setResourceGroups] = useState<string[]>([])
  const [isLoadingRgs, setIsLoadingRgs] = useState(false)
  const [rgError, setRgError] = useState<string | null>(null)

  // API submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClusterFormType>({
    resolver: zodResolver(clusterFormSchema),
    defaultValues: {
      resourceGroup: "",
      cloudProvider: CloudProvider.AWS,
      region: regions[CloudProvider.AWS][0].value,
      numberOfClusters: 1,
      clusters: [
        {
          clusterName: "",
          nodes: 1,
          sizeId: "",
          vmSize: undefined,
        },
      ],
    },
  })

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "clusters",
  })

  const numberOfClusters = watch("numberOfClusters")

  // Sync clusters array with numberOfClusters
  useEffect(() => {
    const currentCount = fields.length
    const targetCount = numberOfClusters

    if (targetCount > currentCount) {
      // Add new clusters
      for (let i = currentCount; i < targetCount; i++) {
        append({
          clusterName: "",
          nodes: 1,
          sizeId: "",
          vmSize: undefined,
        })
      }
    } else if (targetCount < currentCount) {
      // Remove excess clusters
      for (let i = currentCount - 1; i >= targetCount; i--) {
        remove(i)
      }
    }
  }, [numberOfClusters, fields.length, append, remove])

  useEffect(() => {
    const fetchResourceGroups = async () => {
      setIsLoadingRgs(true)
      setRgError(null)

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/resource/resource-groups`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch resource groups: ${response.status}`)
        }

        const data: ResourceGroupResponse[] = await response.json()
        const uniqueRgNames = Array.from(
          new Set(data.map((item) => item.resources.name))
        ).sort()

        setResourceGroups(uniqueRgNames)
      } catch (error) {
        console.error("Error fetching resource groups:", error)
        setRgError(
          error instanceof Error
            ? error.message
            : "Failed to load resource groups"
        )
      } finally {
        setIsLoadingRgs(false)
      }
    }

    fetchResourceGroups()
  }, [])

  const onSubmit = async (values: ClusterFormType) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      // Transform form data to API format
      const requestData = {
        resources: {
          name: values.resourceGroup,
          cloudProvider: values.cloudProvider,
          region: values.region,
          resourceConfig: {
            cluster: values.clusters.map((cluster) => ({
              clusterName: cluster.clusterName,
              nodeCount: cluster.nodes,
              nodeSize: cluster.sizeId,
            })),
          },
        },
      }

      const response = await createCluster(requestData)

      console.log("Cluster(s) request created successfully:", response)
      setSubmitSuccess(true)

      // Optional: Reset form or redirect
      // router.push(`/clusters/${response.id}`)
    } catch (error) {
      console.error("Error creating cluster:", error)
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create cluster. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateResourceGroup = () => {
    if (newRgName.trim()) {
      const fullRgName = `rg-${newRgName.trim()}`
      setSelectedResourceGroup(fullRgName)
      setValue("resourceGroup", fullRgName)
      setResourceGroups((prev) => [...prev, fullRgName].sort())
      setIsDialogOpen(false)
      setNewRgName("")
      setDialogMode("select")
    }
  }

  const handleSelectResourceGroup = (rgName: string) => {
    setSelectedResourceGroup(rgName)
    setValue("resourceGroup", rgName)
    setIsDialogOpen(false)
  }

  return (
    <Card className="border rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Cluster Configuration
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 max-w-[640px]">
          {/* Success Alert */}
          {submitSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {numberOfClusters === 1
                  ? "Cluster creation request submitted successfully! Please wait for the admin to approve your request."
                  : `${numberOfClusters} clusters request created successfully! Please wait for the admin to approve your request.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {submitError && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          {/* Resource Group */}
          <div className="space-y-1">
            <Label>Resource Group *</Label>
            <Controller
              name="resourceGroup"
              control={control}
              render={({ field }) => (
                <>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-9 justify-start text-left font-normal"
                      >
                        {selectedResourceGroup ||
                          "Select or create resource group"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {dialogMode === "select"
                            ? "Select or Create Resource Group"
                            : "Create New Resource Group"}
                        </DialogTitle>
                        <DialogDescription>
                          {dialogMode === "select"
                            ? "Choose an existing resource group or create a new one"
                            : "Enter a name for your new resource group"}
                        </DialogDescription>
                      </DialogHeader>

                      {dialogMode === "select" ? (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Existing Resource Groups</Label>

                            {isLoadingRgs && (
                              <div className="text-sm text-muted-foreground py-4 text-center">
                                Loading resource groups...
                              </div>
                            )}

                            {rgError && (
                              <div className="text-sm text-red-500 py-4 text-center">
                                {rgError}
                              </div>
                            )}

                            {!isLoadingRgs &&
                              !rgError &&
                              resourceGroups.length === 0 && (
                                <div className="text-sm text-muted-foreground py-4 text-center">
                                  No resource groups found
                                </div>
                              )}

                            {!isLoadingRgs &&
                              !rgError &&
                              resourceGroups.length > 0 && (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                  {resourceGroups.map((rg) => (
                                    <Button
                                      key={rg}
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() =>
                                        handleSelectResourceGroup(rg)
                                      }
                                    >
                                      {rg}
                                    </Button>
                                  ))}
                                </div>
                              )}
                          </div>
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Or
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setDialogMode("create")}
                          >
                            Create New Resource Group
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="rg-name">Resource Group Name</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground px-3 py-2 border rounded-md bg-muted">
                                rg-
                              </span>
                              <Input
                                id="rg-name"
                                placeholder="e.g. cluster"
                                value={newRgName}
                                onChange={(e) => setNewRgName(e.target.value)}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false)
                            setNewRgName("")
                            setDialogMode("select")
                          }}
                        >
                          Cancel
                        </Button>
                        {dialogMode === "create" && (
                          <>
                            <Button
                              variant="ghost"
                              onClick={() => setDialogMode("select")}
                            >
                              Back
                            </Button>
                            <Button onClick={handleCreateResourceGroup}>
                              Create
                            </Button>
                          </>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {errors.resourceGroup && (
                    <p className="text-sm text-red-500">
                      {errors.resourceGroup.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Cloud Provider & Region Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Cloud Provider *</Label>
              <div className="flex items-center gap-2 h-9 px-3 py-2 border rounded-md bg-white">
                <Image
                  src="/icon/aws.svg"
                  width={16}
                  height={16}
                  alt="AWS Icon"
                />
                <span className="text-sm">AWS</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Region *</Label>
              <Controller
                name="region"
                control={control}
                render={({ field }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {regions[cloudProvider].map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={
                              option.flag ===
                              "https://flagsapi.com/US/flat/16.png"
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
                    {errors.region && (
                      <p className="text-sm text-red-500">
                        {errors.region.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          {/* Number of Clusters */}
          <div className="space-y-1">
            <Label>Number of Clusters *</Label>
            <Controller
              name="numberOfClusters"
              control={control}
              render={({ field }) => (
                <>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    className="h-9"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Specify how many clusters to create (max 10)
                  </p>
                  {errors.numberOfClusters && (
                    <p className="text-sm text-red-500">
                      {errors.numberOfClusters.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Dynamic Cluster Configuration Sections */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-4 p-4 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">
                  Cluster {index + 1} {numberOfClusters > 1 && "Configuration"}
                </h3>
                {numberOfClusters > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      remove(index)
                      setValue("numberOfClusters", numberOfClusters - 1)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              {/* Cluster Name */}
              <div className="space-y-1">
                <Label>Cluster Name *</Label>
                <Controller
                  name={`clusters.${index}.clusterName`}
                  control={control}
                  render={({ field }) => (
                    <>
                      <Input
                        className="h-9"
                        placeholder="e.g. production-cluster"
                        {...field}
                      />
                      {errors.clusters?.[index]?.clusterName && (
                        <p className="text-sm text-red-500">
                          {errors.clusters[index]?.clusterName?.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Number of Nodes */}
              <div className="space-y-1">
                <Label>Number of Nodes *</Label>
                <Controller
                  name={`clusters.${index}.nodes`}
                  control={control}
                  render={({ field }) => (
                    <>
                      <Input
                        type="number"
                        min={1}
                        className="h-9"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      {errors.clusters?.[index]?.nodes && (
                        <p className="text-sm text-red-500">
                          {errors.clusters[index]?.nodes?.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Node Size - Conditionally render based on cloud provider */}
              <div className="space-y-1">
                <Label>
                  {cloudProvider === CloudProvider.AWS
                    ? "EC2 Instance Type *"
                    : "Node Size *"}
                </Label>
                <Controller
                  name={`clusters.${index}.sizeId`}
                  control={control}
                  render={({ field }) => (
                    <>
                      {cloudProvider === CloudProvider.AZURE ? (
                        <AzureClusterSizeCombobox
                          selectedValue={
                            watch(`clusters.${index}.vmSize`) as VmSizeDto
                          }
                          setSelectedValue={(vmSize) => {
                            update(index, {
                              ...watch(`clusters.${index}`),
                              vmSize: vmSize,
                              sizeId: vmSize?.name || "",
                            })
                          }}
                          usePolicyFilter={true}
                          handleSelect={(vmSize) => {
                            update(index, {
                              ...watch(`clusters.${index}`),
                              vmSize: vmSize.name,
                              sizeId: vmSize.name,
                            })
                          }}
                        />
                      ) : (
                        <AwsVMSizeCombobox
                          selectedValue={
                            watch(`clusters.${index}.vmSize`) as AwsVmSizeDto
                          }
                          setSelectedValue={(vmSize) => {
                            update(index, {
                              ...watch(`clusters.${index}`),
                              vmSize: vmSize,
                              sizeId: vmSize?.name || "",
                            })
                          }}
                          usePolicyFilter={false}
                          handleSelect={(vmSize) => {
                            update(index, {
                              ...watch(`clusters.${index}`),
                              vmSize: vmSize.name,
                              sizeId: vmSize.name,
                            })
                          }}
                        />
                      )}
                      {errors.clusters?.[index]?.sizeId && (
                        <p className="text-sm text-red-500">
                          {errors.clusters[index]?.sizeId?.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          ))}

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSubmit(onSubmit)}
              className="h-9 px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating{" "}
                  {numberOfClusters > 1
                    ? `${numberOfClusters} Clusters`
                    : "Cluster"}
                  ...
                </>
              ) : (
                `Create ${numberOfClusters > 1 ? `${numberOfClusters} Clusters` : "Cluster"}`
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
