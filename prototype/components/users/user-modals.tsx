"use client"

import * as React from "react"

import { TODAY, type Role, type User } from "@/lib/users/data"
import { Button } from "@/registry/iq/ui/button"
import { Select } from "@/registry/iq/ui/combobox"
import { TextField } from "@/registry/iq/ui/form-field"
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from "@/registry/iq/ui/modal"
import { roleMeta } from "./columns"

const roleOptions = Object.entries(roleMeta).map(([value, m]) => ({ value, label: m.label }))
const banReasons = ["Account sharing", "Cross-account hedging", "Chargeback fraud", "Copy trading abuse", "Multiple identities", "Terms violation"].map((r) => ({ value: r, label: r }))

export function AddUserModal({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (user: User) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {/* The form mounts with the modal, so it starts empty every time. */}
      <ModalContent size="md">
        {open && (
          <AddUserForm
            onCreate={(user) => {
              onCreate(user)
              onOpenChange(false)
            }}
          />
        )}
      </ModalContent>
    </Modal>
  )
}

function AddUserForm({ onCreate }: { onCreate: (user: User) => void }) {
  const [form, setForm] = React.useState({ name: "", email: "", username: "", phone: "", role: "client" })
  const [submitted, setSubmitted] = React.useState(false)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const valid = form.name.trim() && emailValid && form.username.trim()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!valid) return
    const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("")
    onCreate({
      id,
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      phone: form.phone.trim() || "—",
      role: form.role as Role,
      accounts: 0,
      accountTypes: [],
      breached: false,
      status: "kyc_pending",
      banReason: null,
      verification: "pending",
      affiliate: null,
      registered: TODAY.toISOString().slice(0, 10),
      utm: null,
    })
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  return (
    <form onSubmit={submit} noValidate className="contents">
      <ModalHeader title="Add user" description="They’ll get an email to set a password and finish KYC." />
      <ModalBody className="flex flex-col gap-4">
        <TextField label="Full name" required autoFocus value={form.name} onChange={set("name")} status={submitted && !form.name.trim() ? "error" : undefined} helper={submitted && !form.name.trim() ? "Enter a name" : undefined} />
        <TextField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={set("email")}
          status={submitted && !emailValid ? "error" : undefined}
          helper={submitted && !emailValid ? "Enter a valid email" : undefined}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Username" required value={form.username} onChange={set("username")} status={submitted && !form.username.trim() ? "error" : undefined} helper={submitted && !form.username.trim() ? "Enter a username" : undefined} />
          <TextField label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
        </div>
        <Select label="Role" search={false} options={roleOptions} value={form.role} onValueChange={(role) => setForm({ ...form, role })} />
      </ModalBody>
      <ModalFooter layout="double">
        <ModalClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </ModalClose>
        <Button type="submit">Add user</Button>
      </ModalFooter>
    </form>
  )
}

export function BanUserModal({ user, onOpenChange, onConfirm }: { user: User | null; onOpenChange: (open: boolean) => void; onConfirm: (user: User, reason: string) => void }) {
  const [reason, setReason] = React.useState(banReasons[0].value)
  return (
    <Modal open={user !== null} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader title={`Ban ${user?.name ?? "user"}?`} description="They’ll be signed out and can’t log in or buy challenges. You can lift the ban later." />
        <ModalBody>
          <Select label="Reason" search={false} options={banReasons} value={reason} onValueChange={setReason} />
        </ModalBody>
        <ModalFooter layout="double">
          <ModalClose asChild>
            <Button variant="secondary">Cancel</Button>
          </ModalClose>
          <Button variant="danger" onClick={() => user && onConfirm(user, reason)}>
            Ban user
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
