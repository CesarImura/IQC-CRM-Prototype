# Design notes: Users screen

Things found while rebuilding **01 Users · All** (Platform file, node `3081:77961`) with the DS. Nothing has been
written to Figma; these are proposals.

## Fix in the Platform file (screen)

1. **Pagination icons are wrong.** All four buttons use Carbon *Renew* (the loading icon) instead of
   first / previous / next / last chevrons. The prototype uses the DS Pagination (chevrons).
2. **Stray chevron in Pagination.** The Pagination instance has a loose `Chevron--right` layer between the count and the controls (not visible in the render; worth removing).
3. **Row action icon layer is named "Calendar".** `Dropdown / Icon Only` in *Cell · actions* shows Overflow Menu Vertical, but the layer is called Calendar.
4. **Filter pieces are local copies.** The screen draws More filters, chips and the hidden Results bar as local frames,
   while the library now has **Filter Chip, Filter Group, Filter Panel and Filter Results Bar** (published 14 Oct).
   Swap them for library instances. *Filter Button* only exists in the Platform file; move it to the library.
5. **Filter Results Bar is hidden.** The library says it's always visible with the count ("63,989 users"); the screen hides it.
   The prototype shows it only while filters are applied, so the default view matches the frame. Decide which is right.
6. **Filter Panel footer.** The library Filter Panel has *Cancel + Show N results*; the screen only has *Show results*. The prototype follows the library.
7. **Rail shows no active section.** The collapsed Side Menu doesn't highlight *Customers & transactions*. The prototype marks it active (DS Active state).
8. **Old hidden frame.** *Views · old (local View Tab)* is still in the frame, hidden. Safe to delete.
9. **Variables from another collection.** The screen uses `platform/*` variables (`platform/bg/raised #1f2221`, `platform/text/secondary #bbbebd`,
   `platform/feedback/danger/fg`…) next to DS variables. Map them to DS tokens.

## Screen vs DS differences (pick one, then align the other)

| Element | Figma screen | DS today | Prototype |
| --- | --- | --- | --- |
| Table cell text | white 80% | `value-slot-text` = white 100% | DS |
| Table header text | white 80% | `table-header-text` = neutral 400 | DS |
| Status Dot label (Verified) | `content/muted` 50% | `status-dot-label` (white) | DS |
| Sub Menu group label ("Manage") | Geist 14, white 30% | Geist Mono, `content-muted` 50% | DS |
| Stat Card value | white 100% | `stat-card-value` = white 80% | DS |
| Accounts panel | leading checkmark, "Any account" filled | trailing checkmark (Option Item) | DS |
| User ID cell | Geist, truncated in the middle (`3083cd1f…ece3`) | Value Slot Mono exists for IDs | Geist, middle-truncated (matches screen) |
| Button · Ghost (2026-10-17) | — | text color changes on hover only; pressed = `surface-soft` | white 6% fill on hover, 10% on pressed, full-white text (shadcn-like); CSS override in `app/globals.css`. Approved by Davi → take to the DS |
| Back link "← Users" (2026-10-17) | plain link, text 70% | — | Button ghost sm, starting on the content edge |
| Email cell (2026-10-17) | — | Value Link with `mailto:` | Value Link look; a click copies the address + toast "Email copied" (row doesn't open). Approved by Davi → copy variant in the DS |
| Row actions ⋮ column (2026-10-17) | 64px | extra table width spreads to every column, ⋮ stretches | always 64px; extra width goes to the column before it (CSS in `app/globals.css`) |

## Added to the DS (branch `feat/users-screen-gaps` in `design-system/`)

- **Filter** (`registry/iq/ui/filter.tsx`): Filter Button, Filter Chip (option / applied), Filter Group, Filter Panel, Filter Results Bar.
  New `filter-*` tokens, registry item, example and docs page (`/docs/components/filter`).
  The library masters couldn't be opened from code (no node link), so sizes come from the screen and the **Selected (green) chip colors are inferred**.
  Please share a link to the Filter components page to QA them.
- **Stat Card** `valueTone` (`positive` / `negative`) + `stat-card-value-positive` / `-negative` tokens, for the green 3,420 and the red 311.
- **Pagination** `summary` slot ("63,989 Users"), and **Data Table** `pagination.summary` / `pagination.showPageSize`.
- **Data Table** `pinnedRight` (sticky right columns) for the row-actions column.
- `next.config.ts`: uses the workspace root only when deps are hoisted there (standalone checkout and Vercel unchanged).

## Not designed yet (prototype choices)

- Row actions menu items (View profile, Edit, Suspend / Reactivate, Ban / Lift ban) and the Ban confirmation with a reason.
- Add User modal fields.
- Selection Bar actions (Export, Suspend, Ban).
- Export options (CSV of all results / selected rows).
- Period picker "All time" uses the DS Date Picker (range); there's no preset list (Today, Last 7 days…) in Figma.

## 17/10 · Touch layouts and new screens (Davi, local, not published)

- **DS rule proposal · table rows on touch:** below 1280px every Data Table row is **56px** tall (`--table-cell-height` 48 → 56) so a finger hits one row. Desktop stays 48. Needs a token or variant in the DS.
- **Buttons on touch (test):** profile header actions and section actions (`[data-touch-actions]`) are **40px** tall below 1280 (DS sm = 32). Replaces the 15/10 decision "buttons keep 32px on mobile" if Davi approves.
- **Pagination · Mobile:** "Rows [25]" · up to 3 page numbers + "…" · ← → as stroked icon buttons (same look as the drawer/modal X). Prototype-only variant.
- **Profile mobile:** key numbers above the tabs (tabs only head their content); scrollbar 4px under the cards; the tab bar starts on the content edge (no bar padding, first tab without left padding, last without right).
- **Profile status notice:** DS Alert under the header for every non-clean profile (Banned = Destructive; Suspended and KYC pending / not started = Default with a yellow warning icon, KYC shows a checklist of the registration items) + a Status Badge next to the name. The DS Alert has no Warning tone yet.
- **Accounts list** (`/customers/accounts`, Figma section 4333:112751): 6 tabs, KPIs per tab, per-tab columns from the Figma header rows. The 16px ring (`MiniRing`) and the strikes dashes (`Segments`) are drawn in the prototype; the DS has no mini ring or segment meter yet. Rows open `/customers/accounts/[id]`: one profile layout for every type (header with owner pill, status alert, KPI strip, 4 meters, Overview · Report · Historical tabs, Snapshots with the DS Balance Range Chart, Recent trades, Rule compliance / Payout readiness, Risk logs, Admin notes, Account setup, Account economics) and the overlays Extend expiry / Extend renewal / Reset / Change rule limits / Disable / Enable with toast + Undo. Report and Historical are empty states (not designed).
