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
    <div className="relative flex items-center justify-between h-[26px] px-6 border-t border-[var(--color-glass-edge-mid)] bg-[var(--color-glass-1)] backdrop-blur-[28px] saturate-[1.3] text-[10px] text-[var(--color-text-tertiary)] tracking-[0.03em] statusbar-glow enter" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <div
            className="w-[5px] h-[5px] bg-[var(--color-success)]"
            style={{ boxShadow: '0 0 3px rgba(93, 216, 168, 0.3)' }}
          />
          <span>Ready</span>
        </div>
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
      <div className="flex items-center gap-6">
        {currentFileName && (
          <span>
            {currentFileName}
            {isDirty ? ' *' : ''}
          </span>
        )}
        {!currentFileName && <span>Untitled{isDirty ? ' *' : ''}</span>}
        <span>OpenSCENARIO v1.2</span>
      </div>
    </div>
  );
}
