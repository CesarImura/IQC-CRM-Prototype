"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"

/**
 * Animated scroll (reference: getartcraft.com/apps, Davi 16 Oct):
 * 1. Lenis smooth wheel scrolling on the app's content scroller (touch stays native).
 * 2. Reveal: every `[data-reveal]` block (hidden by CSS) fades in and rises 24px, staggered, once.
 * Nested scrollers (sheets, Staff logs, tables) keep their own native scroll.
 */
export function ScrollFX({ scroller }: { scroller: React.RefObject<HTMLElement | null> }) {
  // New route: reset Lenis and look for new blocks to reveal.
  const pathname = usePathname()
  React.useEffect(() => {
    const wrapper = scroller.current
    if (!wrapper) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const lenis = reduce
      ? null
      : new Lenis({
          wrapper,
          // A stable content box (app-shell `data-scroll-content`): a route root can be a 0-height sticky bar, which
          // made Lenis stop short of the end of the page.
          content: wrapper.querySelector<HTMLElement>(":scope > [data-scroll-content]") ?? wrapper,
          // Barely noticeable, same as the DS docs (Davi, 17 Oct): follows the wheel almost 1:1.
          lerp: 0.3,
          smoothWheel: true,
          autoRaf: true,
          // Let inner scrollers (lists, x-scrolling tables) scroll themselves.
          // Shift + wheel and trackpad side swipes stay native, so tables scroll sideways.
          virtualScroll: ({ deltaX, deltaY, event }) => !((event as WheelEvent).shiftKey || Math.abs(deltaX) > Math.abs(deltaY)),
          prevent: (node) => node !== wrapper && node.scrollHeight > node.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(node).overflowY),
        })

    // Web Animations instead of attributes: the blocks may still be hydrating, and React must not see the DOM change.
    // Cost (Davi 16–17 Oct): opacity + transform only, which run on the compositor; no blur anywhere (it repaints the
    // block every frame). What is already on screen when the page opens shows at once, no animation.
    const shown = new WeakSet<Element>()
    const bootUntil = performance.now() + 700
    const io = new IntersectionObserver(
      (entries) => {
        const instant = performance.now() < bootUntil
        entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          .forEach((el, i) => {
            shown.add(el)
            io.unobserve(el)
            el.animate(
              [
                { opacity: 0, transform: "translateY(24px)" },
                { opacity: 1, transform: "none" },
              ],
              instant ? { duration: 0, fill: "forwards" } : { duration: 600, delay: Math.min(i, 5) * 60, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
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
