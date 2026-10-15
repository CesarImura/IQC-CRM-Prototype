"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Checkmark, Close } from "@carbon/icons-react"

import { ACCOUNT_FAMILIES, PLATFORM_MARKS } from "@/lib/users/account-families"
import type { User } from "@/lib/users/data"
import { tradingAccounts } from "@/lib/users/profile"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/iq/ui/button"
import { CheckboxMark } from "@/registry/iq/ui/checkbox"
import { CurrencyField, TextField } from "@/registry/iq/ui/form-field"
import { Modal, ModalContent } from "@/registry/iq/ui/modal"
import { PartnerMark, type Partner } from "@/registry/iq/ui/partner-logo"
import { DateField, SelectField } from "@/registry/iq/ui/select-field"
import { Tabs, TabsPillList, TabsPillTrigger } from "@/registry/iq/ui/tabs"
import { toast } from "@/registry/iq/ui/toast"
import { Switch } from "@/registry/iq/ui/toggle"

// Figma: Platform file › Users - New trading account (2365:93147): 1200 × 920 modal, step rail on the left
// (Account · Rules · Schedule & access), the form on the right, footer with Back / Cancel / Continue.
// Families, limits and platforms follow the product rules (lib/users/account-families.ts).

const STEPS = [
  { title: "Account", description: "Owner, name and lineage" },
  { title: "Rules", description: "Family, provider and balances" },
  { title: "Schedule & access", description: "Activation, duration, platforms" },
]

type Form = {
  idFormat: string
  description: string
  reference: string
  lineage: string
  linkedAccount: string
  family: string
  customize: boolean
  limits: Record<string, string>
  balances: Record<"start" | "current" | "max", { on: boolean; value: number | null }>
  activation: string
  startDate: Date | null
  durationType: "units" | "end"
  unit: string
  units: string
  endDate: Date | null
  partner: string
  platforms: string[]
}

const initialForm = (): Form => ({
  idFormat: "global",
  description: "",
  reference: "",
  lineage: "none",
  linkedAccount: "",
  family: "",
  customize: false,
  limits: {},
  balances: { start: { on: false, value: null }, current: { on: false, value: null }, max: { on: false, value: null } },
  activation: "now",
  startDate: null,
  durationType: "units",
  unit: "day",
  units: "30",
  endDate: null,
  partner: "none",
  platforms: [],
})

export function NewAccountWizard({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" className="w-[min(1200px,calc(100vw-32px))] max-w-none overflow-hidden p-0">
        {open && <Wizard user={user} onDone={() => onOpenChange(false)} />}
      </ModalContent>
    </Modal>
  )
}

