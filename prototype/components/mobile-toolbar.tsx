"use client"

import * as React from "react"
import { Add, Download } from "@carbon/icons-react"

import { BottomSheet } from "@/components/bottom-sheet"
import { Dropdown } from "@/components/dropdown"
import { Button } from "@/registry/iq/ui/button"
import { FilterButton, FilterChip } from "@/registry/iq/ui/filter"
import { SearchBar } from "@/registry/iq/ui/search-bar"

/**
 * Toolbar · Mobile (prototype proposal, Davi 16 Oct; not in the DS yet, on the audit list). One 32px row instead of
 * the desktop toolbar stacked in rows:
 *  - Compact:       Search (fills the row) · Filters (icon + count, opens a sheet) · Export (icon)
 *  - Compact + Add: the same + a green icon button for the section's create action
 *  - Swipe:         no search; the buttons sit in one row that swipes sideways (Section `swipe`, e.g. Subscriptions)
 * Every Dropdown filter of the desktop toolbar becomes a chip group in the Filters sheet (first option = "any").
 */
export type MobileFilter = {
  key: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export function MobileToolbar({
  search,
  filters = [],
  exportOptions,
  onExport,
  add,
}: {
  search: { value: string; onChange: (v: string) => void; placeholder: string; label: string }
  filters?: MobileFilter[]
  exportOptions?: { value: string; label: string }[]
  onExport?: (value: string) => void
  add?: { label: string; onClick: () => void }
}) {
  const [open, setOpen] = React.useState(false)
  const active = filters.filter((f) => f.value !== f.options[0]?.value).length
  return (
    <div data-slot="mobile-toolbar" className="flex w-full items-center gap-2">
      <div className="min-w-0 flex-1">
        <SearchBar placeholder={search.placeholder} aria-label={search.label} value={search.value} onValueChange={search.onChange} />
      </div>
      {filters.length > 0 && (
        <FilterButton label={<span className="sr-only">Filters</span>} count={active} open={open} onClick={() => setOpen(true)} className="gap-1 px-2" />
      )}
      {exportOptions && onExport && (
        <Dropdown label="Export" hideLabel iconOnly={<Download />} align="end" search={false} value={null} options={exportOptions} onValueChange={onExport} />
      )}
      {add && (
        <Button size="icon-sm" aria-label={add.label} onClick={add.onClick}>
          <Add />
        </Button>
      )}

      {filters.length > 0 && (
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title="Filters"
          action={{ label: "Clear all", onClick: () => filters.forEach((f) => f.onChange(f.options[0].value)), disabled: active === 0 }}
          footer={
            <Button className="w-full" onClick={() => setOpen(false)}>
              Show results
            </Button>
          }
        >
          <div className="flex flex-col gap-6 px-4 pt-4 pb-6">
            {filters.map((f) => (
              <section key={f.key} className="flex flex-col gap-2.5">
                <h3 className="text-sm leading-5 font-medium text-white/72">{f.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o, i) => (
                    <FilterChip
                      key={o.value}
                      neutral={i === 0}
                      selected={f.value === o.value}
                      // One choice per group; tapping the chosen chip again goes back to "any".
                      onClick={() => f.onChange(f.value === o.value ? f.options[0].value : o.value)}
                    >
                      {o.label}
                    </FilterChip>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
