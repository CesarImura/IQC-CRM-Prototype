"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"

/**
 * Animated scroll (reference: getartcraft.com/apps, Davi 16 Oct):
 * 1. Lenis smooth wheel scrolling on the app's content scroller (touch stays native).
 * 2. Reveal: every `[data-reveal]` block (hidden by CSS) enters with blur 8px → 0, 28px → 0 and fade, staggered, once.
 * Nested scrollers (sheets, Staff logs, tables) keep their own native scroll.
 */
export function ScrollFX({ scroller }: { scroller: React.RefObject<HTMLElement | null> }) {
  // The content element is the route's root, so Lenis restarts on every route.
  const pathname = usePathname()
  React.useEffect(() => {
    const wrapper = scroller.current
    if (!wrapper) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const lenis = reduce
      ? null
      : new Lenis({
          wrapper,
          content: (wrapper.firstElementChild as HTMLElement) ?? wrapper,
          lerp: 0.1,
          smoothWheel: true,
          autoRaf: true,
          // Let inner scrollers (lists, x-scrolling tables) scroll themselves.
          prevent: (node) => node !== wrapper && node.scrollHeight > node.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(node).overflowY),
        })

    // Web Animations instead of attributes: the blocks may still be hydrating, and React must not see the DOM change.
    const shown = new WeakSet<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          .forEach((el, i) => {
            shown.add(el)
            io.unobserve(el)
            el.animate(
              [
                { opacity: 0, filter: "blur(8px)", transform: "translateY(28px)" },
                { opacity: 1, filter: "blur(0px)", transform: "none" },
              ],
              { duration: 850, delay: Math.min(i, 6) * 70, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
            )
          })
      },
      { root: wrapper, threshold: 0, rootMargin: "0px 0px -24px 0px" }
    )
    const watch = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => !shown.has(el) && io.observe(el))
    watch(wrapper)
    // Tabs and route changes mount new blocks: observe them as they appear.
    const mo = new MutationObserver(() => watch(wrapper))
    mo.observe(wrapper, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      io.disconnect()
      lenis?.destroy()
    }
  }, [scroller, pathname])
  return null
}
