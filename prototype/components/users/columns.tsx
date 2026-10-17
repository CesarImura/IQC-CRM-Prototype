"use client"

import { Edit, Misuse, OverflowMenuVertical, PauseOutline, PlayOutline, Undo, UserAvatar, View } from "@carbon/icons-react"

import type { Role, User, UserStatus, UtmSource, Verification } from "@/lib/users/data"
import { Badge, type BadgeColor } from "@/registry/iq/ui/badge"
import { ActionMenu, type ActionItem } from "@/components/dropdown"
import { createDataTableColumnHelper } from "@/registry/iq/ui/data-table"
import { Pill } from "@/registry/iq/ui/pill"
import { StatusDot, type StatusTone } from "@/registry/iq/ui/status-dot"
import { ValueLink, ValueNumber, ValueText } from "@/registry/iq/ui/value-slot"

export const statusMeta: Record<UserStatus, { label: string; color: BadgeColor }> = {
  active: { label: "Active", color: "green" },
  kyc_pending: { label: "KYC pending", color: "yellow" },
  suspended: { label: "Suspended", color: "gray" },
  banned: { label: "Banned", color: "red" },
}

export const verificationMeta: Record<Verification, { label: string; tone: StatusTone }> = {
  verified: { label: "Verified", tone: "positive" },
  pending: { label: "Pending", tone: "warning" },
  unverified: { label: "Unverified", tone: "neutral" },
}

export const roleMeta: Record<Role, { label: string; color: BadgeColor }> = {
  client: { label: "Client", color: "yellow" },
  owner: { label: "Owner", color: "purple" },
  admin: { label: "Admin", color: "blue" },
  affiliate: { label: "Affiliate", color: "green" },
}

export const utmLabels: Record<UtmSource | "none", string> = {
  google: "Google",
  meta: "Meta",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  discord: "Discord",
  newsletter: "Newsletter",
  none: "No UTM",
}

export type RowAction = "view" | "edit" | "suspend" | "reactivate" | "ban" | "unban"

