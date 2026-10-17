"use client"

import { WarningAlt } from "@carbon/icons-react"

import type { User } from "@/lib/users/data"
import { Alert } from "@/registry/iq/ui/alert"
import { Button } from "@/registry/iq/ui/button"
import { StatusDot } from "@/registry/iq/ui/status-dot"
import { toast } from "@/registry/iq/ui/toast"

// Profile status notice (Davi 17/10): every profile that isn't a clean Active shows why, right under the header.
// DS Alert: Destructive for Banned, Default with a yellow warning icon for anything waiting on the user or the team.
// Product rules: Status ≠ KYC ≠ Verified; "suspended" is the site's word (never "disabled").

type Check = { label: string; done: boolean }

const KYC_STEPS = (verification: User["verification"]): Check[] =>
  verification === "pending"
    ? [
        { label: "Email", done: true },
        { label: "Phone", done: true },
        { label: "ID document", done: true },
        { label: "Proof of address", done: false },
        { label: "Selfie check", done: false },
      ]
    : [
        { label: "Email", done: true },
        { label: "Phone", done: true },
        { label: "ID document", done: false },
        { label: "Proof of address", done: false },
        { label: "Selfie check", done: false },
      ]

const warnIcon = <WarningAlt size={24} className="text-(color:--status-dot-warning)" />
const notYet = (what: string) => toast.info(`${what} isn’t in this prototype yet`)

function Checklist({ steps }: { steps: Check[] }) {
  return (
    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 [&_[data-slot=status-dot]]:text-sm">
      {steps.map((s) => (
        <StatusDot key={s.label} tone={s.done ? "positive" : "warning"} className={s.done ? "text-white/50" : "text-(color:--content-default)"}>
          {s.label}
        </StatusDot>
      ))}
    </span>
  )
}

export function StatusNotice({ user }: { user: User }) {
  const action = (label: string) => (
    <Button size="sm" variant="secondary" onClick={() => notYet(label)}>
      {label}
    </Button>
  )

  let props: React.ComponentProps<typeof Alert> | null = null
  if (user.status === "banned") {
    props = {
      tone: "destructive",
      title: `Banned · ${user.banReason ?? "Terms violation"}`,
      description: "Can’t log in, buy or request payouts. Open trading accounts were closed.",
      action: action("Unban user"),
    }
  } else if (user.status === "suspended") {
    props = {
      icon: warnIcon,
      title: user.breached ? "Suspended · refused in a risk review" : "Suspended · inactive for over 30 days",
      description: user.breached
        ? "Payouts were lost after the review. The user can’t buy new challenges until the team lifts the suspension."
        : "No login or trade in 30 days. The account comes back on the next login after the team reactivates it.",
      action: action("Reactivate"),
    }
  } else if (user.status === "kyc_pending" || user.verification !== "verified") {
    const steps = KYC_STEPS(user.verification)
    const missing = steps.filter((s) => !s.done).length
    props = {
      icon: warnIcon,
      title:
        user.verification === "pending"
          ? `Registration incomplete · ${missing} KYC items missing`
          : `Registration incomplete · KYC not started`,
      description: (
        <>
          {user.verification === "pending"
            ? "Documents are waiting for review. Payouts stay locked until KYC is approved."
            : "The user can trade, but can’t request a payout until their identity is verified."}
          <Checklist steps={steps} />
        </>
      ),
      action: user.verification === "pending" ? action("Review KYC") : action("Send KYC reminder"),
    }
  }

  if (!props) return null
  return (
    <Alert
      data-status-notice
      className="max-lg:flex-wrap max-lg:[&>div:last-child]:basis-full max-lg:[&>div:last-child]:pl-9"
      {...props}
    />
  )
}
