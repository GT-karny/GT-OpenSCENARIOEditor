import { useTranslation } from '@osce/i18n';
import { Navigation, Home } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { FileMenu } from '../toolbar/FileMenu';
import { UndoRedoButtons } from '../toolbar/UndoRedoButtons';
import { ValidateButton } from '../toolbar/ValidateButton';
import { LanguageToggle } from '../toolbar/LanguageToggle';
import { RoadNetworkButton } from '../toolbar/RoadNetworkButton';
import { SimulationButtons } from '../toolbar/SimulationButtons';
import { CatalogButton } from '../toolbar/CatalogButton';
import { useProjectStore } from '../../stores/project-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function HeaderToolbar() {
  const { t } = useTranslation('common');
  const currentProject = useProjectStore((s) => s.currentProject);
  const closeProject = useProjectStore((s) => s.closeProject);

  return (
    <div role="banner" className="relative flex items-center h-[50px] px-6 gap-6 bg-[var(--color-glass-1)] backdrop-blur-[40px] saturate-[1.5] border-b border-[var(--color-glass-edge-mid)] header-glow z-10 enter">
      {/* Home button */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              onClick={closeProject}
            >
              <Home size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Home</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Logo: Navigation icon + gradient text */}
      <div className="flex items-center gap-2">
        <Navigation
          aria-label="Logo"
          size={22}
          strokeWidth={2}
          className="shrink-0"
          style={{
            stroke: 'url(#logo-gradient)',
            filter: 'drop-shadow(0 0 5px var(--color-accent-glow))',
          }}
        />
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent-vivid)" />
              <stop offset="100%" stopColor="var(--color-accent-2)" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className="font-display text-[15px] font-bold tracking-[0.12em]"
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

      {/* Project name */}
      {currentProject && (
        <>
          <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
          <span className="text-xs text-[var(--color-text-secondary)] font-medium truncate max-w-[200px]">
            {currentProject.meta.name}
          </span>
        </>
      )}

      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <FileMenu />
      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <UndoRedoButtons />
      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <RoadNetworkButton />
      <CatalogButton />
      <ValidateButton />
      <Separator orientation="vertical" className="h-5 bg-[var(--color-glass-edge-bright)]" />
      <SimulationButtons />
      <div className="flex-1" />
      <LanguageToggle />
    </div>
  );
}
