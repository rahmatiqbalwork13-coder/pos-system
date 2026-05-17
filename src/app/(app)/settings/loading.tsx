export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header skeleton */}
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      
      {/* Settings sections */}
      <div className="space-y-4">
        {/* Business info section */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div>
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Payment methods section */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Categories section */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Logout button skeleton */}
        <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
