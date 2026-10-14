"use client"

import * as React from "react"
import { Add, CloseOutline, List, Time, User as UserIcon } from "@carbon/icons-react"

import { TODAY, type User } from "@/lib/users/data"
import { emptyFilters, getUserStats, queryUsers, type UsersFilters, type UsersSort, type UsersTab } from "@/lib/users/query"
import { Button } from "@/registry/iq/ui/button"
import { Dropdown } from "@/registry/iq/ui/combobox"
import { DataTable, type DataTableProps } from "@/registry/iq/ui/data-table"
import { DatePicker } from "@/registry/iq/ui/date-picker"
import { PageHeader } from "@/registry/iq/ui/page-header"
import { SelectionBar } from "@/registry/iq/ui/selection-bar"
import { StatCard } from "@/registry/iq/ui/stat-card"
import { Tabs, TabsLineList, TabsLineTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { getUserColumns, statusMeta, type RowAction } from "./columns"
import { AddUserModal, BanUserModal } from "./user-modals"
import { UsersResultsBar, UsersToolbar } from "./users-toolbar"

const PAGE_SIZE = 25
const fmt = (n: number) => n.toLocaleString("en-US")

type Overrides = { added: User[]; patched: Map<string, Partial<User>> }
type Selection = NonNullable<DataTableProps<User>["rowSelection"]>

export function UsersScreen() {
  const [tab, setTab] = React.useState<UsersTab>("all")
  const [filters, setFiltersState] = React.useState<UsersFilters>(emptyFilters)
  const [sorting, setSorting] = React.useState<NonNullable<DataTableProps<User>["sorting"]>>([])
  const [page, setPage] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [selection, setSelection] = React.useState<Selection>({})
  const [overrides, setOverrides] = React.useState<Overrides>({ added: [], patched: new Map() })
  const [banTarget, setBanTarget] = React.useState<User | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

  // Typing in search re-runs the query over ~64k rows; let React keep the input responsive.
  const deferredFilters = React.useDeferredValue(filters)
  const sort: UsersSort = sorting[0] ? { id: sorting[0].id as keyof User, desc: sorting[0].desc } : null

  const result = React.useMemo(
    () => queryUsers({ tab, filters: deferredFilters, sort, page: page.pageIndex, pageSize: page.pageSize }, overrides),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, deferredFilters, sorting, page, overrides]
  )
  const stats = React.useMemo(() => getUserStats(), [])

  const resetPaging = () => {
    setPage((p) => ({ ...p, pageIndex: 0 }))
    setSelection({})
  }
  const setFilters = (next: UsersFilters) => {
    setFiltersState(next)
    resetPaging()
  }
  const countFor = React.useCallback(
    (draft: UsersFilters) => queryUsers({ tab, filters: draft, sort: null, page: 0, pageSize: 0 }, overrides).total,
    [tab, overrides]
  )

  function patchUsers(ids: string[], patch: Partial<User>) {
    setOverrides((o) => {
      const patched = new Map(o.patched)
      for (const id of ids) patched.set(id, { ...patched.get(id), ...patch })
      return { ...o, patched }
    })
  }
  function undoPatch(ids: string[], previous: Map<string, Partial<User> | undefined>) {
    setOverrides((o) => {
      const patched = new Map(o.patched)
      for (const id of ids) {
        const before = previous.get(id)
        if (before) patched.set(id, before)
        else patched.delete(id)
      }
      return { ...o, patched }
    })
  }
  function changeStatus(users: User[], patch: Partial<User>, message: string) {
    const ids = users.map((u) => u.id)
    const previous = new Map(ids.map((id) => [id, overrides.patched.get(id)]))
    patchUsers(ids, patch)
    toast.success(message, { action: { label: "Undo", onClick: () => undoPatch(ids, previous) } })
  }

  const onAction = React.useCallback(
    (user: User, action: RowAction) => {
      switch (action) {
        case "view":
        case "edit":
          toast.info(`${action === "view" ? "User profile" : "Edit user"} isn’t in this prototype yet`, { description: user.email })
          break
        case "suspend":
          changeStatus([user], { status: "suspended" }, `${user.name} suspended`)
          break
        case "reactivate":
          changeStatus([user], { status: "active" }, `${user.name} reactivated`)
          break
        case "ban":
          setBanTarget(user)
          break
        case "unban":
          changeStatus([user], { status: "active", banReason: null }, `Ban lifted for ${user.name}`)
          break
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides]
  )
  const columns = React.useMemo(() => getUserColumns(onAction), [onAction])

  const selectedIds = Object.keys(selection).filter((id) => selection[id])
  const selectedUsers = () => result.rows.filter((u) => selectedIds.includes(u.id))

  function exportCsv(scope: "results" | "selected") {
    const rows =
      scope === "selected"
        ? selectedUsers()
        : queryUsers({ tab, filters, sort, page: 0, pageSize: Number.MAX_SAFE_INTEGER }, overrides).rows
    const header = ["User ID", "Email", "Name", "Username", "Accounts", "Status", "Ban Reason", "Verified", "Affiliate", "Registered", "Role", "Phone", "UTM Source"]
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const csv = [header, ...rows.map((u) => [u.id, u.email, u.name, u.username, u.accounts, statusMeta[u.status].label, u.banReason, u.verification, u.affiliate, u.registered, u.role, u.phone, u.utm])]
      .map((r) => r.map(escape).join(","))
      .join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = Object.assign(document.createElement("a"), { href: url, download: `users-${TODAY.toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${fmt(rows.length)} users`, { description: "CSV downloaded" })
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Users"
        actions={
          <div className="flex items-center gap-2">
            <DatePicker
              mode="range"
              placeholder="All time"
              today={TODAY}
              maxDate={TODAY}
              value={filters.period}
              onValueChange={(period) => setFilters({ ...filters, period })}
            />
            <Button size="sm" onClick={() => setAddOpen(true)}>
              Add User
              <Add />
            </Button>
          </div>
        }
      />

      {/* KPI strip: four compact Stat Cards sharing borders. */}
      <section aria-label="Key numbers" className="grid grid-cols-2 xl:grid-cols-4 [&>*]:-mr-px [&>*]:-mb-px [&>*]:h-[140px]">
        <StatCard title="Users" value={fmt(stats.total)} caption={`+${fmt(stats.new7)} in the last 7 days`} className="rounded-l-[4px]" />
        <StatCard title="New · 30 days" value={fmt(stats.new30)} valueTone="positive" caption={`Registered · ${stats.new30BoughtPct}% bought a challenge`} />
        <StatCard title="KYC verified" value={`${stats.verifiedPct.toFixed(1)}%`} caption={`${fmt(stats.pending)} waiting for review`} />
        <StatCard
          title="Banned"
          value={fmt(stats.banned)}
          valueTone="negative"
          caption={`${stats.bannedPct.toFixed(1)}% · ${stats.bannedThisMonth} this month`}
          className="rounded-r-[4px]"
        />
      </section>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as UsersTab)
          resetPaging()
        }}
        className="gap-0"
      >
        <TabsLineList aria-label="User views" className="bg-(--surface-raised)">
          <TabsLineTrigger value="all" tone="accent" icon={<List />} count={fmt(result.tabCounts.all)}>
            All
          </TabsLineTrigger>
          <TabsLineTrigger value="needs_action" tone="warning" icon={<Time />} count={fmt(result.tabCounts.needs_action)}>
            Needs action
          </TabsLineTrigger>
          <TabsLineTrigger value="banned" tone="danger" icon={<CloseOutline />} count={fmt(result.tabCounts.banned)}>
            Banned
          </TabsLineTrigger>
        </TabsLineList>
      </Tabs>

      <UsersToolbar
        filters={filters}
        onFiltersChange={setFilters}
        countFor={countFor}
        exportMenu={
          <Dropdown
            label="Export"
            placeholder="Export"
            hideLabel
            align="end"
            search={false}
            value={null}
            options={[
              { value: "results", label: `CSV · all ${fmt(result.total)} results` },
              { value: "selected", label: `CSV · ${fmt(selectedIds.length)} selected`, disabled: selectedIds.length === 0 },
            ]}
            onValueChange={(v) => exportCsv(v as "results" | "selected")}
          />
        }
      />

      <UsersResultsBar filters={filters} onFiltersChange={setFilters} total={result.total} />

      {selectedIds.length > 0 && (
        <SelectionBar count={selectedIds.length} onClear={() => setSelection({})} className="border-t-0">
          <Button variant="secondary" size="sm" onClick={() => exportCsv("selected")}>
            Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => changeStatus(selectedUsers(), { status: "suspended" }, `${selectedIds.length} users suspended`)}>
            Suspend
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              changeStatus(selectedUsers(), { status: "banned", banReason: "Bulk action" }, `${selectedIds.length} users banned`)
              setSelection({})
            }}
          >
            Ban
          </Button>
        </SelectionBar>
      )}

      <DataTable
        className="min-w-0 flex-1"
        columns={columns}
        data={result.rows}
        getRowId={(row) => row.id}
        enableRowSelection
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        renderSelectionExtra={() => (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--table-avatar-bg) text-white/60">
            <UserIcon size={16} />
          </span>
        )}
        sorting={sorting}
        onSortingChange={(updater) => {
          setSorting(updater)
          resetPaging()
        }}
        manualSorting
        pinnedRight={["actions"]}
        emptyState={{
          title: "No users match",
          description: "Try another search or remove a filter.",
          action: (
            <Button variant="secondary" size="sm" onClick={() => setFilters(emptyFilters)}>
              Clear filters
            </Button>
          ),
        }}
        pagination={{
          state: page,
          onChange: (updater) => {
            setPage(updater)
            setSelection({})
          },
          manual: { rowCount: result.total },
          showPageSize: false,
          summary: `${fmt(result.total)} Users`,
        }}
      />

      <AddUserModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={(user) => {
          setOverrides((o) => ({ ...o, added: [user, ...o.added] }))
          setTab("all")
          setSorting([])
          resetPaging()
          toast.success(`${user.name} added`, { description: "They’ll get an email to finish KYC." })
        }}
      />
      <BanUserModal
        user={banTarget}
        onOpenChange={(open) => !open && setBanTarget(null)}
        onConfirm={(user, reason) => {
          changeStatus([user], { status: "banned", banReason: reason }, `${user.name} banned`)
          setBanTarget(null)
        }}
      />
    </div>
  )
}

