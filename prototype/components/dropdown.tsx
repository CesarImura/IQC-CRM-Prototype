"use client"

import * as React from "react"
import * as Popover from "@radix-ui/react-popover"

import { Button } from "@/registry/iq/ui/button"
import { Dropdown as DsDropdown, type DropdownProps } from "@/registry/iq/ui/combobox"
import { OptionItem, OptionPanel, OptionPanelList } from "@/registry/iq/ui/option-panel"
import { TriggerContent, triggerClasses } from "@/registry/iq/ui/trigger"

/** DS Dropdown whose panel hugs its options (min width in globals.css) instead of the fixed 303px. */
export function Dropdown(props: DropdownProps) {
  return <DsDropdown panelWidth="max-content" {...props} />
}

export type ActionItem = { value: string; label: string; icon?: React.ReactNode; tone?: "neutral" | "warning" | "danger" }

/**
 * Action menu: Dropdown trigger (text or icon-only) and an Option Panel with icons. `sections` are split by a divider;
 * `columns` lays the sections side by side with a vertical divider (Figma: Actions · panel of the User Profile).
 */
export function ActionMenu({
  label,
  iconOnly,
  sections,
  columns = false,
  align = "end",
  onSelect,
}: {
  label: string
  iconOnly?: React.ReactNode
  sections: ActionItem[][]
  columns?: boolean
  align?: "start" | "end"
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger type="button" aria-label={iconOnly ? label : undefined} data-open={open} className={triggerClasses("sm", false, Boolean(iconOnly))}>
        {iconOnly ? <span className="flex text-(color:--content-default)">{iconOnly}</span> : <TriggerContent placeholder={label} open={open} />}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align={align} sideOffset={8} className="z-50 outline-none" onClick={(e) => e.stopPropagation()}>
          <OptionPanel aria-label={label} className="w-max">
            <OptionPanelList className="max-h-none">
              <div className={columns ? "flex" : "flex flex-col"}>
                {sections.map((items, i) => (
                  <div
                    key={i}
                    className={
                      columns
                        ? "flex min-w-[208px] flex-col gap-(--option-item-gap) [&:not(:first-child)]:ml-(--option-panel-padding) [&:not(:first-child)]:border-l [&:not(:first-child)]:border-(--option-panel-border) [&:not(:first-child)]:pl-(--option-panel-padding)"
                        : "flex flex-col gap-(--option-item-gap) [&:not(:first-child)]:mt-(--option-panel-padding) [&:not(:first-child)]:border-t [&:not(:first-child)]:border-(--option-panel-border) [&:not(:first-child)]:pt-(--option-panel-padding)"
                    }
                  >
                    {items.map((item) => (
                      <OptionItem
                        key={item.value}
                        value={item.value}
                        label={item.label}
                        icon={item.icon}
                        tone={item.tone}
                        onSelect={() => {
                          setOpen(false)
                          onSelect(item.value)
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </OptionPanelList>
          </OptionPanel>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export type ExportOption = { value: string; label: string }

/** Export: a Dropdown-looking trigger, checkbox options and a primary Export button (Figma: Export · panel). */
export function ExportMenu({
  options,
  defaultValue = [options[0]?.value],
  onExport,
  align = "end",
}: {
  options: ExportOption[]
  defaultValue?: string[]
  onExport: (values: string[]) => void
  align?: "start" | "end"
}) {
  const [open, setOpen] = React.useState(false)
  const [picked, setPicked] = React.useState<string[]>(defaultValue)
  const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger type="button" data-open={open} className={triggerClasses("sm", false)}>
        <TriggerContent placeholder="Export" open={open} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align={align} sideOffset={8} className="z-50 outline-none">
          <OptionPanel className="w-max min-w-[220px]" aria-label="Export options">
            <OptionPanelList>
              {options.map((o) => (
                <OptionItem key={o.value} value={o.value} label={o.label} selection="checkbox" checked={picked.includes(o.value)} onSelect={() => toggle(o.value)} />
              ))}
            </OptionPanelList>
            <div className="-mx-(--option-panel-padding) border-t border-(--option-panel-border) px-(--option-panel-padding) pt-(--option-panel-padding)">
              <Button
                size="sm"
                className="w-full"
                disabled={picked.length === 0}
                onClick={() => {
                  onExport(options.map((o) => o.value).filter((v) => picked.includes(v)))
                  setOpen(false)
                }}
              >
                Export
              </Button>
            </div>
          </OptionPanel>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
