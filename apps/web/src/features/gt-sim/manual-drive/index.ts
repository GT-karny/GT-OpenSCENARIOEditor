/**
 * `features/gt-sim/manual-drive` — cluster C (manual drive settings).
 *
 * Exports `ManualDrivePanel`, fork-API-compatible
 * (`open`/`onClose`/`config`/`onChange`, matching the GT_Sim fork's
 * `ManualDrivePanel.tsx`) so the run-form cluster's
 * `ManualDriveSettingsPlaceholder` can be swapped for the real thing with a
 * minimal JSX change:
 *
 * ```diff
 * - import { ManualDriveSettingsPlaceholder } from './ManualDriveSettingsPlaceholder';
 * + import { ManualDrivePanel } from '@/features/gt-sim/manual-drive';
 *   ...
 * - <ManualDriveSettingsPlaceholder
 * -   open={showManualPanel}
 * -   onClose={() => patchUi({ showManualPanel: false })}
 * - />
 * + <ManualDrivePanel
 * +   open={showManualPanel}
 * +   onClose={() => patchUi({ showManualPanel: false })}
 * +   config={manualDriveConfig}
 * +   onChange={(v) => patchValues({ manualDriveConfig: v })}
 * + />
 * ```
 *
 * This cluster has no standalone panel-registry entry (no `register.ts`):
 * the fork's `ManualDrivePanel` is a settings slide-panel opened from
 * `ControllerSection`'s gear icon inside the run-form panel, not a top-level
 * execution panel in its own right.
 */
export { ManualDrivePanel, type ManualDrivePanelProps } from './components/ManualDrivePanel';
export { useGamepadButtonCapture } from './hooks/useGamepadButtonCapture';
