import { useTranslation } from '@osce/i18n';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';

export function StatusBar() {
  const { t } = useTranslation('common');
  const entityCount = useScenarioStore((s) => s.document.entities.length);
  const storyCount = useScenarioStore((s) => s.document.storyboard.stories.length);
  const validationResult = useEditorStore((s) => s.validationResult);
  const currentFileName = useEditorStore((s) => s.currentFileName);
  const isDirty = useEditorStore((s) => s.isDirty);

  return (
    <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-card backdrop-blur-xl text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>
          {t('labels.entities')}: {entityCount}
        </span>
        <span>
          {t('labels.stories')}: {storyCount}
        </span>
        {validationResult && (
          <span
            className={
              validationResult.valid ? 'text-success' : 'text-destructive'
            }
          >
            {validationResult.errors.length} errors, {validationResult.warnings.length} warnings
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {currentFileName && (
          <span>
            {currentFileName}
            {isDirty ? ' *' : ''}
          </span>
        )}
        {!currentFileName && <span>Untitled{isDirty ? ' *' : ''}</span>}
      </div>
    </div>
  );
}
