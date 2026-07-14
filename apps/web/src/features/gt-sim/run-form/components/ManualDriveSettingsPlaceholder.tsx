/**
 * Placeholder for the Manual Drive settings slide-panel.
 *
 * The fork's `ManualDrivePanel.tsx` (406 lines) + `useGamepadButtonCapture.ts`
 * are cluster C, out of scope for this lane. `ControllerSection` still needs
 * somewhere to send the gear-icon click to (so the affordance isn't silently
 * dropped), so this renders the shared `SlidePanel` shell with an
 * explanatory empty state instead of crashing/no-op'ing.
 *
 * TODO(cluster C): replace this component's body with the ported
 * `ManualDrivePanel` once that lane lands, wiring `config`/`onChange` the
 * same way the fork's `SimulationRunForm` did.
 */
import { useTranslation } from '@osce/i18n';
import { SlidePanel, EmptyState } from '../../ui';

export interface ManualDriveSettingsPlaceholderProps {
  open: boolean;
  onClose: () => void;
}

export function ManualDriveSettingsPlaceholder({
  open,
  onClose,
}: ManualDriveSettingsPlaceholderProps) {
  const { t } = useTranslation('common');
  return (
    <SlidePanel open={open} onClose={onClose} title={t('gtSim.runForm.manualDrive.title')}>
      <EmptyState message={t('gtSim.runForm.manualDrive.placeholder')} />
    </SlidePanel>
  );
}
