"use client"

import { ChevronLeft, ChevronRight } from "@carbon/icons-react"

import { Dropdown } from "@/components/dropdown"
import { Button } from "@/registry/iq/ui/button"

/**
 * Pagination · Mobile (prototype-only variant, Davi 16 Oct; not in the Figma DS nor the DS repo yet — see the audit
 * note): one airy row, "Rows per page [25]" + Previous / Next. No range, page input or first/last on a phone.
 */
export function MobilePagination({
  pageIndex,
  pageSize,
  total,
  onChange,
  sizes = [25, 50, 100],
}: {
  pageIndex: number
  pageSize: number
  total: number
  onChange: (next: { pageIndex: number; pageSize: number }) => void
  sizes?: number[]
}) {
  const last = Math.max(0, Math.ceil(total / pageSize) - 1)
  return (
    <nav data-slot="mobile-pagination" aria-label="Pagination" className="flex items-center justify-between gap-1 border-t border-(--border-divider) px-3 py-4">
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-5 font-medium whitespace-nowrap text-(color:--content-default)">Rows per page</span>
        <Dropdown
          label="Rows per page"
          hideLabel
          search={false}
          options={sizes.map((s) => ({ value: String(s), label: String(s) }))}
          value={String(pageSize)}
          onValueChange={(v) => onChange({ pageIndex: 0, pageSize: Number(v) })}
        />
      </div>
      <div className="flex items-center [&_button]:!gap-0.5 [&_button]:!px-1">
        <Button variant="ghost" size="sm" disabled={pageIndex <= 0} onClick={() => onChange({ pageIndex: pageIndex - 1, pageSize })}>
          <ChevronLeft />
          Previous
        </Button>
        <Button variant="ghost" size="sm" disabled={pageIndex >= last} onClick={() => onChange({ pageIndex: pageIndex + 1, pageSize })}>
          Next
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
