"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "@carbon/icons-react"

import type { User } from "@/lib/users/data"
import { headerKpis, identity, lastActivity, PROFILE_TABS, type ProfileTab } from "@/lib/users/profile"
import { Button } from "@/registry/iq/ui/button"
import { Dropdown } from "@/components/dropdown"
import { StatCard } from "@/registry/iq/ui/stat-card"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { Tabs, TabsContent, TabsLineList, TabsLineTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { ActivityTab } from "./activity-tab"
import { NotificationsTab } from "./notifications-tab"
import { OverviewTab } from "./overview-tab"
import { SubscriptionsTab } from "./subscriptions-tab"
import { TradingTab } from "./trading-tab"

const ACTIONS = [
  { value: "impersonate", label: "Impersonate" },
  { value: "kyc", label: "Approve KYC manually" },
  { value: "reset-password", label: "Send password reset" },
  { value: "note", label: "Add note" },
  { value: "suspend", label: "Suspend user", tone: "warning" as const },
  { value: "ban", label: "Ban user", tone: "danger" as const },
]

export function ProfileScreen({ user }: { user: User }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = (PROFILE_TABS.some((t) => t.value === params.get("tab")) ? params.get("tab") : "overview") as ProfileTab
  const id = identity(user)

  const setTab = (value: string) => {
    const next = new URLSearchParams(params)
    if (value === "overview") next.delete("tab")
    else next.set("tab", value)
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }

  return (
    <div className="mx-auto flex w-full max-w-[1544px] flex-col gap-8 px-14 pt-6 pb-14">
      <header className="flex flex-col gap-4">
        <Link
          href="/customers/users"
          className="flex w-fit items-center gap-2 rounded-[2px] text-sm text-(color:--content-secondary) outline-none hover:text-(color:--content-default) focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)]"
        >
          <ArrowLeft size={16} />
          Users
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-xl leading-[1.3] font-medium text-(color:--content-default)">{user.name}</h1>
            <span className="text-sm text-(color:--content-muted)">{user.email}</span>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs">
              <StatusDot tone={user.verification === "verified" ? "positive" : "warning"} className="text-xs font-normal">
                {user.verification === "verified" ? "Verified" : "Not verified"}
              </StatusDot>
              <StatusDot tone={id.purchases === "Allowed" ? "positive" : "negative"} className="text-xs font-normal">
                Purchases {id.purchases.toLowerCase()}
              </StatusDot>
              <StatusDot tone={id.fraud === "Flagged" ? "negative" : "neutral"} className="text-xs font-normal">
                {id.fraud}
              </StatusDot>
              <span className="border-l border-(--border-divider) pl-4 text-(color:--content-muted)">Last activity · {lastActivity}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dropdown
              label="Actions"
              placeholder="Actions"
              hideLabel
              size="sm"
              align="end"
              search={false}
              value={null}
              options={ACTIONS}
              onValueChange={(v) => toast.info(`${ACTIONS.find((a) => a.value === v)?.label} isn’t in this prototype yet`)}
            />
            <Button variant="secondary" size="sm" onClick={() => toast.info("Edit user isn’t in this prototype yet")}>
              Edit User
            </Button>
            <Button size="sm" onClick={() => toast.success("Verification sent", { description: `Email and SMS sent to ${user.email}` })}>
              Verify contact
            </Button>
          </div>
        </div>
      </header>

      <section aria-label="Key numbers" className="flex [&>*]:min-w-0 [&>*]:flex-1 [&>*:not(:first-child)]:-ml-px">
        {headerKpis.map((k) => (
          <StatCard key={k.title} title={k.title} value={k.value} caption={k.caption} valueTone={k.tone ?? "default"} />
        ))}
      </section>

      <Tabs value={tab} onValueChange={setTab} className="-mt-4 gap-8">
        <TabsLineList aria-label="Profile sections">
          {PROFILE_TABS.map((t) => (
            <TabsLineTrigger key={t.value} value={t.value} tone="accent">
              {t.label}
            </TabsLineTrigger>
          ))}
        </TabsLineList>
        <TabsContent value="overview">
          <OverviewTab user={user} />
        </TabsContent>
        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>
        <TabsContent value="trading">
          <TradingTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