export const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`
const Empty = () => <ValueText className="text-(color:--content-disabled)">—</ValueText>

const col = createDataTableColumnHelper<User>()

// Widths from the Figma table (2152px wide: it scrolls sideways inside the 1545px content area).
export function getUserColumns(onAction: (user: User, action: RowAction) => void) {
  return col.columns([
    col.accessor("id", {
      header: "User ID",
      size: 140,
      enableSorting: false,
      cell: (info) => <ValueText title={info.getValue()}>{shortId(info.getValue())}</ValueText>,
    }),
    col.accessor("email", {
      header: "Email",
      size: 230,
      cell: (info) => (
        <ValueLink href={`mailto:${info.getValue()}`} onClick={(e) => e.stopPropagation()}>
          {info.getValue()}
        </ValueLink>
      ),
    }),
    col.accessor("name", { header: "Name", size: 160, cell: (info) => <ValueText>{info.getValue()}</ValueText> }),
    col.accessor("username", { header: "Username", size: 140, cell: (info) => <ValueText>{info.getValue()}</ValueText> }),
    col.accessor("accounts", { header: "Accounts", size: 120, cell: (info) => <ValueNumber>{info.getValue()}</ValueNumber> }),
    col.accessor("status", {
      header: "Status",
      size: 140,
      cell: (info) => {
        const meta = statusMeta[info.getValue()]
        return <Badge color={meta.color}>{meta.label}</Badge>
      },
    }),
    col.accessor("banReason", {
      header: "Ban Reason",
      size: 180,
      enableSorting: false,
      cell: (info) => (info.getValue() ? <ValueText>{info.getValue()}</ValueText> : <Empty />),
    }),
    col.accessor("verification", {
      header: "Verified",
      size: 130,
      cell: (info) => {
        const meta = verificationMeta[info.getValue()]
        return <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
      },
    }),
    col.accessor("affiliate", {
      header: "Affiliate",
      size: 190,
      cell: (info) => {
        const affiliate = info.getValue()
        return affiliate ? <Pill icon={<UserAvatar />}>{affiliate}</Pill> : <Empty />
      },
    }),
    col.accessor("registered", {
      header: "Registered",
      size: 130,
      cell: (info) => <ValueText>{dateFormat.format(new Date(info.getValue()))}</ValueText>,
    }),
    col.accessor("role", {
      header: "Roles",
      size: 120,
      cell: (info) => {
        const meta = roleMeta[info.getValue()]
        return <Badge color={meta.color}>{meta.label}</Badge>
      },
    }),
    col.accessor("phone", { header: "Phone", size: 170, enableSorting: false, cell: (info) => <ValueText>{info.getValue()}</ValueText> }),
    col.accessor("utm", {
      header: "UTM Source",
      size: 150,
      cell: (info) => (info.getValue() ? <ValueText>{utmLabels[info.getValue()!]}</ValueText> : <Empty />),
    }),
    col.display({
      id: "actions",
      size: 64,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <RowActions user={row.original} onAction={onAction} />,
    }),
  ])
}

export function RowActions({ user, onAction }: { user: User; onAction: (user: User, action: RowAction) => void }) {
  const sections: ActionItem[][] = [
    [
      { value: "view", label: "View profile", icon: <View /> },
      { value: "edit", label: "Edit user", icon: <Edit /> },
      user.status === "suspended"
        ? { value: "reactivate", label: "Reactivate", icon: <PlayOutline /> }
        : { value: "suspend", label: "Suspend", icon: <PauseOutline />, tone: "warning" },
    ],
    [
      user.status === "banned"
        ? { value: "unban", label: "Lift ban", icon: <Undo /> }
        : { value: "ban", label: "Ban user", icon: <Misuse />, tone: "danger" },
    ],
  ]
  return (
    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
      <ActionMenu
        label={`Actions for ${user.name}`}
        iconOnly={<OverflowMenuVertical />}
        align="end"
        sections={sections}
        onSelect={(value) => onAction(user, value as RowAction)}
      />
    </div>
  )
}

// Mobile table (Figma Smart filter · mobile, F1): User first, the other columns scroll sideways, ⋮ last and not pinned.
export function getMobileUserColumns(onAction: (user: User, action: RowAction) => void) {
  return col.columns([
    col.accessor("name", {
      header: "User",
      size: 190,
      cell: ({ row }) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-5 text-(color:--content-default)">{row.original.name}</span>
          <span className="truncate text-xs leading-4 text-(color:--content-muted)">{row.original.email}</span>
        </span>
      ),
    }),
    col.accessor("accounts", { header: "Accounts", size: 120, cell: (info) => <ValueNumber>{info.getValue()}</ValueNumber> }),
    col.accessor("status", {
      header: "Status",
      size: 150,
      cell: (info) => {
        const meta = statusMeta[info.getValue()]
        return <Badge color={meta.color}>{meta.label}</Badge>
      },
    }),
    col.accessor("affiliate", {
      header: "Affiliate",
      size: 190,
      cell: (info) => {
        const affiliate = info.getValue()
        return affiliate ? <Pill icon={<UserAvatar />}>{affiliate}</Pill> : <Empty />
      },
    }),
    col.accessor("registered", { header: "Registered", size: 130, cell: (info) => <ValueText>{dateFormat.format(new Date(info.getValue()))}</ValueText> }),
    col.accessor("role", {
      header: "Roles",
      size: 110,
      cell: (info) => {
        const meta = roleMeta[info.getValue()]
        return <Badge color={meta.color}>{meta.label}</Badge>
      },
    }),
    col.accessor("utm", { header: "UTM Source", size: 130, cell: (info) => (info.getValue() ? <ValueText>{utmLabels[info.getValue()!]}</ValueText> : <Empty />) }),
    col.display({
      id: "actions",
      size: 64,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <RowActions user={row.original} onAction={onAction} />,
    }),
  ])
}
