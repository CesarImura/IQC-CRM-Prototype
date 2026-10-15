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
