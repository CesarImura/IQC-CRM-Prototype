import { Empty } from "@/registry/iq/ui/empty"
import { PageHeader } from "@/registry/iq/ui/page-header"
import { allSections } from "@/lib/nav"

// Every nav destination is built at deploy time and served from the CDN, so menu clicks don't wait for a server render.
export const dynamicParams = true
export function generateStaticParams() {
  return allSections
    .flatMap((s) => [s.href, ...s.groups.flatMap((g) => g.links.map((l) => l.href))])
    .filter((href) => href.startsWith("/") && href !== "/customers/users" && href !== "/")
    .map((href) => ({ slug: href.split("/").filter(Boolean) }))
}

// Every other nav destination: a placeholder until the screen is redesigned.
export default async function PlaceholderPage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params
  const href = `/${slug.join("/")}`
  const link = allSections.flatMap((s) => [{ title: s.title, href: s.href }, ...s.groups.flatMap((g) => g.links)]).find((l) => l.href === href)
  const title = link?.title ?? "Not found"

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={title} />
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty
          title={link ? `${title} isn’t redesigned yet` : "This page doesn’t exist"}
          description={link ? "Only Users is in the prototype so far. The next screens will land here." : "Check the link or pick a section from the menu."}
          className="w-full max-w-[441px]"
        />
      </div>
    </div>
  )
}
