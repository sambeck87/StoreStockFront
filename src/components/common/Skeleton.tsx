interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({ className = '', variant = 'rectangular', width, height, count = 1 }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  const variantClass = variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded-md h-4' : 'rounded-lg';

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height && variant !== 'text') style.height = typeof height === 'number' ? `${height}px` : height;

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variantClass} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={44} height={44} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={24} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" className="flex-1" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}
