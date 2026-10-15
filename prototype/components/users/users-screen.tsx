"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Add, Calendar, CloseOutline, List, Time, User as UserIcon } from "@carbon/icons-react"

import { ExportMenu, TimeFilter } from "@/components/dropdown"
import { downloadCsv, downloadExcel } from "@/lib/export"
import { TODAY, type User } from "@/lib/users/data"
import { emptyFilters, getUserStats, queryUsers, type UsersFilters, type UsersSort, type UsersTab } from "@/lib/users/query"
import { Button } from "@/registry/iq/ui/button"
import { DataTable, type DataTableProps } from "@/registry/iq/ui/data-table"
import { PageHeader } from "@/registry/iq/ui/page-header"
import { SelectionBar } from "@/registry/iq/ui/selection-bar"
import { StatCard } from "@/registry/iq/ui/stat-card"
import { Tabs, TabsLineList, TabsLineTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { getUserColumns, statusMeta, type RowAction } from "./columns"
import { AddUserModal, BanUserModal } from "./user-modals"
import { UsersResultsBar, UsersToolbar } from "./users-toolbar"

const PAGE_SIZE = 25
const PERIODS = [
  { value: "all", label: "All time" },
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last month" },
  { value: "90", label: "Last quarter" },
  { value: "365", label: "Last year" },
]
const PERIOD_DAYS: Record<string, number | undefined> = { "1": 1, "7": 7, "30": 30, "90": 90, "365": 365 }
const fmt = (n: number) => n.toLocaleString("en-US")

type Overrides = { added: User[]; patched: Map<string, Partial<User>> }
type Selection = NonNullable<DataTableProps<User>["rowSelection"]>

export function UsersScreen() {
  const router = useRouter()
  const [tab, setTab] = React.useState<UsersTab>("all")
  const [filters, setFiltersState] = React.useState<UsersFilters>(emptyFilters)
  const [period, setPeriod] = React.useState("all")
  const [sorting, setSorting] = React.useState<NonNullable<DataTableProps<User>["sorting"]>>([])
  const [page, setPage] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [selection, setSelection] = React.useState<Selection>({})
  const [overrides, setOverrides] = React.useState<Overrides>({ added: [], patched: new Map() })
  const [banTarget, setBanTarget] = React.useState<User | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const prefetched = React.useRef(new Set<string>())

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
          router.push(`/customers/users/${user.id}`)
          break
        case "edit":
          toast.info("Edit user isn’t in this prototype yet", { description: user.email })
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

  const EXPORT_HEADER = ["User ID", "Email", "Name", "Username", "Accounts", "Status", "Ban Reason", "Verified", "Affiliate", "Registered", "Role", "Phone", "UTM Source"]
  const exportRow = (u: User) => [u.id, u.email, u.name, u.username, u.accounts, statusMeta[u.status].label, u.banReason, u.verification, u.affiliate, u.registered, u.role, u.phone, u.utm]

  function exportFiles(choices: string[], selectedOnly = false) {
    const stamp = TODAY.toISOString().slice(0, 10)
    const sets = {
      view: () => queryUsers({ tab, filters, sort, page: 0, pageSize: Number.MAX_SAFE_INTEGER }, overrides).rows,
      all: () => queryUsers({ tab: "all", filters: emptyFilters, sort: null, page: 0, pageSize: Number.MAX_SAFE_INTEGER }, overrides).rows,
    }
    let total = 0
    for (const choice of choices) {
      const [scope, format] = choice.split("-") as ["view" | "all", "csv" | "xlsx"]
      const rows = selectedOnly ? selectedUsers() : sets[scope]()
      const name = `users-${selectedOnly ? "selected" : scope === "view" ? `${tab.replace("_", "-")}-view` : "all"}-${stamp}`
      if (format === "csv") downloadCsv(name, EXPORT_HEADER, rows.map(exportRow))
      else downloadExcel(name, "Users", EXPORT_HEADER, rows.map(exportRow))
      total = Math.max(total, rows.length)
    }
    toast.success(choices.length > 1 ? `${choices.length} files exported` : `Exported ${fmt(total)} users`, { description: "Download started" })
  }

  return (
    <div
      data-page
      className="flex min-h-full flex-col"
      onPointerOver={(e) => {
        // Warm the profile while the pointer is on its row, so the click opens it from cache.
        const tr = (e.target as HTMLElement).closest("tbody tr")
        if (!tr || !tr.parentElement) return
        const user = result.rows[Array.prototype.indexOf.call(tr.parentElement.children, tr)]
        if (user && !prefetched.current.has(user.id)) {
          prefetched.current.add(user.id)
          router.prefetch(`/customers/users/${user.id}`)
        }
      }}
    >
      <PageHeader
        title="Users"
        actions={
          <div className="flex items-center gap-2">
            <TimeFilter
              label="Period"
              icon={<Calendar />}
              align="end"
              options={PERIODS}
              value={period}
              onValueChange={(v) => {
                setPeriod(v)
                const days = PERIOD_DAYS[v]
                setFilters({ ...filters, period: days ? { from: new Date(TODAY.getTime() - days * 86_400_000), to: TODAY } : { from: null, to: null } })
              }}
            />
            <Button size="sm" onClick={() => setAddOpen(true)}>
              Add User
              <Add />
            </Button>
          </div>
        }
      />

      {/* KPI strip: four compact Stat Cards sharing borders. */}
      <section aria-label="Key numbers" className="flex [&>*]:h-[140px] [&>*]:min-w-0 [&>*]:flex-1 [&>*:not(:first-child)]:-ml-px">
        <StatCard title="Users" value={fmt(stats.total)} caption={`+${fmt(stats.new7)} in the last 7 days`} />
        <StatCard title="New · 30 days" value={fmt(stats.new30)} valueTone="positive" caption={`Registered · ${stats.new30BoughtPct}% bought a challenge`} />
        <StatCard title="KYC verified" value={`${stats.verifiedPct.toFixed(1)}%`} caption={`${fmt(stats.pending)} waiting for review`} />
        <StatCard
          title="Banned"
          value={fmt(stats.banned)}
          valueTone="negative"
          caption={`${stats.bannedPct.toFixed(1)}% · ${stats.bannedThisMonth} this month`}
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
        <TabsLineList aria-label="User views" className="border-x border-(--border-divider) bg-(--surface-raised)">
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
          <ExportMenu
            options={[
              { value: "view-csv", label: "Current view · CSV" },
              { value: "view-xlsx", label: "Current view · Excel" },
              { value: "all-csv", label: "All users · CSV" },
              { value: "all-xlsx", label: "All users · Excel" },
            ]}
            onExport={(choices) => exportFiles(choices)}
          />
        }
      />

      <UsersResultsBar filters={filters} onFiltersChange={setFilters} total={result.total} />

      {selectedIds.length > 0 && (
        <SelectionBar count={selectedIds.length} onClear={() => setSelection({})} className="border-t-0">
          <Button variant="secondary" size="sm" onClick={() => exportFiles(["view-csv"], true)}>
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
        className="-mt-px min-w-0 flex-1"
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
        onRowClick={(row) =>
          // While rows are selected, a row click adds or removes it from the selection instead of opening the profile.
          selectedIds.length > 0
            ? setSelection((s) => {
                const next = { ...s }
                if (next[row.original.id]) delete next[row.original.id]
                else next[row.original.id] = true
                return next
              })
            : router.push(`/customers/users/${row.original.id}`)
        }
        emptyState={{
          title: "No users match",
          description: "Try another search or remove a filter.",
          action: (
            <Button variant="secondary" size="sm" onClick={() => { setFilters(emptyFilters); setPeriod("all") }}>
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
          layout: "input",
          pageSizeOptions: [25, 50, 100],
          showPageSize: true,
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

