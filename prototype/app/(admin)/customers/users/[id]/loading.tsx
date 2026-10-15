import { Skeleton } from "@/registry/iq/ui/skeleton"

// Shown right after a Users row is clicked, while the profile loads.
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[1544px] flex-col gap-8 px-14 pt-6 pb-14" aria-busy="true" aria-label="Loading profile">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-[106px] w-full" />
      <Skeleton className="h-10 w-[480px]" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  )
}
