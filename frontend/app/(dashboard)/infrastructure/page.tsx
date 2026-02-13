"use client"
import { useQuery } from "@tanstack/react-query"
import { getInfrastructureSummary } from "@/app/api/infrastructure/api"
import { cn } from "@/lib/utils"
import Image from "next/image"
import InfrastructureSkeleton from "./components/infrastructure-skeleton"

export default function Page() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["infrastructure-summary"],
    queryFn: getInfrastructureSummary,
  })

  if (isLoading) return <InfrastructureSkeleton />
  if (error) return <div>Error loading summary</div>
  if (!data) return null

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Infrastructure Summary
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s a summary of your infrastructure!
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Requests Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Requests</h3>
          <div className="space-y-4">
            <SummaryCard title="Total Requests" value={data.requests.total} />
            <SummaryCard
              title="Approved"
              color="text-green-500"
              value={data.requests.approved}
            />
            <SummaryCard
              title="Pending"
              value={data.requests.pending}
              color="text-yellow-500"
            />
            <SummaryCard
              title="Declined"
              value={data.requests.declined}
              color="text-red-500"
            />
          </div>
        </div>
        {/* Azure Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-1">
            <Image
              src="icon/azure.svg"
              alt="Azure"
              width={24}
              height={24}
              className="inline mb-1"
            />
            Azure
          </h3>
          <div className="space-y-4">
            <SummaryCard
              title="Resource Groups"
              value={data.totalResourceGroupsAzure}
            />
            <SummaryCard title="VMs" value={data.vms.azure} />
            <SummaryCard title="DBs" value={data.dbs.azure} />
            <SummaryCard title="Storage" value={data.storage.azure} />
          </div>
        </div>
        {/* AWS Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-1">
            <Image
              src="icon/aws.svg"
              alt="Aws"
              width={24}
              height={24}
              className="inline mb-1"
            />
            AWS
          </h3>
          <div className="space-y-4">
            <SummaryCard
              title="Resource Groups"
              value={data.totalResourceGroupsAWS}
            />
            <SummaryCard title="VMs" value={data.vms.aws} />
            <SummaryCard title="DBs" value={data.dbs.aws} />
            <SummaryCard title="Storage" value={data.storage.aws} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string
  value: number
  color?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg shadow p-4 flex flex-col items-center bg-white",
        color
      )}
    >
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-3xl font-bold mt-2">{value}</span>
    </div>
  )
}
