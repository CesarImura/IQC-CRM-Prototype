import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AccountProfile } from "@/components/accounts/account-profile"
import { findAccount } from "@/lib/accounts/profile"

// The Figma rows are built at deploy time; any other account renders once and is cached.
export const dynamicParams = true
export function generateStaticParams() {
  return ["IQCFEV100K-158310", "IQCFN50K-160424", "IQCFEV50K-160812", "IQCFEV50K-160388", "IQCEV50K-158102", "IQCFN50K-161055", "IQCFEV50K-157455", "IQIF50K-156401"].map((id) => ({ id }))
}

export async function generateMetadata({ params }: PageProps<"/customers/accounts/[id]">): Promise<Metadata> {
  const { id } = await params
  return { title: findAccount(id)?.id ?? "Account" }
}

export default async function AccountPage({ params }: PageProps<"/customers/accounts/[id]">) {
  const { id } = await params
  const account = findAccount(id)
  if (!account) notFound()
  return <AccountProfile account={account} />
}
