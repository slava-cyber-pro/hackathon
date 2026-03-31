export default function MarketSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          {/* Symbol badge */}
          <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {/* Name */}
          <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="ml-auto flex items-center gap-6">
            {/* Price */}
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            {/* Change */}
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            {/* Button */}
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
