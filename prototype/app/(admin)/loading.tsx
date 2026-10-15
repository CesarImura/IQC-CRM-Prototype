import { DotLoader } from "@/components/dot-loader"

export default function Loading() {
  return (
    <div className="flex min-h-full items-center justify-center" aria-busy="true">
      <DotLoader />
    </div>
  )
}
