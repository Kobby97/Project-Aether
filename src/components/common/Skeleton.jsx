import { cn } from '../../utils/cn';

export default function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-white/5', className)}
      aria-hidden="true"
    />
  );
}

export function SensorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-navy-900 p-6">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-2 h-6 w-48" />
      <Skeleton className="mt-4 h-16 w-full rounded-xl" />
      <div className="mt-5 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-full" />
        ))}
      </div>
    </div>
  );
}
