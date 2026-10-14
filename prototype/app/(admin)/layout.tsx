import { AppShell } from "@/components/app-shell"

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>
}
