import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DatabaseAzurePolicyDto,
  StorageAzurePolicyDto,
  VMPolicyDto,
  VmSizeDto,
} from "@/types/request"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updatePolicyDBAzure,
  updatePolicySTAzure,
  updatePolicyVMAzure,
} from "@/app/api/policy/azure/api"
import { AzureVMSizeCombobox } from "@/components/requests/azure-resource-group-accordion/azure-resource-group-accordion-vm"

export default function AzureEditPolicyDialog({
  data,
  activeTab,
  kind,
}: {
  data?: VMPolicyDto | DatabaseAzurePolicyDto | StorageAzurePolicyDto
  activeTab: "AZURE" | "AWS"
  kind: "vm" | "db" | "st"
}) {
  const [selectedVmSize, setSelectedVmSize] = useState<VmSizeDto | undefined>()
  const [dbValue, setDBValue] = useState<string>("")
  const [storageValue, setStorageValue] = useState<string>("")
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Type guard functions
  const isVMPolicy = useCallback(
    (policy: typeof data): policy is VMPolicyDto => {
      return policy != null && "name" in policy && kind === "vm"
    },
    [kind]
  )

  const isDbPolicy = useCallback(
    (policy: typeof data): policy is DatabaseAzurePolicyDto => {
      return policy != null && "maxStorage" in policy && kind === "db"
    },
    [kind]
  )

  const isStoragePolicy = useCallback(
    (policy: typeof data): policy is StorageAzurePolicyDto => {
      return policy != null && "maxStorage" in policy && kind === "st"
    },
    [kind]
  )

  // Initialize form values when dialog opens
  useEffect(() => {
    if (open && data) {
      if (isVMPolicy(data)) {
        // Set the initial VM size selection based on current policy
        setSelectedVmSize({
          id: data.name, // Use name as ID since VMPolicyDto might not have id
          name: data.name,
          numberOfCores: data.numberOfCores,
          memoryInMB: data.memoryInMB,
          osDiskSizeInMB: 0, // These might not be available in policy data
          maxDataDiskCount: 0,
        } as VmSizeDto)
      } else if (isDbPolicy(data)) {
        setDBValue(data.maxStorage.toString())
      } else if (isStoragePolicy(data)) {
        setStorageValue((data as StorageAzurePolicyDto).maxStorage.toString())
      }
    }
  }, [open, data, isVMPolicy, isDbPolicy, isStoragePolicy])

  const updateVMPolicyMutation = useMutation({
    mutationFn: (params: {
      name: string
      numberOfCores: number
      memoryInMB: number
      cloudProvider: string
    }) => updatePolicyVMAzure(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["azure-policies-vm"] })
      queryClient.invalidateQueries({ queryKey: ["azure-policies-db"] })
      queryClient.invalidateQueries({ queryKey: ["azure-policies-st"] })
      setOpen(false)
    },
    onError: (error) => {
      console.error("Failed to update VM policy:", error)
    },
  })

  const updateDBPolicyMutation = useMutation({
    mutationFn: (params: { maxStorage: number; cloudProvider: string }) =>
      updatePolicyDBAzure(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["azure-policies-vm"] })
      queryClient.invalidateQueries({ queryKey: ["azure-policies-db"] })
      queryClient.invalidateQueries({ queryKey: ["azure-policies-st"] })
      setOpen(false)
    },
    onError: (error) => {
      console.error("Failed to update DB policy:", error)
    },
  })

  const updateSTPolicyMutation = useMutation({
    mutationFn: (params: { maxStorage: number; cloudProvider: string }) =>
      updatePolicySTAzure(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["azure-policies-vm"] })
      queryClient.invalidateQueries({ queryKey: ["azure-policies-db"] })
      queryClient.invalidateQueries({ queryKey: ["azure-policies-st"] })
      setOpen(false)
    },
    onError: (error) => {
      console.error("Failed to update Storage policy:", error)
    },
  })

  const handleSave = () => {
    if (isVMPolicy(data) && selectedVmSize) {
      updateVMPolicyMutation.mutate({
        name: selectedVmSize.name,
        numberOfCores: selectedVmSize.numberOfCores,
        memoryInMB: selectedVmSize.memoryInMB,
        cloudProvider: activeTab,
      })
    } else if (isDbPolicy(data) && dbValue) {
      const maxStorage = parseInt(dbValue)
      if (!isNaN(maxStorage)) {
        updateDBPolicyMutation.mutate({
          maxStorage,
          cloudProvider: activeTab,
        })
      }
    } else if (isStoragePolicy(data) && storageValue) {
      const maxStorage = parseInt(storageValue)
      if (!isNaN(maxStorage)) {
        updateSTPolicyMutation.mutate({
          maxStorage,
          cloudProvider: activeTab,
        })
      }
    }
  }

  const isLoading =
    updateVMPolicyMutation.isPending ||
    updateDBPolicyMutation.isPending ||
    updateSTPolicyMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit policy</DialogTitle>
          <DialogDescription>
            Update the policy details below. Ensure that changes comply with the
            overall resource management guidelines.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Max Limit</Label>
            {isVMPolicy(data) && (
              <AzureVMSizeCombobox
                portal={false}
                selectedValue={selectedVmSize}
                setSelectedValue={setSelectedVmSize}
                defaultValue={data?.name}
              />
            )}
            {isDbPolicy(data) && (
              <Input
                value={dbValue}
                onChange={(e) => setDBValue(e.target.value)}
                placeholder="Enter max database storage in GB"
                type="number"
              />
            )}
            {isStoragePolicy(data) && (
              <Input
                value={storageValue}
                onChange={(e) => setStorageValue(e.target.value)}
                placeholder="Enter max storage in GB"
                type="number"
              />
            )}
          </div>
          <Button
            type="button"
            className="mt-4"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
