export default function InfrastructureSkeleton() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="space-y-2">
        <div className="h-8 w-1/3 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="h-6 w-1/2 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          <div className="space-y-4">
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-1/2 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          <div className="space-y-4">
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-1/2 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          <div className="space-y-4">
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