function Wizard({ user, onDone }: { user: User; onDone: () => void }) {
  const [step, setStep] = React.useState(0)
  const [reached, setReached] = React.useState(0)
  const [form, setForm] = React.useState<Form>(initialForm)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  const fam = ACCOUNT_FAMILIES.find((f) => f.value === form.family)

  const valid = [
    form.idFormat && (form.lineage === "none" || form.linkedAccount),
    Boolean(fam),
    (form.activation !== "schedule" || form.startDate) && (form.durationType === "units" ? Number(form.units) > 0 : form.endDate) && form.platforms.length > 0,
  ]
  const preview = fam
    ? `${fam.prefix}${fam.size / 1000}K-${form.idFormat === "global" ? "7713902" : `${user.username.toUpperCase()}-07`}`
    : form.idFormat === "global"
      ? "IQCFEV50K-7713902"
      : `IQCFEV50K-${user.username.toUpperCase()}-07`

  function goTo(next: number) {
    setStep(next)
    setReached((r) => Math.max(r, next))
  }
  function pickFamily(value: string) {
    const f = ACCOUNT_FAMILIES.find((x) => x.value === value)
    setForm((s) => ({
      ...s,
      family: value,
      limits: Object.fromEntries((f?.limits ?? []).map((l) => [l.label, l.value])),
      units: f?.duration ? String(f.duration) : s.units,
      platforms: s.platforms.filter((p) => f?.platforms.includes(p)),
    }))
  }
  function create() {
    toast.success("Account created", {
      description: `${preview} · ${fam?.label} for ${user.name}`,
      action: { label: "View account", onClick: () => toast.info("The account page isn’t in this prototype yet") },
    })
    onDone()
  }

  return (
    <form
      className="grid h-[min(920px,calc(100dvh-32px))] grid-cols-[360px_minmax(0,1fr)]"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid[step]) return
        if (step < 2) goTo(step + 1)
        else create()
      }}
    >
      {/* Step rail */}
      <aside className="flex flex-col border-r border-(--border-divider) bg-(--surface-raised) px-8 pt-8">
        <Dialog.Title className="text-xl leading-[1.3] font-semibold text-(color:--content-default)">New trading account</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-(color:--content-tertiary)">
          For {user.name} · entity {user.id.slice(0, 8)}…
        </Dialog.Description>
        <p className="mt-8 text-xs font-medium text-(color:--content-tertiary)">Step {step + 1} of 3</p>
        <ol className="mt-4 flex flex-col">
          {STEPS.map((s, i) => {
            const done = i < step || (i <= reached && i !== step && valid[i])
            const current = i === step
            const clickable = i <= reached && !current
            return (
              <li key={s.title}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => goTo(i)}
                  className={cn(
                    "group flex w-full items-start gap-4 rounded-[4px] px-3 py-3 text-left outline-none",
                    clickable && "cursor-pointer hover:bg-(--surface-hover)",
                    current && "bg-(--surface-hover)"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      current && "border-(--accent) text-(color:--accent)",
                      done && !current && "border-(--accent) bg-(--accent) text-(color:--content-on-accent)",
                      !current && !done && "border-(--border-strong) text-(color:--content-tertiary)"
                    )}
                  >
                    {done && !current ? <Checkmark size={14} /> : i + 1}
                  </span>
                  <span className="flex flex-col">
                    <span className={cn("text-sm", current ? "font-semibold text-(color:--content-default)" : "font-medium text-(color:--content-secondary)")}>{s.title}</span>
                    <span className="text-xs text-(color:--content-tertiary)">{done && !current ? "Done · review" : s.description}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* Form */}
      <section className="flex min-h-0 flex-col">
        <div className="flex items-start justify-between px-9 pt-8">
          <h2 className="text-[26px] leading-[1.3] font-semibold text-(color:--content-default)">{STEPS[step].title === "Account" ? "Account details" : STEPS[step].title}</h2>
          <Dialog.Close asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Close">
              <Close />
            </Button>
          </Dialog.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-9 pt-10 pb-8">
          {step === 0 && <StepAccount user={user} form={form} set={set} preview={preview} />}
          {step === 1 && <StepRules form={form} set={set} pickFamily={pickFamily} />}
          {step === 2 && <StepSchedule form={form} set={set} />}
        </div>
        <footer className="flex items-center gap-2 border-t border-(--border-divider) px-9 py-5">
          {step > 0 && (
            <Button type="button" variant="ghost" size="md" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" size="md" disabled={!valid[step]}>
              {step < 2 ? "Continue" : "Save and create account"}
            </Button>
          </div>
        </footer>
      </section>
    </form>
  )
}

type StepProps = { form: Form; set: <K extends keyof Form>(key: K, value: Form[K]) => void }

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 [&:not(:first-child)]:mt-10">
      <legend className="contents">
        <span className="text-base font-semibold text-(color:--content-default)">{title}</span>
      </legend>
      {description && <p className="-mt-2 text-[13px] text-(color:--content-tertiary)">{description}</p>}
      {children}
    </fieldset>
  )
}

const Row = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-2 gap-x-6 gap-y-5">{children}</div>

