"use client"

import * as React from "react"
import { Edit, OverflowMenuVertical, Pin, PinFilled, TrashCan } from "@carbon/icons-react"

import { ActionMenu } from "@/components/dropdown"
import { cn } from "@/lib/utils"
import { Badge } from "@/registry/iq/ui/badge"
import { Button } from "@/registry/iq/ui/button"
import { TextareaField, TextField } from "@/registry/iq/ui/form-field"
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from "@/registry/iq/ui/modal"
import { toast } from "@/registry/iq/ui/toast"
import { Card, Section } from "./shared"

/* Admin notes (Figma 4252:2 · proposal): the team's internal notebook about the trader, never shown to them.
   Each note: short title, one sentence with the fact and the decision, author · date. Pinned first, then newest.
   Add note in the section header opens a modal (author and time fill in by themselves). ⋮ on each note: Edit, Pin,
   Delete. The list has a fixed height (about 3 notes) and scrolls inside the card with a thin scrollbar; every create,
   edit, pin or delete is logged in the account history. */

type Note = { id: string; title: string; body: string; author: string; at: number; pinned: boolean; edited?: boolean }

const ME = "Davi Klinsmann"
const NOW = Date.UTC(2026, 9, 14, 15, 20)
const at = (d: number, m: number, h: number, min: number) => Date.UTC(2026, m - 1, d, h, min)
const SEED: Note[] = [
  { id: "n1", title: "Rule check", body: "Trader asked if Core has a daily loss limit. Explained it uses max position loss with 3 strikes instead.", author: "Julian", at: at(22, 9, 9, 40), pinned: true },
  { id: "n2", title: "Close call on MNQ", body: "MNQ short closed at −980.00 $, 98% of the limit. Sent the max position loss article; no action needed.", author: "Paula Mendes", at: at(30, 9, 16, 5), pinned: false },
  { id: "n3", title: "Platform switch", body: "Login reissued for ATAS at the trader request. Quantower session closed and logged.", author: "Ana Souza", at: at(18, 9, 14, 12), pinned: false },
  { id: "n4", title: "Extension asked", body: "Asked for 5 more days on the challenge after the platform outage on 16 Sep. Approved once, as per policy.", author: "Julian", at: at(17, 9, 11, 30), pinned: false },
  { id: "n5", title: "Payout review", body: "Second payout held 24 h for the consistency check. Cleared by Risk; paid 21 Aug.", author: "Marcus Lee", at: at(20, 8, 10, 2), pinned: false },
  { id: "n6", title: "KYC document", body: "Proof of address was a bank screenshot. Asked for a utility bill; accepted the next day.", author: "Ana Souza", at: at(3, 2, 17, 45), pinned: false },
]

