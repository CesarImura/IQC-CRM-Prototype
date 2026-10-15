"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Notification, Settings } from "@carbon/icons-react"

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

  // Below lg the same Side Menu + Sub Menu slide in as a drawer from the ☰ button (Figma: Nav Drawer / Mobile);
  // any navigation closes it.
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [drawerPath, setDrawerPath] = React.useState(pathname)
  if (drawerPath !== pathname) {
    setDrawerPath(pathname)
    setDrawerOpen(false)
  }
  React.useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawerOpen])

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
        brand={
          <>
            <Button variant="secondary" size="icon-sm" className="lg:hidden" aria-label="Open menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
              <Menu />
            </Button>
            <BrandMark />
          </>
        }
        trail={
          <Breadcrumb className="max-lg:hidden">
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
            <div className="w-60 max-lg:hidden">
              <SearchBar placeholder="Search Users, orders, affiliates..." aria-label="Search everything" value={search} onValueChange={setSearch} />
            </div>
            <Tooltip content="Notifications">
              <Button variant="secondary" size="icon-sm" aria-label="Notifications">
                <Notification />
              </Button>
            </Tooltip>
            <Tooltip content="Settings">
              <Button variant="secondary" size="icon-sm" aria-label="Settings" className="max-lg:hidden">
                <Settings />
              </Button>
            </Tooltip>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        {/* Mobile drawer scrim: tap outside to close. */}
        <div
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden",
            drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />
        {/* Desktop: `contents`, so the rail and Sub Menu sit in the row as before. Mobile: one fixed drawer (rail + Sub
            Menu at 296px), sliding in from the left. Same component instances on every screen size. */}
        <div
          data-shell-nav
          className={cn(
            "flex lg:contents",
            "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:[--nav-width:296px] max-lg:transition-[translate,box-shadow] max-lg:duration-300 max-lg:ease-[cubic-bezier(0.16,1,0.3,1)]",
            drawerOpen ? "max-lg:shadow-(--shadow-drawer)" : "max-lg:-translate-x-full"
          )}
        >
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
          className={cn("absolute inset-y-0 left-0 transition-[width,box-shadow] duration-150 ease-out", railOpen && "shadow-(--shadow-drawer)")}
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
        </div>

                <div className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export { allSections }