function StepAccount({ user, form, set, preview }: StepProps & { user: User; preview: string }) {
  const accounts = tradingAccounts.map((a) => ({ value: a.id, label: `${a.id} · ${a.title}` }))
  return (
    <>
      <Group title="Identification">
        <Row>
          <SelectField
            label="Account ID format"
            required
            helper={`Preview: ${preview}`}
            options={[
              { value: "global", label: "Prefix with global count" },
              { value: "user", label: "Prefix with user account count" },
            ]}
            value={form.idFormat}
            onValueChange={(v) => set("idFormat", v)}
          />
          <TextField label="Description" placeholder="Add a short description" value={form.description} onChange={(e) => set("description", e.target.value)} />
          <TextField label="IQ Entity Id" required readOnly value={user.id.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5")} helper={`${user.name} · filled from the user profile`} />
          <TextField label="IQ Reference Id" placeholder="Enter reference id" value={form.reference} onChange={(e) => set("reference", e.target.value)} />
        </Row>
      </Group>
      <Group title="Account lineage" description="One account can continue another or replace it. Pick the relation, then point to the account.">
        <Row>
          <SelectField
            label="Lineage"
            helper="None · Continues a previous account · Resets another account"
            options={[
              { value: "none", label: "None" },
              { value: "continues", label: "Continues a previous account" },
              { value: "resets", label: "Resets another account" },
            ]}
            value={form.lineage}
            onValueChange={(v) => {
              set("lineage", v)
              if (v === "none") set("linkedAccount", "")
            }}
          />
          {form.lineage !== "none" && (
            <SelectField
              label={form.lineage === "resets" ? "Account to reset" : "Previous account"}
              required
              placeholder="Choose an account"
              helper={form.lineage === "resets" ? "Closed as Reset the moment this account is created" : "Balance and history carry over to the new account"}
              options={accounts}
              value={form.linkedAccount || null}
              onValueChange={(v) => set("linkedAccount", v)}
            />
          )}
        </Row>
      </Group>
    </>
  )
}

function StepRules({ form, set, pickFamily }: StepProps & { pickFamily: (v: string) => void }) {
  const fam = ACCOUNT_FAMILIES.find((f) => f.value === form.family)
  const balanceLabels = { start: "Custom start balance", current: "Custom balance", max: "Custom max balance" } as const
  return (
    <>
      <Group title="Rule set" description="Pick the account family. Provider, trading rule and trader alerts come with it — you can still customize the limits.">
        <div className="max-w-[calc(50%-12px)]">
          <SelectField
            label="Account family"
            required
            placeholder="Choose a family"
            helper="Families group the products sold on the site: Core, Core-DLL, Rapid and Instant Funding, per market."
            search
            options={ACCOUNT_FAMILIES.map((f) => ({ value: f.value, label: f.label }))}
            value={form.family || null}
            onValueChange={pickFamily}
          />
        </div>
        {fam && (
          <div className="rounded-[4px] border border-(--border-divider) bg-(--surface-raised)">
            <div className="flex items-center justify-between gap-4 border-b border-(--border-grid) px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-(color:--content-default)">Included in {fam.label}</p>
                <p className="text-xs text-(color:--content-tertiary)">Applied automatically when the account is created.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => set("customize", !form.customize)}>
                {form.customize ? "Use family limits" : "Customize"}
              </Button>
            </div>
            <dl className="grid grid-cols-[140px_minmax(0,1fr)] gap-x-4 px-4 [&>*]:border-b [&>*]:border-(--border-grid) [&>*]:py-3 [&>:nth-last-child(-n+2)]:border-b-0">
              <dt className="text-xs text-(color:--content-tertiary)">Provider</dt>
              <dd>
                <p className="text-[13px] font-medium text-(color:--content-default)">{fam.provider.name}</p>
                <p className="text-xs text-(color:--content-tertiary)">{fam.provider.note}</p>
              </dd>
              <dt className="text-xs text-(color:--content-tertiary)">Trading rule</dt>
              <dd className="flex flex-col gap-2">
                <p className="text-[13px] font-medium text-(color:--content-default)">{fam.rule}</p>
                {form.customize ? (
                  <div className="grid grid-cols-3 gap-3">
                    {fam.limits.map((l) => (
                      <TextField
                        key={l.label}
                        label={l.label}
                        value={form.limits[l.label] ?? l.value}
                        onChange={(e) => set("limits", { ...form.limits, [l.label]: e.target.value })}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {fam.limits.map((l) => (
                      <span key={l.label} className="text-sm font-medium text-(color:--content-secondary)">
                        {l.label} <span className="text-(color:--content-default)">{form.limits[l.label] ?? l.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </dd>
              <dt className="text-xs text-(color:--content-tertiary)">Trader alerts</dt>
              <dd>
                <p className="text-[13px] font-medium text-(color:--content-default)">Default alerts · email and in-app</p>
                <p className="text-xs text-(color:--content-tertiary)">Defined by the notification rule applied to this account.</p>
              </dd>
            </dl>
          </div>
        )}
      </Group>
      <Group title="Balances" description="Leave a switch off to use the amount from the account family.">
        <div className="grid grid-cols-3 gap-6">
          {(Object.keys(balanceLabels) as (keyof typeof balanceLabels)[]).map((key) => {
            const b = form.balances[key]
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-(color:--content-secondary)">
                  <Switch checked={b.on} onCheckedChange={(on) => set("balances", { ...form.balances, [key]: { ...b, on, value: on ? (b.value ?? fam?.size ?? null) : b.value } })} />
                  {balanceLabels[key]}
                </label>
                {b.on ? (
                  <CurrencyField label={balanceLabels[key]} value={b.value} onValueChange={(v) => set("balances", { ...form.balances, [key]: { ...b, value: v } })} />
                ) : (
                  <TextField label={balanceLabels[key]} readOnly value={fam ? `From ${fam.rule.split(" · ")[0]}` : "From the family"} />
                )}
              </div>
            )
          })}
        </div>
      </Group>
    </>
  )
}

function StepSchedule({ form, set }: StepProps) {
  const fam = ACCOUNT_FAMILIES.find((f) => f.value === form.family)
  const platforms = fam?.platforms ?? []
  return (
    <>
      <Group title="Activation" description="When the account starts trading. The date only applies when scheduling.">
        <Row>
          <SelectField
            label="Activation"
            required
            helper="Enable now · Schedule · Create disabled"
            options={[
              { value: "now", label: "Enable now" },
              { value: "schedule", label: "Schedule" },
              { value: "disabled", label: "Create disabled" },
            ]}
            value={form.activation}
            onValueChange={(v) => set("activation", v)}
          />
          {form.activation === "schedule" && <DateField label="Start date" required value={form.startDate} onValueChange={(d) => set("startDate", d)} />}
        </Row>
      </Group>
      <Group title="Duration" description="Either a number of units or a fixed end date — never both. The other input disappears.">
        <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-(color:--content-default)">Duration type</span>
            <Tabs value={form.durationType} onValueChange={(v) => set("durationType", v as Form["durationType"])}>
              <TabsPillList size="sm" aria-label="Duration type">
                <TabsPillTrigger value="units">Units</TabsPillTrigger>
                <TabsPillTrigger value="end">End date</TabsPillTrigger>
              </TabsPillList>
            </Tabs>
          </div>
          {form.durationType === "units" ? (
            <>
              <SelectField
                label="Unit"
                options={[
                  { value: "day", label: "Day" },
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                ]}
                value={form.unit}
                onValueChange={(v) => set("unit", v)}
              />
              <TextField label="Number of units" inputMode="numeric" value={form.units} onChange={(e) => set("units", e.target.value.replace(/\D/g, ""))} />
            </>
          ) : (
            <DateField label="End date" required value={form.endDate} onValueChange={(d) => set("endDate", d)} />
          )}
        </div>
      </Group>
      <Group title="Partner & platforms" description="Commercial attribution and where the trader is allowed to connect.">
        <div className="max-w-[calc(50%-12px)]">
          <SelectField
            label="Partner"
            options={[{ value: "none", label: "None" }, ...["partner@alpha.io", "fx.guru@mail.com", "asia@mail.com"].map((p) => ({ value: p, label: p }))]}
            value={form.partner}
            onValueChange={(v) => set("partner", v)}
          />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-(color:--content-default)">
            Trading platforms <span className="ml-2 text-xs font-normal text-(color:--content-tertiary)">{form.platforms.length} of {platforms.length} selected</span>
          </p>
          {platforms.length === 0 ? (
            <p className="text-[13px] text-(color:--content-tertiary)">Pick an account family first: the platforms depend on its market.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const checked = form.platforms.includes(p)
                // Tradovate only takes accounts with a daily loss limit (Core-DLL, Instant Funding).
                const blocked = p === "Tradovate" && !!fam && !fam.limits.some((l) => l.label === "Daily loss limit")
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={blocked}
                    title={blocked ? "Tradovate only accepts accounts with a daily loss limit" : undefined}
                    onClick={() => set("platforms", checked ? form.platforms.filter((x) => x !== p) : [...form.platforms, p])}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-[2px] border px-3 py-2 text-[13px] font-medium outline-none",
                      checked ? "border-(--accent) bg-(--surface-accent) text-(color:--content-default)" : "border-(--border-divider) text-(color:--content-secondary) hover:border-(--border-strong)",
                      blocked && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <CheckboxMark checked={checked} />
                    <PartnerMark partner={PLATFORM_MARKS[p] as Partner} size={18} />
                    {p}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Group>
    </>
  )
}
