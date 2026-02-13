export default function DataTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"
          ></div>
        ))}
      </div>
    </div>
  )
}
