# IQ Capital Platform — redesign prototype

Clickable prototype of the redesigned IQ Capital admin, built with the
[IQ Capital CRM Design System](https://github.com/CesarImura/IQC-CRM-Design-System) (included here as the `design-system` submodule).

```bash
git clone --recurse-submodules https://github.com/CesarImura/IQC-CRM-Prototype.git
cd IQC-CRM-Prototype
npm install
npm run dev        # prototype → http://localhost:3001
npm run dev:ds     # design system docs → http://localhost:3000
```

- `prototype/`: the Next.js app (see [prototype/README.md](prototype/README.md) and [prototype/DESIGN-NOTES.md](prototype/DESIGN-NOTES.md)).
- `design-system/`: the DS repo. The prototype imports its source directly, so DS changes show up on save.
  To pick up the latest DS `main`: `git submodule update --remote design-system`, then commit the new pointer.

## Deploy (Vercel)

Import this repo, set **Root Directory** to `prototype`, keep the Next.js defaults. Vercel clones the submodule and
installs the npm workspace from the repo root.
