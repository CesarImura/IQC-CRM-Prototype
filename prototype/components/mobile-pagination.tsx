"use client"

import { ChevronLeft, ChevronRight } from "@carbon/icons-react"

import { Dropdown } from "@/components/dropdown"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/iq/ui/button"

/**
 * Pagination · Mobile (prototype-only variant, Davi 16–17 Oct; not in the Figma DS nor the DS repo yet — see the audit
 * note): "Rows [25]" · up to three page numbers + "…" · ← → as stroked icon buttons (same look as the drawer and
 * modal X: secondary icon-sm, 1px white/16 stroke, no fill). Page cells reuse the DS pagination item tokens.
 */
const pageClasses =
  "inline-flex h-(--pagination-item-size) min-w-(--pagination-item-size) cursor-pointer items-center justify-center rounded-(--pagination-item-radius) px-(--pagination-item-padding) font-mono text-sm leading-normal text-(color:--pagination-content) outline-none transition-colors duration-100 hover:bg-(--pagination-item-bg-hover) focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)]"

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
  // Three pages around the current one (never past the ends); "…" when more pages follow.
  const from = Math.max(0, Math.min(pageIndex - 1, last - 2))
  const pages = Array.from({ length: Math.min(3, last + 1) }, (_, i) => from + i)
  const more = pages[pages.length - 1] < last
  const go = (i: number) => onChange({ pageIndex: i, pageSize })
  return (
    <nav data-slot="mobile-pagination" aria-label="Pagination" className="flex items-center justify-between gap-2 border-t border-(--border-divider) px-3 py-4">
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-5 font-medium whitespace-nowrap text-(color:--content-default)">Rows</span>
        <Dropdown
          label="Rows per page"
          hideLabel
          search={false}
          options={sizes.map((s) => ({ value: String(s), label: String(s) }))}
          value={String(pageSize)}
          onValueChange={(v) => onChange({ pageIndex: 0, pageSize: Number(v) })}
        />
      </div>
      <ul className="flex min-w-0 items-center gap-1">
        {pages.map((i) => (
          <li key={i}>
            <button
              type="button"
              aria-label={`Page ${i + 1}`}
              aria-current={i === pageIndex ? "page" : undefined}
              onClick={() => go(i)}
              className={cn(pageClasses, i === pageIndex && "bg-(--pagination-item-bg-current) text-(color:--pagination-item-content-current) hover:bg-(--pagination-item-bg-current)")}
            >
              {(i + 1).toLocaleString("en-US")}
            </button>
          </li>
        ))}
        {more && (
          <li aria-hidden className="flex h-(--pagination-item-size) items-center px-1 text-sm text-(color:--content-tertiary)">
            …
          </li>
        )}
      </ul>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="icon-sm" aria-label="Previous page" className="border-white/16 bg-transparent" disabled={pageIndex <= 0} onClick={() => go(pageIndex - 1)}>
          <ChevronLeft />
        </Button>
        <Button variant="secondary" size="icon-sm" aria-label="Next page" className="border-white/16 bg-transparent" disabled={pageIndex >= last} onClick={() => go(pageIndex + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
