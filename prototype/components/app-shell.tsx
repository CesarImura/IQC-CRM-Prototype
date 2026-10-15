"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Notification, Settings } from "@carbon/icons-react"

import { allSections, findLink, findSection, navGroups } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/registry/iq/ui/breadcrumb"
import { Button } from "@/registry/iq/ui/button"
import { SearchBar } from "@/registry/iq/ui/search-bar"
import { SideMenu, SideMenuDivider, SideMenuLink, SideMenuSection, SubMenu, SubMenuGroup, TopMenu } from "@/registry/iq/ui/navigation"
import { Tooltip } from "@/registry/iq/ui/tooltip"

function BrandMark() {
  return (
    <Link href="/customers/users" aria-label="IQ Capital home" className="flex items-center gap-3 rounded-[2px] outline-none focus-visible:shadow-[0_0_0_var(--focus-spread)_var(--focus-ring)]">
      <span className="flex size-10 items-center justify-center rounded-[2px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="" width={20.657} height={20} />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/wordmark.svg" alt="IQ Capital" width={108} height={20.003} />
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const section = findSection(pathname)
  const page = findLink(pathname)
  const [search, setSearch] = React.useState("")
  const [railOpen, setRailOpen] = React.useState(false)
  const railTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const openRail = (open: boolean, delay = 0) => {
    clearTimeout(railTimer.current)
    railTimer.current = setTimeout(() => setRailOpen(open), delay)
  }
  React.useEffect(() => () => clearTimeout(railTimer.current), [])

  // Focus rings only for keyboard users: a mouse click shouldn't leave a ring on the tab or button it hit.
  React.useEffect(() => {
    const root = document.documentElement
    const pointer = () => (root.dataset.input = "pointer")
    const keyboard = (e: KeyboardEvent) => {
      if (["Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", " "].includes(e.key)) root.dataset.input = "keyboard"
    }
    window.addEventListener("pointerdown", pointer, true)
    window.addEventListener("keydown", keyboard, true)
    return () => {
      window.removeEventListener("pointerdown", pointer, true)
      window.removeEventListener("keydown", keyboard, true)
    }
  }, [])

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopMenu
        brand={<BrandMark />}
        trail={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={section.href}>{section.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {!page && pathname.startsWith("/customers/users/") && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/customers/users">Users</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Profile</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              {page && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{page.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        }
        actions={
          <>
            <div className="w-60">
              <SearchBar placeholder="Search Users, orders, affiliates..." aria-label="Search everything" value={search} onValueChange={setSearch} />
            </div>
            <Tooltip content="Notifications">
              <Button variant="secondary" size="icon-sm" aria-label="Notifications">
                <Notification />
              </Button>
            </Tooltip>
            <Tooltip content="Settings">
              <Button variant="secondary" size="icon-sm" aria-label="Settings">
                <Settings />
              </Button>
            </Tooltip>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        {/* Collapsed 56px rail; hovering (or tabbing into) it expands it to 320px over the Sub Menu. */}
        <div
          className="relative z-30 w-14 shrink-0"
          onMouseEnter={() => openRail(true, 120)}
          onMouseLeave={() => openRail(false, 80)}
          onFocus={() => openRail(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && openRail(false)}
        >
        <SideMenu
          expanded={railOpen}
          aria-label="Sections"
          data-rail
          className={cn("absolute inset-y-0 left-0 transition-[width,box-shadow] duration-150 ease-out", railOpen && "shadow-[16px_0_32px_rgba(0,0,0,0.45)]")}
        >
          {navGroups.map((group, i) => (
            <React.Fragment key={i}>
              {i > 0 && <SideMenuDivider />}
              <SideMenuSection>
                {group.map(({ id, title, icon: Icon, href }) => (
                  <SideMenuLink
                    key={id}
                    label={title}
                    icon={<Icon />}
                    active={id === section.id}
                    href={href}
                    render={(props) =>
                      href.startsWith("http") ? (
                        <a {...props} href={href} target="_blank" rel="noreferrer" />
                      ) : (
                        <Link {...props} href={href} onClick={() => openRail(false)} />
                      )
                    }
                  />
                ))}
              </SideMenuSection>
            </React.Fragment>
          ))}
        </SideMenu>
        </div>

        <SubMenu title={section.title} aria-label={section.title}>
          {section.groups.map((group, i) => (
            <SubMenuGroup key={i} label={group.label}>
              {group.links.map((link) => (
                <SideMenuLink
                  key={link.href}
                  label={link.title}
                  active={pathname === link.href || pathname.startsWith(`${link.href}/`)}
                  href={link.href}
                  render={(props) => <Link {...props} href={link.href} />}
                />
              ))}
            </SubMenuGroup>
          ))}
        </SubMenu>

        {/* -1px: the content's left strokes sit on the Sub Menu stroke, as in Figma. */}
        <div className="relative -ml-px min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export { allSections }
