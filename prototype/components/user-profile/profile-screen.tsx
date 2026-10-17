"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Add, ArrowLeft, Checkmark, Close, CloseOutline, Download, Login, Misuse, Purchase, Renew, UserIdentification } from "@carbon/icons-react"

import type { User } from "@/lib/users/data"
import { moneyProfile } from "@/lib/users/money"
import { identity, lastActivity, PROFILE_TABS, type ProfileTab } from "@/lib/users/profile"
import { Button } from "@/registry/iq/ui/button"
import { ActionMenu, type ActionItem } from "@/components/dropdown"
import { cn } from "@/lib/utils"
import { Badge } from "@/registry/iq/ui/badge"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { Tabs, TabsContent, TabsLineList, TabsLineTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { ActivityTab } from "./activity-tab"
import { NotificationsTab } from "./notifications-tab"
import { NewAccountWizard } from "./new-account-wizard"
import { OverviewTab } from "./overview-tab"
import { SubscriptionsTab } from "./subscriptions-tab"
import { statusMeta } from "@/components/users/columns"
import { CompactStat, Card } from "./shared"
import { StatusNotice } from "./status-notice"
import { TradingTab } from "./trading-tab"

// Figma: Actions · panel of the User Profile — everyday actions on the left, risk and blocking on the right.
const ACTION_SECTIONS: ActionItem[][] = [
  [
    { value: "new-account", label: "New trading account", icon: <Add /> },
    { value: "impersonate", label: "Impersonate", icon: <Login /> },
    { value: "export", label: "Export user data", icon: <Download /> },
    { value: "sync-kyc", label: "Sync KYC", icon: <Renew /> },
    { value: "approve-kyc", label: "Approve KYC manually", icon: <UserIdentification /> },
  ],
  [
    { value: "bypass-fraud", label: "Bypass fraud check", icon: <Checkmark /> },
    { value: "block-purchases", label: "Block purchases", icon: <Purchase />, tone: "danger" },
    { value: "block-fraud", label: "Block for fraud", icon: <CloseOutline />, tone: "danger" },
    { value: "remove-affiliate", label: "Remove affiliate", icon: <Close />, tone: "danger" },
    { value: "ban", label: "Ban user", icon: <Misuse />, tone: "danger" },
  ],
]
const actionLabel = (v: string) => ACTION_SECTIONS.flat().find((a) => a.value === v)?.label

function ProfileActions({ user, compact = false, onNewAccount }: { user: User; compact?: boolean; onNewAccount: () => void }) {
  return (
    <div data-touch-actions={compact ? undefined : ""} className={cn("flex shrink-0 items-center gap-2", !compact && "max-lg:w-full max-lg:flex-row-reverse")}>
      <ActionMenu label="Actions" columns sections={ACTION_SECTIONS} onSelect={(v) => (v === "new-account" ? onNewAccount() : toast.info(`${actionLabel(v)} isn’t in this prototype yet`))} />
      <Button variant="secondary" size="sm" onClick={() => toast.info("Edit user isn’t in this prototype yet")}>
        Edit user
      </Button>
      <Button size="sm" className="max-lg:flex-1" onClick={() => toast.success("Verification sent", { description: `Email and SMS sent to ${user.email}` })}>
        Verify contact
      </Button>
    </div>
  )
}

export function ProfileScreen({ user }: { user: User }) {
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = (PROFILE_TABS.some((t) => t.value === params.get("tab")) ? params.get("tab") : "overview") as ProfileTab
  const id = identity(user)

  const setTab = (value: string) => {
    const next = new URLSearchParams(params)
    if (value === "overview") next.delete("tab")
    else next.set("tab", value)
    // Native history keeps useSearchParams in sync without a server round trip, so tabs switch instantly.
    window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`)
  }

  // Compact header (Figma: Profile Header · Compact): appears once the profile tabs scroll out of view.
  const tabsRef = React.useRef<HTMLDivElement>(null)
  const [compact, setCompact] = React.useState(false)
  const [wizardOpen, setWizardOpen] = React.useState(false)
  React.useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    // The page scrolls inside the App Shell's content area, not the window.
    let scroller: HTMLElement | null = el.parentElement
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement
    const target: HTMLElement | Window = scroller ?? window
    const update = () => {
      const top = scroller ? scroller.getBoundingClientRect().top : 0
      setCompact(el.getBoundingClientRect().bottom <= top)
    }
    update()
    target.addEventListener("scroll", update, { passive: true })
    return () => target.removeEventListener("scroll", update)
  }, [])

  return (
    <>
    <div className="sticky top-0 z-20 h-0">
      <div
        aria-hidden={!compact}
        className={cn(
          "border-b border-(--border-divider) bg-(--surface-canvas) transition-[opacity,translate] duration-150",
          compact ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <div className="mx-auto flex h-12 w-full max-w-[1544px] items-center gap-3 px-4 lg:gap-5 lg:px-14">
          <div className="flex w-[189px] shrink-0 items-center gap-2 text-sm max-lg:hidden">
            <Button asChild variant="ghost" size="sm">
              <Link href="/customers/users" tabIndex={compact ? 0 : -1}>
                <ArrowLeft size={16} />
                Users
              </Link>
            </Button>
            <span className="text-(color:--content-tertiary)">/</span>
            <span className="truncate font-medium text-(color:--content-tertiary)">{user.name}</span>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="min-w-0 flex-1">
            <TabsLineList aria-label="Profile sections" className="h-12 border-b-0 px-0">
              {PROFILE_TABS.map((t) => (
                <TabsLineTrigger key={t.value} value={t.value} tone="neutral" tabIndex={compact ? undefined : -1} className="h-12">
                  {t.label}
                </TabsLineTrigger>
              ))}
            </TabsLineList>
          </Tabs>
          {/* Phone: the compact bar keeps only the tabs; the actions stay in the header above. */}
          <div className="contents max-lg:hidden">
            <ProfileActions user={user} compact onNewAccount={() => setWizardOpen(true)} />
          </div>
        </div>
      </div>
    </div>
    <div data-page className="mx-auto flex w-full max-w-[1544px] flex-col gap-5 px-4 pt-8 pb-10 lg:px-14 lg:pt-10 lg:pb-14">
      {/* Figma Profile Header · Expanded (3165:86666): 40px top, actions centred on the name block. Mobile (3338:13713) keeps the same back link above the name. */}
      <header className="flex flex-col">
        <Button asChild variant="ghost" size="sm" className="mb-4 w-fit">
          <Link href="/customers/users">
            <ArrowLeft size={16} />
            Users
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-2xl leading-[1.5] font-medium text-white/80">{user.name}</h1>
              <Badge color={statusMeta[user.status].color} className="shrink-0">{statusMeta[user.status].label}</Badge>
            </div>
            <span className="text-sm leading-normal text-white/50">{user.email}</span>
            <div className="flex flex-wrap items-center gap-4 pt-2 pb-4 text-sm max-lg:gap-x-4 max-lg:gap-y-0.5 max-lg:pt-4 [&_[data-slot=status-dot]]:gap-2 [&_[data-slot=status-dot]]:text-sm [&_[data-slot=status-dot]]:font-medium [&_[data-slot=status-dot]]:text-white/50">
              <StatusDot tone={user.verification === "verified" ? "positive" : "warning"} className="">
                {user.verification === "verified" ? "Verified" : "Not verified"}
              </StatusDot>
              <StatusDot tone={id.purchases === "Allowed" ? "positive" : "negative"}>
                Purchases {id.purchases.toLowerCase()}
              </StatusDot>
              <StatusDot tone={id.fraud === "Flagged" ? "negative" : "neutral"} className={id.fraud === "Flagged" ? undefined : "[&>span:first-child]:bg-white/20"}>
                {id.fraud}
              </StatusDot>
              <span className="border-l border-[#2e3130] pl-4 text-(color:--content-tertiary) max-lg:basis-full max-lg:border-l-0 max-lg:pl-0">Last activity · {lastActivity}</span>
            </div>
          </div>
          <ProfileActions user={user} onNewAccount={() => setWizardOpen(true)} />
        </div>
      </header>

      <StatusNotice user={user} />

      <Card aria-label="Key numbers" className="flex flex-wrap max-lg:hidden">
        {moneyProfile(user.id).header.map((k) => (
          <CompactStat key={k.title} title={k.title} value={k.value} caption={k.caption} tone={k.tone} />
        ))}
      </Card>

      {/* Mobile (Davi 17/10): the key numbers sit above the tabs, in one row that scrolls sideways, so the tabs only
          head the content they switch. Scrollbar close to the cards (pb-1). */}
      <div data-kpi-scroll className="scroll-no-arrows -mx-4 overflow-x-auto px-4 pb-1 lg:hidden">
        <Card aria-label="Key numbers" className="flex w-max">
          {moneyProfile(user.id).header.map((k) => (
            <CompactStat key={k.title} title={k.title} value={k.value} caption={k.caption} tone={k.tone} />
          ))}
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-8">
        <TabsLineList ref={tabsRef} aria-label="Profile sections" data-edge-tabs>
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
          <TradingTab onNewAccount={() => setWizardOpen(true)} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
    <NewAccountWizard user={user} open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  )
}
