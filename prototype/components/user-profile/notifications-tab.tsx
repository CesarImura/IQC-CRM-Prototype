"use client"

import * as React from "react"
import { Copy, OverflowMenuVertical, Renew, View } from "@carbon/icons-react"

import { notifications, type Notice } from "@/lib/users/profile"
import { Badge, type BadgeColor } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { ActionMenu, Dropdown } from "@/components/dropdown"
import { createDataTableColumnHelper } from "@/registry/iq/ui/data-table"
import { DataTable } from "@/components/data-table"
import { MobileToolbar } from "@/components/mobile-toolbar"
import { SearchBar } from "@/registry/iq/ui/search-bar"
import { toast } from "@/registry/iq/ui/toast"
import { Toolbar, ToolbarDivider } from "@/registry/iq/ui/toolbar"
import { ValueDate, ValueText } from "@/registry/iq/ui/value-slot"
import { Section } from "./shared"

const sourceColor: Record<Notice["source"], BadgeColor> = { Email: "blue", Web: "gray", External: "green" }
const statusColor: Record<Notice["status"], BadgeColor> = { Delivered: "green", Opened: "blue", Failed: "red", Pending: "yellow", Bounced: "red" }

const col = createDataTableColumnHelper<Notice>()
const columns = col.columns([
  col.accessor("source", {
    header: "Source",
    size: 120,
    cell: (i) => (
      <Badge color={sourceColor[i.getValue()]} size="sm">
        {i.getValue()}
      </Badge>
    ),
  }),
  col.accessor("date", { header: "Date", size: 150, cell: ({ row }) => <ValueDate date={row.original.date} time={row.original.time} /> }),
  col.accessor("type", {
    header: "Type",
    size: 180,
    cell: (i) => (
      <span className="inline-flex rounded-full bg-(--primitive-white-8) px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-[#b7bcc5]">{i.getValue()}</span>
    ),
  }),
  col.accessor("category", { header: "Category", size: 180, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  col.accessor("status", {
    header: "Status",
    size: 150,
    cell: (i) => (
      <Badge color={statusColor[i.getValue()]} size="sm">
        {i.getValue()}
      </Badge>
    ),
  }),
  col.accessor("id", { header: "Reference", size: 220, cell: (i) => <ValueText>{i.getValue()}</ValueText> }),
  col.display({
    id: "actions",
    size: 64,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <ActionMenu
          label={`Actions for ${row.original.id}`}
          iconOnly={<OverflowMenuVertical />}
          align="end"
          sections={[
            [
              { value: "view", label: "View content", icon: <View /> },
              { value: "resend", label: "Resend notification", icon: <Renew /> },
              { value: "copy", label: "Copy reference", icon: <Copy /> },
            ],
          ]}
          onSelect={(v) => {
            if (v === "copy") {
              void navigator.clipboard?.writeText(row.original.id)
              toast.success("Reference copied", { description: row.original.id })
            } else if (v === "resend") toast.success("Notification sent again", { description: `${row.original.type} · ${row.original.source}` })
            else toast.info("Notification content isn’t in this prototype yet")
          }}
        />
      </div>
    ),
  }),
])

const ALL = "all"
const TYPE_OPTIONS = [{ value: ALL, label: "All types" }, ...[...new Set(notifications.map((n) => n.type))].map((t) => ({ value: t, label: t }))]
const STATUS_OPTIONS = [{ value: ALL, label: "All status" }, ...["Delivered", "Opened", "Pending", "Failed", "Bounced"].map((s) => ({ value: s, label: s }))]

export function NotificationsTab() {
  const [search, setSearch] = React.useState("")
  const [type, setType] = React.useState(ALL)
  const [status, setStatus] = React.useState(ALL)
  const [page, setPage] = React.useState({ pageIndex: 0, pageSize: 25 })

  const rows = notifications.filter(
    (n) =>
      (type === ALL || n.type === type) &&
      (status === ALL || n.status === status) &&
      (!search || `${n.id} ${n.type} ${n.category} ${n.source}`.toLowerCase().includes(search.toLowerCase()))
  )
  const reset = () => {
    setSearch("")
    setType(ALL)
    setStatus(ALL)
  }

  return (
    <Section title="All notifications">
      <DataTable
        columns={columns}
        data={rows}
        pinnedRight={["actions"]}
        pagination={{ state: page, onChange: setPage, showPageSize: true, pageSizeOptions: [10, 25, 50], summary: `${rows.length} notifications` }}
        toolbar={
          <>
          <div className="w-full lg:hidden">
            <MobileToolbar
              search={{ value: search, onChange: setSearch, placeholder: "Reference, type, category…", label: "Search notifications" }}
              filters={[
                { key: "type", label: "Type", value: type, onChange: setType, options: TYPE_OPTIONS },
                { key: "status", label: "Status", value: status, onChange: setStatus, options: STATUS_OPTIONS },
              ]}
              exportOptions={[{ value: "csv", label: `CSV · ${rows.length} notifications` }]}
              onExport={() => toast.success(`Exported ${rows.length} notifications`, { description: "CSV downloaded" })}
            />
          </div>
          <Toolbar surface={false} className="w-full max-lg:hidden"
            filters={
              <>
                <div className="w-64">
                  <SearchBar placeholder="Reference, type, category…" aria-label="Search notifications" value={search} onValueChange={setSearch} />
                </div>
                <ToolbarDivider />
                <Dropdown
                  label="Type"
                  hideLabel
                  size="sm"
                  search={false}
                  value={type}
                  options={TYPE_OPTIONS}
                  onValueChange={setType}
                />
                <Dropdown
                  label="Status"
                  hideLabel
                  size="sm"
                  search={false}
                  value={status}
                  options={STATUS_OPTIONS}
                  onValueChange={setStatus}
                />
                <Button variant="secondary" size="icon-sm" aria-label="Reset filters" onClick={reset}>
                  <Renew />
                </Button>
              </>
            }
            actions={
              <Dropdown
                label="Export"
                placeholder="Export"
                hideLabel
                size="sm"
                align="end"
                search={false}
                value={null}
                options={[{ value: "csv", label: `CSV · ${rows.length} notifications` }]}
                onValueChange={() => toast.success(`Exported ${rows.length} notifications`, { description: "CSV downloaded" })}
              />
            }
          />
          </>
        }
        emptyState={{ title: "No notifications match", description: "Try another search or filter." }}
      />
    </Section>
  )
}
