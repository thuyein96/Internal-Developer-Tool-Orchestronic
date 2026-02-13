"use client"

import { Separator } from "@/components/ui/separator"
import {
  Cpu,
  Database,
  // DatabaseZap
} from "lucide-react"
import { useState } from "react"
import { haveAdminOrIT } from "@/lib/utils"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import {
  getPolicyDBAzure,
  // getPolicySTAzure,
  getPolicyVMAzure,
} from "@/app/api/policy/azure/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import PolicySectionSkeleton from "./policy-section-skeleton"
import { getUser } from "@/app/api/user/api"
import AwsEditPolicyDialog from "./aws-edit-policy"
import AzureEditPolicyDialog from "./azure-edit-policy"
import { AwsVmSizeDto, VmSizeDto } from "@/types/request"
import {
  getPolicyDBAws,
  // getPolicySTAws,
  getPolicyVMAws,
} from "@/app/api/policy/aws/api"

export default function PolicySection() {
  const [activeTab, setActiveTab] = useState<"AZURE" | "AWS">("AZURE")

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "AZURE" | "AWS")}
    >
      <TabsList>
        <TabsTrigger value="AZURE">
          <Image
            src="/icon/azure.svg"
            alt="Azure Cloud Provider Icon"
            width={16}
            height={16}
          />
          <p>Azure</p>
        </TabsTrigger>
        <TabsTrigger value="AWS">
          <Image
            src="/icon/aws.svg"
            alt="AWS Cloud Provider Icon"
            width={16}
            height={16}
          />
          <p>AWS</p>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="AZURE" className="mt-6">
        <motion.div
          key="azure"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <PolicyCardAzure activeTab={activeTab} />
        </motion.div>
      </TabsContent>
      <TabsContent value="AWS" className="mt-6">
        <motion.div
          key="aws"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <PolicyCardAWS activeTab={activeTab} />
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}

function PolicyCardAzure({ activeTab }: { activeTab: "AZURE" | "AWS" }) {
  const {
    data: session,
    isLoading: isLoadingUser,
    error: errorUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const { data: dbData } = useQuery({
    queryKey: ["azure-policies-db", activeTab],
    queryFn: () => getPolicyDBAzure(),
  })

  // const { data: stData } = useQuery({
  //   queryKey: ["azure-policies-st", activeTab],
  //   queryFn: () => getPolicySTAzure(),
  // })

  const { data, isLoading, error } = useQuery<VmSizeDto>({
    queryKey: ["azure-policies-vm", activeTab],
    queryFn: () => getPolicyVMAzure(),
  })

  if (isLoadingUser) {
    return <div>Loading...</div>
  }

  if (errorUser) {
    return <div>Error fetching user data</div>
  }

  if (isLoading) return <PolicySectionSkeleton />
  if (error) return <div>Error loading policies</div>

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Cpu size={16} />
          <h3 className="font-medium">VM</h3>
        </div>
        {haveAdminOrIT(session?.role) && (
          <AzureEditPolicyDialog data={data} activeTab={activeTab} kind="vm" />
        )}
      </div>
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="text-sm text-muted-foreground">Max:</p>
          <p className="mt-2">{data?.name}</p>
          <div className="text-muted-foreground text-sm">
            <p>{data?.numberOfCores} vCPUs</p>
            <p>{Math.round((data?.memoryInMB ?? 0) / 1024)} GB of RAM</p>
          </div>
        </div>
        <div className="grid gap-2 w-1/2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p>
            Teams can request up to CPU cores per environment. Any requests
            beyond this threshold will be reviewed by the operations team and
            require justification.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Database size={16} />
          <h3 className="font-medium">Database</h3>
        </div>
        {haveAdminOrIT(session?.role) && (
          <AzureEditPolicyDialog
            data={dbData}
            activeTab={activeTab}
            kind="db"
          />
        )}
      </div>
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="text-sm text-muted-foreground">Max:</p>
          <p className="mt-2">{dbData?.maxStorage} GB</p>
        </div>
        <div className="grid gap-2 w-1/2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p>
            Teams can request up to CPU cores per environment. Any requests
            beyond this threshold will be reviewed by the operations team and
            require justification.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      {/* <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <DatabaseZap size={16} />
          <h3 className="font-medium">Storage</h3>
        </div>
        {haveAdminOrIT(session?.role) && (
          <AzureEditPolicyDialog
            data={stData}
            activeTab={activeTab}
            kind="st"
          />
        )}
      </div>
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="text-sm text-muted-foreground">Max:</p>
          <p className="mt-2">{stData?.maxStorage} GB</p>
        </div>
        <div className="grid gap-2 w-1/2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p>
            Teams can request up to CPU cores per environment. Any requests
            beyond this threshold will be reviewed by the operations team and
            require justification.
          </p>
        </div>
      </div> */}
    </div>
  )
}

function PolicyCardAWS({ activeTab }: { activeTab: "AZURE" | "AWS" }) {
  const { data: session } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const { data: dbData } = useQuery({
    queryKey: ["aws-policies-db", activeTab],
    queryFn: () => getPolicyDBAws(),
  })

  // const { data: stData } = useQuery({
  //   queryKey: ["aws-policies-st", activeTab],
  //   queryFn: () => getPolicySTAws(),
  // })

  const {
    data: vmData,
    isLoading,
    error,
  } = useQuery<AwsVmSizeDto>({
    queryKey: ["aws-policies-vm", activeTab],
    queryFn: () => getPolicyVMAws(),
  })

  if (isLoading) return <PolicySectionSkeleton />
  if (error) return <div>Error loading policies</div>

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Cpu size={16} />
          <h3 className="font-medium">VM</h3>
        </div>
        {haveAdminOrIT(session?.role) && (
          <AwsEditPolicyDialog data={vmData} kind="vm" />
        )}
      </div>
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="text-sm text-muted-foreground">Max:</p>
          <p className="mt-2">{vmData?.name}</p>
          <div className="text-muted-foreground text-sm">
            <p>{vmData?.numberOfCores} vCPUs</p>
            <p>{Math.round((vmData?.memoryInMB ?? 0) / 1024)} GB of RAM</p>
          </div>
        </div>
        <div className="grid gap-2 w-1/2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p>
            Teams can request up to CPU cores per environment. Any requests
            beyond this threshold will be reviewed by the operations team and
            require justification.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Database size={16} />
          <h3 className="font-medium">Database</h3>
        </div>
        {haveAdminOrIT(session?.role) && (
          <AwsEditPolicyDialog data={dbData} kind="db" />
        )}
      </div>
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="text-sm text-muted-foreground">Max:</p>
          <p className="mt-2">{dbData?.maxStorage} GB</p>
        </div>
        <div className="grid gap-2 w-1/2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p>
            Teams can request up to CPU cores per environment. Any requests
            beyond this threshold will be reviewed by the operations team and
            require justification.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      {/* <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <DatabaseZap size={16} />
          <h3 className="font-medium">Storage</h3>
        </div>
        {haveAdminOrIT(session?.role) && (
          <AwsEditPolicyDialog data={stData} kind="st" />
        )}
      </div>
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="text-sm text-muted-foreground">Max:</p>
          <p className="mt-2">{stData?.maxStorage} GB</p>
        </div>
        <div className="grid gap-2 w-1/2">
          <p className="text-sm text-muted-foreground">Description</p>
          <p>
            Teams can request up to CPU cores per environment. Any requests
            beyond this threshold will be reviewed by the operations team and
            require justification.
          </p>
        </div>
      </div> */}
    </div>
  )
}
