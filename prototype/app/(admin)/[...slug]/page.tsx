import { Empty } from "@/registry/iq/ui/empty"
import { PageHeader } from "@/registry/iq/ui/page-header"
import { allSections } from "@/lib/nav"

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
