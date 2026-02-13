export default function ClientRequestFormSkeleton() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex animate-pulse">
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-[100px]"></div>
          <div className="h-4 bg-gray-200 rounded w-[200px]"></div>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="h-80 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-60 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    </div>
  )
}
