"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowLeft, Close } from "@carbon/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/iq/ui/button"

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** "close" = X (closes the sheet); "back" = arrow (returns to the parent sheet). */
  leading?: "close" | "back"
  onBack?: () => void
  /** Ghost action on the right of the header (Clear all, Reset, Clear). */
  action?: { label: string; onClick: () => void; disabled?: boolean }
  /** Sheet Footer: usually one full-width Primary button. */
  footer?: React.ReactNode
  /** Tall sheets (Filters) keep 64px of the page visible; short ones (Sort) hug their content. */
  tall?: boolean
  children: React.ReactNode
}

/** Mobile Bottom sheet from the Figma (Sheet Header with handle · scrolling body · Sheet Footer). */
export function BottomSheet({ open, onOpenChange, title, leading = "close", onBack, action, footer, tall, children }: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-[overlay-out_200ms_ease-in_forwards] data-[state=open]:animate-[overlay-in_240ms_ease-out]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-slot="bottom-sheet"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-64px)] flex-col rounded-t-lg border border-b-0 border-(--tray-border) bg-(--tray-surface) shadow-(--shadow-drawer) outline-none",
            "data-[state=closed]:animate-[sheet-out_200ms_ease-in_forwards] data-[state=open]:animate-[sheet-in_320ms_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none",
            tall && "h-[calc(100dvh-64px)]"
          )}
        >
          <div className="shrink-0 border-b border-(--border-divider)">
            <div className="flex justify-center pt-2 pb-1">
              <span aria-hidden="true" className="h-1 w-9 rounded-[2px] bg-white/16" />
            </div>
            <div className="flex h-14 items-center gap-2 pr-2 pl-2">
              {leading === "back" ? (
                <Button variant="ghost" size="icon-sm" aria-label="Back" onClick={onBack}>
                  <ArrowLeft />
                </Button>
              ) : (
                <DialogPrimitive.Close asChild>
                  <Button type="button" variant="secondary" size="icon-sm" aria-label="Close" className="border-white/16 bg-transparent">
                    <Close />
                  </Button>
                </DialogPrimitive.Close>
              )}
              <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-base leading-6 font-medium text-(color:--content-default)">{title}</DialogPrimitive.Title>
              {action && (
                <Button variant="ghost" size="sm" onClick={action.onClick} disabled={action.disabled}>
                  {action.label}
                </Button>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="shrink-0 border-t border-(--border-divider) px-4 pt-3 pb-6">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
