import type { CarbonIconType } from "@carbon/icons-react"
import {
  Account,
  DiamondOutline,
  ChartRing,
  Chat,
  Filter,
  Home,
  Link as LinkIcon,
  Money,
  Network_2,
  PricingContainer,
  Rule,
  Tag,
  Tools,
  UserMultiple,
  Wikis,
} from "@carbon/icons-react"

export type NavLink = { title: string; href: string }
export type NavSection = {
  id: string
  title: string
  icon: CarbonIconType
  href: string
  /** Sub Menu groups. */
  groups: { label?: string; links: NavLink[] }[]
}

// Side Menu order and dividers follow the Figma rail (Side Menu, collapsed).
export const navGroups: NavSection[][] = [
  [{ id: "admin", title: "Admin Panel", icon: Home, href: "/admin", groups: [{ links: [{ title: "Overview", href: "/admin" }] }] }],
  [
    {
      id: "customers",
      title: "Customers & transactions",
      icon: UserMultiple,
      href: "/customers/users",
      groups: [
        {
          label: "Manage",
          links: [
            { title: "Users", href: "/customers/users" },
            { title: "Accounts", href: "/customers/accounts" },
            { title: "Orders", href: "/customers/orders" },
            { title: "Subscriptions", href: "/customers/subscriptions" },
            { title: "Renewals", href: "/customers/renewals" },
          ],
        },
      ],
    },
    section("trading", "Trading & funded accounts", Account),
  ],
  [
    section("catalog", "Catalog, pricing & discounts", Tag),
    section("marketing", "Marketing & funnels", Filter),
    section("affiliates", "Affiliates & partners", Wikis),
  ],
  [section("payments", "Payments, fraud & risk", Money), section("refunds", "Refunds", PricingContainer), section("risk", "Risk & compliance", Rule)],
  [section("reporting", "Reporting & analytics", ChartRing), section("communication", "Communication", Chat), section("utilities", "Utilities", Tools)],
  [section("integrations", "Integrations & system", Network_2), section("connected", "Connected systems", LinkIcon)],
  [{ id: "ui-library", title: "UI library", icon: DiamondOutline, href: "https://iqc-crm-design-system.vercel.app/docs", groups: [{ links: [] }] }],
]

function section(id: string, title: string, icon: CarbonIconType): NavSection {
  return { id, title, icon, href: `/${id}`, groups: [{ links: [{ title: "Overview", href: `/${id}` }] }] }
}

export const allSections = navGroups.flat()

/** The section whose links (or root) contain this path. */
export function findSection(pathname: string) {
  return (
    allSections.find((s) => s.groups.some((g) => g.links.some((l) => pathname === l.href || pathname.startsWith(`${l.href}/`)))) ??
    allSections.find((s) => pathname.startsWith(s.href)) ??
    allSections[1]
  )
}

export function findLink(pathname: string) {
  return allSections.flatMap((s) => s.groups.flatMap((g) => g.links)).find((l) => l.href === pathname)
}
