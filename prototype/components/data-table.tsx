"use client"

import * as React from "react"

import { MobilePagination } from "@/components/mobile-pagination"
import { DataTable as DsDataTable, type DataTableProps } from "@/registry/iq/ui/data-table"

type PageState = { pageIndex: number; pageSize: number }

/**
 * The DS Data Table plus the mobile pagination (Pagination · Mobile: Rows per page + Previous / Next) below lg.
 * Below lg the DS pagination inside the table is hidden by CSS (`[data-slot=table-with-pager]`). Paging state is
 * lifted here so both pagers drive the same page.
 */
export function DataTable<TData extends Record<string, unknown> | unknown[]>(props: DataTableProps<TData>) {
  const p = props.pagination ?? {}
  const [inner, setInner] = React.useState<PageState>({ pageIndex: 0, pageSize: p ? (p.pageSizeOptions?.[1] ?? 25) : 25 })
  if (p === false) return <DsDataTable<TData> {...props} />

  const state = p.state ?? inner
  const set = (next: PageState) => (p.onChange ? p.onChange(next) : setInner(next))
  const total = p.manual ? p.manual.rowCount : props.data.length
  // Client-side filters can shrink the data under the current page.
  const lastPage = Math.max(0, Math.ceil(total / state.pageSize) - 1)
  const safe = state.pageIndex > lastPage ? { ...state, pageIndex: lastPage } : state

  return (
    <div data-slot="table-with-pager" className="flex min-w-0 flex-col">
      <DsDataTable<TData>
        {...props}
        pagination={{ ...p, state: safe, onChange: (u) => set(typeof u === "function" ? u(safe) : u) }}
      />
      {total > 0 && (
        <div className="lg:hidden">
          <MobilePagination pageIndex={safe.pageIndex} pageSize={safe.pageSize} total={total} sizes={p.pageSizeOptions ?? [10, 25, 50]} onChange={set} />
        </div>
      )}
    </div>
  )
}
