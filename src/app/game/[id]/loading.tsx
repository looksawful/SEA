import { Skeleton } from "@/components/Skeleton";
import { FaCircleNotch } from "react-icons/fa";

export default function GameLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl border border-subtle bg-surface-2 flex items-center justify-center text-accent">
            <FaCircleNotch className="animate-spin" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
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
