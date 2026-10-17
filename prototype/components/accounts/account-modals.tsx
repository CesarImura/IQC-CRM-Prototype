"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/data"
import { Button } from "@/registry/iq/ui/button"
import { Select } from "@/registry/iq/ui/combobox"
import { TextField } from "@/registry/iq/ui/form-field"
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from "@/registry/iq/ui/modal"

// Figma overlays (Overlay · Extend expiry / Reset account / Change rule limits / Disable account / Enable account /
// Extend renewal). Fees from the Product rules: extension 19 $ (futures) or 5 $ (crypto) per 7 days, reset 49/79 $.

export type AccountModal = "extend" | "renewal" | "reset" | "limits" | "disable" | "enable" | null

const money = (v: number) => `${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
const DISABLE_REASONS = ["Hedging across accounts", "Copy trading", "Account sharing", "Multi-account", "Third-party EA", "Promo code abuse", "Chargeback", "Requested by user"].map((r) => ({ value: r, label: r }))

type Props = {
  account: Account
  open: AccountModal
  onOpenChange: (open: AccountModal) => void
  onExtend: (days: number, cost: number) => void
  onReset: () => void
  onLimits: (limits: { drawdown: number; target: number | null }) => void
  onDisable: (reason: string, note: string) => void
  onEnable: () => void
}

export function AccountModals({ account: a, open, onOpenChange, onExtend, onReset, onLimits, onDisable, onEnable }: Props) {
  const close = (o: boolean) => !o && onOpenChange(null)
  return (
    <>
      <Modal open={open === "extend" || open === "renewal"} onOpenChange={close}>
        <ModalContent size="sm">{(open === "extend" || open === "renewal") && <ExtendForm a={a} renewal={open === "renewal"} onConfirm={onExtend} />}</ModalContent>
      </Modal>
      <Modal open={open === "reset"} onOpenChange={close}>
        <ModalContent size="sm">
          <ModalHeader
            title={`Reset ${a.id}?`}
            description={`Balance goes back to ${money(a.start)}; rules, strikes and stats start over. The time does not reset${a.expires ? "" : ""}. Fee ${a.size === 50 ? "49.00" : "79.00"} $, charged to the trader.`}
          />
          <ModalFooter layout="double">
            <ModalClose asChild>
              <Button variant="secondary">Cancel</Button>
            </ModalClose>
            <Button onClick={onReset}>Reset account</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal open={open === "limits"} onOpenChange={close}>
        <ModalContent size="md">{open === "limits" && <LimitsForm a={a} onSave={onLimits} />}</ModalContent>
      </Modal>
      <Modal open={open === "disable"} onOpenChange={close}>
        <ModalContent size="sm">{open === "disable" && <DisableForm a={a} onConfirm={onDisable} />}</ModalContent>
      </Modal>
      <Modal open={open === "enable"} onOpenChange={close}>
        <ModalContent size="sm">
          <ModalHeader title={`Enable ${a.id}?`} description={`The trader can log in and trade again. ${a.reason ? `It was disabled for “${a.reason.title}”.` : ""} The action is logged with your name.`} />
          <ModalFooter layout="double">
            <ModalClose asChild>
              <Button variant="secondary">Cancel</Button>
            </ModalClose>
            <Button onClick={onEnable}>Enable account</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

function ExtendForm({ a, renewal, onConfirm }: { a: Account; renewal: boolean; onConfirm: (days: number, cost: number) => void }) {
  const [days, setDays] = React.useState("7")
  const unit = a.market === "crypto" ? 5 : 19
  const cost = renewal ? 0 : (Number(days) / 7) * unit
  return (
    <>
      <ModalHeader
        title={renewal ? "Extend renewal" : "Extend expiry"}
        description={renewal ? "Moves the next renewal date. No charge to the trader." : `Each 7 days costs ${money(unit)} (${a.market === "crypto" ? "crypto" : "futures"}). The trader is charged on confirm.`}
      />
      <ModalBody className="flex flex-col gap-4">
        <Select
          label="Extend by"
          search={false}
          options={[
            { value: "7", label: "7 days" },
            { value: "14", label: "14 days" },
            { value: "30", label: "30 days" },
          ]}
          value={days}
          onValueChange={setDays}
        />
        {!renewal && <p className="text-sm text-(color:--content-muted)">Total {money(cost)}</p>}
      </ModalBody>
      <ModalFooter layout="double">
        <ModalClose asChild>
          <Button variant="secondary">Cancel</Button>
        </ModalClose>
        <Button onClick={() => onConfirm(Number(days), cost)}>{renewal ? "Extend renewal" : `Extend · ${money(cost)}`}</Button>
      </ModalFooter>
    </>
  )
}

function LimitsForm({ a, onSave }: { a: Account; onSave: (l: { drawdown: number; target: number | null }) => void }) {
  const [dd, setDd] = React.useState(String(a.drawdown.limit))
  const [target, setTarget] = React.useState(String(a.profit?.target ?? ""))
  const [note, setNote] = React.useState("")
  const ddOk = Number(dd) > 0
  return (
    <>
      <ModalHeader title="Change rule limits" description="Overrides the plan limits for this account only. Every change is logged with your name and the note." />
      <ModalBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <TextField label="Maximum drawdown ($)" inputMode="numeric" value={dd} onChange={(e) => setDd(e.target.value.replace(/[^\d]/g, ""))} status={ddOk ? undefined : "error"} helper={ddOk ? `Plan: ${money(a.drawdown.limit)}` : "Enter an amount"} />
          {a.profit && <TextField label="Profit target ($)" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))} helper={`Plan: ${money(a.profit.target)}`} />}
        </div>
        <TextField label="Note" placeholder="Why the change (shown in Risk logs)" value={note} onChange={(e) => setNote(e.target.value)} />
      </ModalBody>
      <ModalFooter layout="double">
        <ModalClose asChild>
          <Button variant="secondary">Cancel</Button>
        </ModalClose>
        <Button disabled={!ddOk} onClick={() => onSave({ drawdown: Number(dd), target: a.profit ? Number(target) || a.profit.target : null })}>
          Save limits
        </Button>
      </ModalFooter>
    </>
  )
}

function DisableForm({ a, onConfirm }: { a: Account; onConfirm: (reason: string, note: string) => void }) {
  const [reason, setReason] = React.useState(DISABLE_REASONS[0].value)
  const [note, setNote] = React.useState("")
  return (
    <>
      <ModalHeader title={`Disable ${a.id}?`} description="Open positions are closed and the trader can’t log in to this account. You can enable it again later." />
      <ModalBody className="flex flex-col gap-4">
        <Select label="Reason" search={false} options={DISABLE_REASONS} value={reason} onValueChange={setReason} />
        <TextField label="Detail" placeholder="e.g. Short NQ on another account" value={note} onChange={(e) => setNote(e.target.value)} />
      </ModalBody>
      <ModalFooter layout="double">
        <ModalClose asChild>
          <Button variant="secondary">Cancel</Button>
        </ModalClose>
        <Button variant="danger" onClick={() => onConfirm(reason, note)}>
          Disable account
        </Button>
      </ModalFooter>
    </>
  )
}
