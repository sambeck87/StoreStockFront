import { Skeleton } from './Skeleton';

export function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton variant="text" width={180} height={24} className="mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={44} height={44} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
