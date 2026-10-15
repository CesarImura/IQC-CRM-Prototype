import { DotLoader } from "@/components/dot-loader"

// Shown right after a Users row is clicked, while the profile loads.
export default function Loading() {
  return (
    <div className="flex min-h-full items-center justify-center" aria-busy="true">
      <DotLoader label="Loading profile" />
    </div>
  )
}
