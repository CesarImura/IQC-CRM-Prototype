import * as React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProfileScreen } from "@/components/user-profile/profile-screen"
import { getAllUsers } from "@/lib/users/data"

const findUser = (id: string) => getAllUsers().find((u) => u.id === id)

// Profiles don't depend on the request: the featured users are built at deploy time, any other id renders once and is cached.
export const dynamicParams = true
export function generateStaticParams() {
  return getAllUsers()
    .slice(0, 12)
    .map((u) => ({ id: u.id }))
}

export async function generateMetadata({ params }: PageProps<"/customers/users/[id]">): Promise<Metadata> {
  const { id } = await params
  return { title: findUser(id)?.name ?? "User" }
}

export default async function UserProfilePage({ params }: PageProps<"/customers/users/[id]">) {
  const { id } = await params
  const user = findUser(id)
  if (!user) notFound()
  return (
    <React.Suspense>
      <ProfileScreen user={user} />
    </React.Suspense>
  )
}
