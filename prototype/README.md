# IQ Capital Platform — redesign prototype

Clickable Next.js prototype of the redesigned admin screens, built only from the
[IQ Capital CRM Design System](../design-system) (`../design-system`, the GitHub repo).

## Run

From the workspace root (`IQC CRM Screen/`):

```bash
npm install        # once; installs both packages (hoisted to ./node_modules)
npm run dev        # prototype → http://localhost:3001
npm run dev:ds     # design system docs → http://localhost:3000
```

## How it uses the design system

The prototype imports the DS **source** directly, so a fix in `design-system/registry/iq/ui/*` shows up here on save:

- `tsconfig.json` maps `@/registry/*` and `@/lib/utils` to `../design-system/…`.
- `app/globals.css` imports `design-system/registry/iq/styles/tokens.css` and adds `@source` so Tailwind sees the DS classes.
- `next.config.ts` sets `turbopack.root` to the workspace so files outside `prototype/` compile.

Rule of thumb: screens compose DS components. When a screen needs something the DS doesn't have, add it to the DS
(component + tokens + docs page), then use it here.

## Screens

| Route | Figma | Status |
| --- | --- | --- |
| `/customers/users` | [01 Users · All](https://www.figma.com/design/e6LrQzn6vm2XlnHeO3qeOw/IQ-Capital-Platform-File?node-id=3081-77961) | Clickable |
| everything else in the nav | — | Placeholder |

## Data

`lib/users/data.ts` builds 63,989 deterministic mock users (the first 11 are the Figma rows) and matches the Figma
numbers: 311 banned, 1,847 needing action, 812 new in 7 days, 3,420 in 30 days, 71.4% KYC verified.
`lib/users/query.ts` filters, sorts and pages them like an API would, so it can be swapped for real endpoints.
Edits (add, ban, suspend) live in memory and reset on reload.
