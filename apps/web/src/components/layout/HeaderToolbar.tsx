import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { Navigation, Home, TrafficCone } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { FileMenu } from '../toolbar/FileMenu';
import { UndoRedoButtons } from '../toolbar/UndoRedoButtons';
import { ValidateButton } from '../toolbar/ValidateButton';
import { LanguageToggle } from '../toolbar/LanguageToggle';
import { ScenarioPropertiesButton } from '../toolbar/ScenarioPropertiesButton';
import { SimulationButtons } from '../toolbar/SimulationButtons';
import { CatalogButton } from '../toolbar/CatalogButton';
import { useProjectStore } from '../../stores/project-store';
import { useEditorStore } from '../../stores/editor-store';
import type { EditorMode } from '../../stores/editor-store';
import { useAppLifecycle } from '../../hooks/use-app-lifecycle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { WindowControls } from './WindowControls';

export function HeaderToolbar() {
  const { t } = useTranslation('common');
  const currentProject = useProjectStore((s) => s.currentProject);
  const closeProjectStore = useProjectStore((s) => s.closeProject);
  const editorMode = useEditorStore((s) => s.editorMode);
  const { switchEditorMode, resetForNewFile, resetForNewRoadNetwork } = useAppLifecycle();

  const handleCloseProject = useCallback(() => {
    resetForNewFile();
    resetForNewRoadNetwork();
    closeProjectStore();
  }, [resetForNewFile, resetForNewRoadNetwork, closeProjectStore]);

  const headerRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 1300);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={headerRef}
      role="banner"
      className="relative flex items-center h-[50px] pl-3 pr-0 gap-3 bg-[var(--color-glass-1)] backdrop-blur-[40px] saturate-[1.5] border-b border-[var(--color-glass-edge-mid)] header-glow z-10 enter select-none overflow-hidden shrink-0 electron-drag"
    >
      {/* Home button */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              onClick={handleCloseProject}
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
      <div className="flex items-center gap-2 shrink-0">
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
          {editorMode === 'roadNetwork' ? t('app.titleRoadNetwork') : t('app.title')}
        </span>
      </div>

      {/* Mode tabs: Scenario / Road Network */}
      <Separator orientation="vertical" className="h-5 shrink-0 bg-[var(--color-glass-edge-bright)]" />
      <div className="flex items-center gap-0.5 shrink-0 rounded-md bg-[var(--color-glass-2)] p-0.5">
        {(['scenario', 'roadNetwork'] as EditorMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => switchEditorMode(mode)}
            className={`px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
              editorMode === mode
                ? 'bg-[var(--color-accent-1)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-3)]'
            }`}
          >
            {mode === 'scenario' ? 'Scenario' : 'Road Network'}
          </button>
        ))}
      </div>

      {/* Project name */}
      {currentProject && (
        <>
          <Separator orientation="vertical" className="h-5 shrink-0 bg-[var(--color-glass-edge-bright)]" />
          <span className="text-xs text-[var(--color-text-secondary)] font-medium truncate max-w-[200px]">
            {currentProject.meta.name}
          </span>
        </>
      )}

      <Separator orientation="vertical" className="h-5 shrink-0 bg-[var(--color-glass-edge-bright)]" />
      <FileMenu />
      <Separator orientation="vertical" className="h-5 shrink-0 bg-[var(--color-glass-edge-bright)]" />
      <UndoRedoButtons />
      <Separator orientation="vertical" className="h-5 shrink-0 bg-[var(--color-glass-edge-bright)]" />
      <ScenarioPropertiesButton compact={compact} />
      <CatalogButton compact={compact} />
      <ValidateButton compact={compact} />
      <Separator orientation="vertical" className="h-5 shrink-0 bg-[var(--color-glass-edge-bright)]" />
      <SimulationButtons compact={compact} />
      <Separator orientation="vertical" className="h-5 shrink-0 bg-[var(--color-glass-edge-bright)]" />
      <SignalTimelineToggle compact={compact} />

      {/* Spacer — reserves space for the absolute-positioned right controls */}
      <div className="flex-1 min-w-[180px] h-full" />

      {/* Right controls: absolute-positioned so they are never clipped by overflow-hidden */}
      <div className="absolute right-0 top-0 h-full flex items-center bg-[var(--color-glass-1)] z-10 electron-drag">
        <LanguageToggle />
        <WindowControls />
      </div>
    </div>
  );
}

function SignalTimelineToggle({ compact }: { compact: boolean }) {
  const show = useEditorStore((s) => s.showIntersectionTimeline);
  const toggle = useEditorStore((s) => s.toggleIntersectionTimeline);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={`h-7 gap-1.5 px-2 text-xs font-medium ${show ? 'text-[var(--color-accent)]' : ''}`}
          >
            <TrafficCone className="size-3.5" />
            {!compact && 'Signals'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Signal Timeline</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