const stamp = (t: number) => {
  const d = new Date(t)
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace("Sept", "Sep")
  return `${date}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}
const order = (list: Note[]) => [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at - a.at)

export function AdminNotes() {
  const [notes, setNotes] = React.useState<Note[]>(() => order(SEED))
  const [editing, setEditing] = React.useState<Note | "new" | null>(null)
  const [fresh, setFresh] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const nextId = React.useRef(1)
  // A note that was just added, edited or pinned glows for a moment, then settles.
  React.useEffect(() => {
    if (!fresh) return
    const t = window.setTimeout(() => setFresh(null), 1400)
    return () => window.clearTimeout(t)
  }, [fresh])

  const save = (draft: { title: string; body: string }) => {
    if (editing === "new") {
      const note: Note = { id: `new-${nextId.current++}`, ...draft, author: ME, at: NOW, pinned: false }
      setNotes((list) => order([note, ...list]))
      setFresh(note.id)
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      toast.success("Note added", { description: "Logged in the account history." })
    } else if (editing) {
      setNotes((list) => order(list.map((n) => (n.id === editing.id ? { ...n, ...draft, edited: true } : n))))
      setFresh(editing.id)
      toast.success("Note updated", { description: "The previous version stays in the account history." })
    }
    setEditing(null)
  }

  const act = (note: Note, action: string) => {
    if (action === "edit") setEditing(note)
    if (action === "pin") {
      setNotes((list) => order(list.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))))
      setFresh(note.id)
      if (!note.pinned) listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      toast.success(note.pinned ? "Note unpinned" : "Note pinned to the top")
    }
    if (action === "delete") {
      const previous = notes
      setNotes((list) => list.filter((n) => n.id !== note.id))
      toast.success("Note deleted", { description: "Logged in the account history.", action: { label: "Undo", onClick: () => setNotes(previous) } })
    }
  }

  return (
    <Section
      title="Admin notes"
      info="Internal notes about this trader. Only the team sees them; every change is logged in the account history."
      actions={
        <Button variant="secondary" size="sm" onClick={() => setEditing("new")}>
          Add note
        </Button>
      }
    >
      <Card className="overflow-hidden">
        <div ref={listRef} className="thin-scroll max-h-[372px] overflow-y-auto overscroll-contain">
          {notes.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-(color:--content-tertiary)">No notes yet. Add the first one from the header.</p>
          ) : (
            notes.map((note, i) => (
              <article
                key={note.id}
                className={cn(
                  "group/note flex gap-4 border-b border-(--border-grid) px-6 py-5 transition-colors duration-500 last:border-b-0 hover:bg-white/[0.02] [animation:note-in_460ms_cubic-bezier(0.16,1,0.3,1)_both]",
                  fresh === note.id && "bg-(--accent)/[0.06] hover:bg-(--accent)/[0.06]"
                )}
                style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-sm font-medium text-(color:--content-default)">
                    {note.title}
                    {note.pinned && (
                      <Badge color="gray" size="sm">
                        Pinned
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm leading-[21px] text-(color:--content-secondary)">{note.body}</p>
                  <p className="text-xs text-(color:--content-tertiary)">
                    {note.author} · {stamp(note.at)}
                    {note.edited ? " · edited" : ""}
                  </p>
                </div>
                <div className="shrink-0">
                  <ActionMenu
                    label={`Actions for note ${note.title}`}
                    iconOnly={<OverflowMenuVertical />}
                    sections={[
                      [
                        { value: "edit", label: "Edit", icon: <Edit /> },
                        { value: "pin", label: note.pinned ? "Unpin" : "Pin to top", icon: note.pinned ? <PinFilled /> : <Pin /> },
                      ],
                      [{ value: "delete", label: "Delete", icon: <TrashCan />, tone: "danger" }],
                    ]}
                    onSelect={(v) => act(note, v)}
                  />
                </div>
              </article>
            ))
          )}
        </div>
        <p className="border-t border-(--border-divider) px-6 py-3 text-xs text-(color:--content-tertiary)">
          {notes.length} {notes.length === 1 ? "note" : "notes"} · only the team sees them
        </p>
      </Card>
      <NoteModal note={editing} onOpenChange={(open) => !open && setEditing(null)} onSave={save} />
    </Section>
  )
}

function NoteModal({ note, onOpenChange, onSave }: { note: Note | "new" | null; onOpenChange: (open: boolean) => void; onSave: (d: { title: string; body: string }) => void }) {
  return (
    <Modal open={note !== null} onOpenChange={onOpenChange}>
      <ModalContent size="md">{note !== null && <NoteForm note={note === "new" ? null : note} onSave={onSave} />}</ModalContent>
    </Modal>
  )
}

function NoteForm({ note, onSave }: { note: Note | null; onSave: (d: { title: string; body: string }) => void }) {
  const [title, setTitle] = React.useState(note?.title ?? "")
  const [body, setBody] = React.useState(note?.body ?? "")
  const [submitted, setSubmitted] = React.useState(false)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (title.trim() && body.trim()) onSave({ title: title.trim(), body: body.trim() })
  }
  return (
    <form onSubmit={submit} noValidate className="contents">
      <ModalHeader
        title={note ? "Edit note" : "Add note"}
        description={note ? "The previous version stays in the account history." : `Only the team sees it. Signed as ${ME}, ${stamp(NOW)}.`}
      />
      <ModalBody className="flex flex-col gap-4">
        <TextField
          label="Title"
          required
          autoFocus
          maxLength={40}
          placeholder="e.g. Payout review"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          status={submitted && !title.trim() ? "error" : undefined}
          helper={submitted && !title.trim() ? "Give the note a short title" : undefined}
        />
        <TextareaField
          label="Note"
          required
          rows={4}
          placeholder="What happened and what was decided"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          status={submitted && !body.trim() ? "error" : undefined}
          helper={submitted && !body.trim() ? "Write the note" : undefined}
        />
      </ModalBody>
      <ModalFooter layout="double">
        <ModalClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </ModalClose>
        <Button type="submit">{note ? "Save changes" : "Add note"}</Button>
      </ModalFooter>
    </form>
  )
}
