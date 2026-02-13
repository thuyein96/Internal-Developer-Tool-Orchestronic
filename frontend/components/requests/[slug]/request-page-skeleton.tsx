import { Skeleton } from "@/components/ui/skeleton"

export function RequestPageSkeleton() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Content grid */}
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Resource details */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-85 w-full rounded-xl" />
          </div>

          {/* Right side - Organization + Description */}
          <div className="flex flex-col space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>

          {/* Feedback / textarea placeholder */}
          <div className="col-span-3 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
