import { Skeleton } from "@/components/Skeleton";

export default function GameLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
