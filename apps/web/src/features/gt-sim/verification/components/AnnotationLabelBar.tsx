/**
 * Right-rail labeling control: three label buttons (Pass / Fail /
 * Needs-discussion) with keyboard hints + a comment box. The page owns the
 * keyboard shortcuts and auto-advance; this component is the visual + click
 * surface and exposes a ref so the page can focus the comment box (C key).
 *
 * Ported from the fork's `components/verification/AnnotationLabelBar.tsx`,
 * restyled with APEX tokens.
 */
import { forwardRef } from 'react';
import { useTranslation } from '@osce/i18n';
import type { AnnotationLabel } from '@osce/esmini';

const ACTIVE_STYLE: Record<AnnotationLabel, string> = {
  pass: 'bg-[var(--color-success)]/80 text-[var(--color-bg-void)] border-[var(--color-success)]',
  fail: 'bg-[var(--color-destructive)]/80 text-[var(--color-bg-void)] border-[var(--color-destructive)]',
  'needs-discussion': 'bg-[var(--color-warning)]/80 text-[var(--color-bg-void)] border-[var(--color-warning)]',
};

const KEY_HINT: Record<AnnotationLabel, string> = { pass: 'P', fail: 'F', 'needs-discussion': 'D' };

export const AnnotationLabelBar = forwardRef<
  HTMLTextAreaElement,
  {
    current: AnnotationLabel | null;
    comment: string;
    onLabel: (label: AnnotationLabel) => void;
    onComment: (text: string) => void;
    onCommentBlur: () => void;
    saved: boolean;
    saving: boolean;
    error?: string | null;
    autoAdvance: boolean;
    onToggleAutoAdvance: () => void;
  }
>(function AnnotationLabelBar(
  { current, comment, onLabel, onComment, onCommentBlur, saved, saving, error, autoAdvance, onToggleAutoAdvance },
  ref,
) {
  const { t } = useTranslation('common');
  const labels: AnnotationLabel[] = ['pass', 'fail', 'needs-discussion'];
  const labelText: Record<AnnotationLabel, string> = {
    pass: t('gtSim.vd.annotate.labelPass'),
    fail: t('gtSim.vd.annotate.labelFail'),
    'needs-discussion': t('gtSim.vd.annotate.labelNeedsDiscussion'),
  };

  return (
    <div className="border border-[var(--color-glass-edge)] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-primary)]">{t('gtSim.vd.annotate.labelTitle')}</span>
        <span className="text-[11px] h-4">
          {saving ? (
            <span className="text-[var(--color-text-tertiary)]">{t('gtSim.vd.annotate.saving')}</span>
          ) : saved ? (
            <span className="text-[var(--color-success)]">✓ {t('gtSim.vd.annotate.saved')}</span>
          ) : error ? (
            <span className="text-[var(--color-destructive)]">{error}</span>
          ) : null}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {labels.map((lbl) => {
          const isActive = current === lbl;
          return (
            <button
              key={lbl}
              type="button"
              onClick={() => onLabel(lbl)}
              className={`px-1.5 py-1.5 rounded-none border text-xs font-medium transition-colors cursor-pointer ${
                isActive ? ACTIVE_STYLE[lbl] : 'border-[var(--color-glass-edge)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-hover)]'
              }`}
              title={`${labelText[lbl]} (${KEY_HINT[lbl]})`}
            >
              {labelText[lbl]}
              <span className="ml-1 opacity-60 text-[10px]">{KEY_HINT[lbl]}</span>
            </button>
          );
        })}
      </div>

      <textarea
        ref={ref}
        value={comment}
        onChange={(e) => onComment(e.target.value)}
        onBlur={onCommentBlur}
        placeholder={t('gtSim.vd.annotate.commentPlaceholder')}
        rows={3}
        className="rounded-none bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] px-2 py-1 text-xs text-[var(--color-text-primary)] resize-none"
      />

      <label className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)] select-none cursor-pointer">
        <input type="checkbox" checked={autoAdvance} onChange={onToggleAutoAdvance} className="accent-[var(--color-accent-vivid)]" />
        {t('gtSim.vd.annotate.autoAdvance')}
      </label>
    </div>
  );
});
