import { useEditorStore } from '../../stores/editor-store';
import { ValidationConfirmDialog } from './ValidationConfirmDialog';

/**
 * Always-mounted host that renders the save-time {@link ValidationConfirmDialog}
 * driven by editor-store state. Mount once (in EditorLayout) so the save flow —
 * which runs from a hook, not a component — can park its decision in the store
 * and await the user's choice.
 */
export function ValidationConfirmHost() {
  const request = useEditorStore((s) => s.validationConfirm);
  const setValidationConfirm = useEditorStore((s) => s.setValidationConfirm);

  const resolve = (proceed: boolean) => {
    request?.resolve(proceed);
    setValidationConfirm(null);
  };

  return (
    <ValidationConfirmDialog
      open={request !== null}
      onOpenChange={(open) => {
        // Closing the dialog without confirming counts as "cancel".
        if (!open) resolve(false);
      }}
      errors={request?.errors ?? []}
      onConfirm={() => resolve(true)}
    />
  );
}
