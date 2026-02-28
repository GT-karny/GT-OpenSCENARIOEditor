import { useTranslation } from '@osce/i18n';
import { Separator } from '../ui/separator';
import { FileMenu } from '../toolbar/FileMenu';
import { UndoRedoButtons } from '../toolbar/UndoRedoButtons';
import { ValidateButton } from '../toolbar/ValidateButton';
import { LanguageToggle } from '../toolbar/LanguageToggle';
import { RoadNetworkButton } from '../toolbar/RoadNetworkButton';
import { SimulationButtons } from '../toolbar/SimulationButtons';

export function HeaderToolbar() {
  const { t } = useTranslation('common');

  return (
    <div role="banner" className="relative flex items-center h-[50px] px-6 gap-6 bg-[var(--color-glass-1)] backdrop-blur-[40px] saturate-[1.5] border-b border-[var(--color-glass-edge-mid)] header-glow z-10 enter">
      {/* Logo: pentagon mark + gradient text */}
      <div className="flex items-center gap-2">
        <div
          aria-label="APEX Logo"
          className="w-6 h-6 shrink-0"
          style={{
            background:
              'linear-gradient(135deg, var(--color-accent-vivid), var(--color-accent-2))',
            clipPath:
              'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
            filter: 'drop-shadow(0 0 5px var(--color-accent-glow))',
          }}
        />
        <span
          className="font-display text-[15px] font-bold tracking-[0.22em] uppercase"
          style={{
            background:
              'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-bright) 60%, var(--color-accent-2) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('app.title')}
        </span>
      </div>
      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <FileMenu />
      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <UndoRedoButtons />
      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <RoadNetworkButton />
      <ValidateButton />
      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <SimulationButtons />
      <div className="flex-1" />
      <LanguageToggle />
    </div>
  );
}
