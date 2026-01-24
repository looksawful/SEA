import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
