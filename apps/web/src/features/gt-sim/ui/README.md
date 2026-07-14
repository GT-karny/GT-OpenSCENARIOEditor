# `features/gt-sim/ui/` — shared UI primitives

Ported from the GT_Sim fork's `web/frontend/src/components/ui/*`. This directory is
**owned by the trunk lane (L3)** and frozen once created (see
`CLAUDE.local.md` § Unified UI migration — directory ownership rules):
other lanes may **import only**; change requests go to L3.

All components use APEX `var(--color-*)` tokens (`docs/STYLE_GUIDE.md`) instead of the
fork's bare Tailwind color names (`bg-glass-1`, `text-primary`, …) and `rounded-none`
instead of the fork's default corners. Import from the barrel:

```ts
import { Button, StatusBadge, ConfirmDialog, /* … */ } from '@/features/gt-sim/ui';
```

## Components

| Component | Props | Fork API compat |
|---|---|---|
| `Button` | `variant?: 'primary'\|'secondary'\|'danger'\|'ghost'`, `size?: 'sm'\|'md'\|'lg'`, `...ButtonHTMLAttributes` | Identical. |
| `TextInput` / `NumberInput` / `SelectInput` | `label?`, `wrapperClassName?`, `...*HTMLAttributes` | Identical. |
| `Checkbox` | `label: string`, `description?`, `...InputHTMLAttributes` | Identical. |
| `ToggleSwitch` | `label`, `checked`, `onChange(checked)`, `description?`, `className?` | Identical. |
| `IconToggle` | `icon: JSX.Element`, `label`, `active`, `onChange(active)`, `className?` | Identical. |
| `StatusBadge` | `status: string`, `bordered?`, `className?` | Identical prop shape. **New**: `status` is translated via `gtSim.ui.statusBadge.*` when it matches the known `GtSimJobStatus` set (`queued\|running\|completed\|failed\|cancelled\|timeout`, mirrors `packages/esmini/src/client/gt-sim-status.ts`); unrecognized strings render verbatim like the fork. |
| `TableShell` | `columns: TableColumn[]`, `children` | Identical (fork's `Column` interface was unexported; this lane exports it as `TableColumn` — additive, not a breaking rename since consumers only ever passed matching object literals). |
| `TableSkeleton` | `columns: number`, `rows?: number` | Identical. |
| `Card` | `title?`, `children`, `className?`, `variant?: 'default'\|'elevated'\|'active'` | Identical — wraps `@osce/theme-apex` `GlassPanel`. |
| `ConfirmDialog` | `open`, `title`, `message`, `confirmLabel?`, `variant?: 'danger'\|'primary'`, `onConfirm()`, `onCancel()` | Prop shape identical. **Behavior change**: rewritten on `@radix-ui/react-dialog` (`role="alertdialog"`) instead of the fork's native `<dialog>` — see "Non-compat notes" below. `confirmLabel` default now comes from i18n instead of the hardcoded literal `'Confirm'`. |
| `SlidePanel` | `open`, `onClose()`, `title`, `children` | Identical — built on `@radix-ui/react-dialog` with `forceMount` to preserve the fork's open **and** close slide transition. |
| `ContextMenu` | `items: ContextMenuItem[]`, `position: {x,y}`, `onClose()` | Identical — kept the fork's manual coordinate-driven `createPortal` implementation (see "Non-compat notes"). |
| `EmptyState` | `message`, `action?` | Identical. |
| `ErrorPanel` | `error: unknown`, `onRetry?()` | Identical prop shape; `'Failed to load data: …'` / `'Retry'` now come from i18n instead of hardcoded English. |
| `MarkdownRenderer` | `content`, `imageBaseUrl?`, `className?` | Identical. |

## Non-compat notes for consuming lanes

- **`ConfirmDialog`**: `@radix-ui/react-alert-dialog` is not (and per the migration's
  frozen-`package.json` rule, may not be added as) a dependency of `apps/web`. The
  dialog is built on `@radix-ui/react-dialog`'s `Content` with `role="alertdialog"`
  instead — visually and functionally equivalent, but Radix now traps focus inside
  the dialog and restores it to the trigger on close, which the fork's native
  `<dialog>` element did not do explicitly. If a caller relied on focus staying
  outside the dialog, it will now behave differently.
- **`SlidePanel`**: no `Sheet` primitive existed in `apps/web/src/components/ui/`, so
  this is built directly on `@radix-ui/react-dialog` (the same primitive shadcn's own
  `Sheet` wraps). API is unchanged.
- **`ContextMenu`**: the editor's Radix `ContextMenu`
  (`apps/web/src/components/ui/context-menu.tsx`) is trigger-based and does not
  support the fork's imperative `{ x, y } + items` API used by every caller in the
  migration plan (right-click handlers compute `clientX/clientY` and open the menu
  programmatically). Per the migration plan, fork-API compatibility was prioritized
  over a full Radix rewrite — this component keeps the fork's manual
  positioning/outside-click/escape/scroll-close `createPortal` implementation,
  restyled with APEX tokens.
- **`StatusBadge`**: prop type is still `status: string` (not narrowed to
  `GtSimJobStatus`) for exact fork-call-site compatibility, since callers pass
  `GtSimSimulationStatus.status` which is `string` on the wire
  (`packages/esmini/src/client/gt-sim-api-types.ts`). The `GtSimJobStatus` union is
  re-declared locally (not imported from `@osce/esmini`) because `apps/web` does not
  depend on that package yet (unwired, see the migration appendix §E) and this lane
  may not add the dependency. Keep the literal set in sync with
  `packages/esmini/src/client/gt-sim-status.ts` if the backend contract changes.

## i18n keys added

All under the `common` namespace, `gtSim.ui.*` (added to both
`packages/i18n/src/locales/en/common.ts` and `.../ja/common.ts`, inside the
pre-reserved `ui: {}` anchor block — no other block was touched):

- `gtSim.ui.statusBadge.{queued,running,completed,failed,cancelled,timeout}`
- `gtSim.ui.confirmDialog.{cancel,confirmDefault}`
- `gtSim.ui.slidePanel.close`
- `gtSim.ui.errorPanel.{failedToLoad,retry}`

Everything else (`EmptyState.message`, `ContextMenuItem.label`, `Card.title`,
`Checkbox.label`, `ToggleSwitch.label`, `MarkdownRenderer.content`, …) is
caller-supplied data/text, not a literal owned by this layer — the calling lane is
responsible for passing already-translated strings.
