// Turns every px length in the compiled CSS (DS tokens, Tailwind arbitrary values, our own rules) into rem, so the
// whole admin scales from the root font-size set in app/globals.css (one scale per breakpoint). Hairlines (≤ 1px)
// stay in px so borders never blur, and media queries keep px (breakpoints follow the real screen width).
// Only whole numbers: the tail of "3.40282e38px" (Tailwind's rounded-full) must not be converted.
const PX = /(?<![\w.])(-?\d*\.?\d+)px\b/g

/** @type {import('postcss').PluginCreator} */
const pxToRem = () => ({
  postcssPlugin: "px-to-rem",
  Declaration(decl) {
    if (!decl.value.includes("px") || decl.value.includes("url(")) return
    if (decl.parent?.type === "rule" && decl.parent.selector === "html" && decl.prop === "font-size") return
    decl.value = decl.value.replace(PX, (m, n) => (Math.abs(parseFloat(n)) <= 1 ? m : `${+(parseFloat(n) / 16).toFixed(5)}rem`))
  },
})
pxToRem.postcss = true
export default pxToRem
