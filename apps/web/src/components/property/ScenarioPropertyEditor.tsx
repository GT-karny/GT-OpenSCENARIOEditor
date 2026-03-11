import { useTranslation } from '@osce/i18n';
import type {
  CatalogLocations,
  TrafficSignalController,
  TrafficSignalPhase,
  TrafficSignalState,
} from '@osce/shared';
import { FileText, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { XodrFilePicker } from './XodrFilePicker';

const CATALOG_KEYS = [
  'vehicleCatalog',
  'controllerCatalog',
  'pedestrianCatalog',
  'miscObjectCatalog',
  'environmentCatalog',
  'maneuverCatalog',
  'trajectoryCatalog',
  'routeCatalog',
] as const;

type CatalogKey = (typeof CATALOG_KEYS)[number];

export function ScenarioPropertyEditor() {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();
  const fileHeader = useScenarioStore((s) => s.document.fileHeader);
  const roadNetwork = useScenarioStore((s) => s.document.roadNetwork);
  const catalogLocations = useScenarioStore((s) => s.document.catalogLocations);

  const handleFileHeaderChange = (field: string, value: string | number) => {
    storeApi.getState().updateFileHeader({ [field]: value });
  };

  const handleLogicFileChange = (path: string) => {
    storeApi.getState().updateRoadNetwork({
      logicFile: path ? { filepath: path } : undefined,
    });
  };

  const handleSceneGraphFileChange = (path: string) => {
    storeApi.getState().updateRoadNetwork({
      sceneGraphFile: path ? { filepath: path } : undefined,
    });
  };

  const handleCatalogChange = (key: CatalogKey, directory: string) => {
    storeApi.getState().updateCatalogLocations({
      [key]: directory ? { directory } : undefined,
    } as Partial<CatalogLocations>);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 pb-2 border-b">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">{t('scenario.title')}</p>
      </div>

      <Accordion type="multiple" defaultValue={['fileHeader', 'roadNetwork']}>
        {/* File Header */}
        <AccordionItem value="fileHeader">
          <AccordionTrigger className="py-2 text-xs hover:no-underline">
            {t('scenario.fileHeader')}
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            <div className="space-y-2">
              <div className="grid gap-1">
                <Label className="text-xs">{t('scenario.description')}</Label>
                <Input
                  value={fileHeader.description}
                  onChange={(e) => handleFileHeaderChange('description', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid gap-1">
                <Label className="text-xs">{t('scenario.author')}</Label>
                <Input
                  value={fileHeader.author}
                  onChange={(e) => handleFileHeaderChange('author', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid gap-1">
                <Label className="text-xs">{t('scenario.date')}</Label>
                <Input
                  value={fileHeader.date}
                  onChange={(e) => handleFileHeaderChange('date', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs">{t('scenario.revMajor')}</Label>
                  <Input
                    value={String(fileHeader.revMajor)}
                    readOnly
                    className="h-8 text-sm bg-muted"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t('scenario.revMinor')}</Label>
                  <Input
                    value={String(fileHeader.revMinor)}
                    readOnly
                    className="h-8 text-sm bg-muted"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Road Network */}
        <AccordionItem value="roadNetwork">
          <AccordionTrigger className="py-2 text-xs hover:no-underline">
            {t('scenario.roadNetwork')}
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            <div className="space-y-2">
              <XodrFilePicker
                currentPath={roadNetwork.logicFile?.filepath ?? ''}
                onPathChange={handleLogicFileChange}
              />

              <div className="grid gap-1">
                <Label className="text-xs">{t('scenario.sceneGraphFile')}</Label>
                <Input
                  value={roadNetwork.sceneGraphFile?.filepath ?? ''}
                  onChange={(e) => handleSceneGraphFileChange(e.target.value)}
                  placeholder={t('scenario.notConfigured')}
                  className="h-8 text-sm"
                />
              </div>

              {/* Traffic Signal Controllers */}
              <TrafficSignalControllersSection
                controllers={roadNetwork.trafficSignals ?? []}
                onChange={(controllers) =>
                  storeApi.getState().updateRoadNetwork({ trafficSignals: controllers })
                }
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Catalog Locations */}
        <AccordionItem value="catalogLocations">
          <AccordionTrigger className="py-2 text-xs hover:no-underline">
            {t('scenario.catalogLocations')}
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            <div className="space-y-2">
              {CATALOG_KEYS.map((key) => (
                <div key={key} className="grid gap-1">
                  <Label className="text-xs">{t(`scenario.${key}`)}</Label>
                  <Input
                    value={catalogLocations[key]?.directory ?? ''}
                    onChange={(e) => handleCatalogChange(key, e.target.value)}
                    placeholder={t('scenario.notConfigured')}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/* ── Traffic Signal Controllers Section ────────────────────────── */

interface TrafficSignalControllersSectionProps {
  controllers: TrafficSignalController[];
  onChange: (controllers: TrafficSignalController[]) => void;
}

function TrafficSignalControllersSection({
  controllers,
  onChange,
}: TrafficSignalControllersSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addController = () => {
    const id = crypto.randomUUID();
    onChange([
      ...controllers,
      { id, name: `Controller_${controllers.length + 1}`, phases: [] },
    ]);
    setExpandedIds((prev) => new Set(prev).add(id));
  };

  const removeController = (id: string) => {
    onChange(controllers.filter((c) => c.id !== id));
  };

  const updateController = (
    id: string,
    updates: Partial<Omit<TrafficSignalController, 'id'>>,
  ) => {
    onChange(controllers.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Traffic Signal Controllers</Label>
        <button
          type="button"
          onClick={addController}
          className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3" />
          Add
        </button>
      </div>

      {controllers.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No controllers defined</p>
      )}

      {controllers.map((ctrl) => (
        <div key={ctrl.id} className="border rounded-sm">
          <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/50">
            <button
              type="button"
              onClick={() => toggle(ctrl.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expandedIds.has(ctrl.id) ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
            </button>
            <span className="flex-1 text-xs font-medium truncate">{ctrl.name}</span>
            <button
              type="button"
              onClick={() => removeController(ctrl.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3" />
            </button>
          </div>

          {expandedIds.has(ctrl.id) && (
            <div className="px-2 py-2 space-y-2">
              <div className="grid gap-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={ctrl.name}
                  onChange={(e) => updateController(ctrl.id, { name: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs">Delay (s)</Label>
                  <Input
                    type="number"
                    value={ctrl.delay ?? ''}
                    placeholder="--"
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      updateController(ctrl.id, { delay: isNaN(v) ? undefined : v });
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Reference</Label>
                  <Input
                    value={ctrl.reference ?? ''}
                    placeholder="--"
                    onChange={(e) =>
                      updateController(ctrl.id, {
                        reference: e.target.value || undefined,
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Phases */}
              <PhasesEditor
                phases={ctrl.phases}
                onChange={(phases) => updateController(ctrl.id, { phases })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Phases Editor ─────────────────────────────────────────────── */

interface PhasesEditorProps {
  phases: TrafficSignalPhase[];
  onChange: (phases: TrafficSignalPhase[]) => void;
}

function PhasesEditor({ phases, onChange }: PhasesEditorProps) {
  const addPhase = () => {
    onChange([
      ...phases,
      { name: `Phase_${phases.length + 1}`, duration: 30, trafficSignalStates: [] },
    ]);
  };

  const removePhase = (index: number) => {
    onChange(phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, updates: Partial<TrafficSignalPhase>) => {
    onChange(phases.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  return (
    <div className="space-y-1.5 pt-1 border-t">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Phases</span>
        <button
          type="button"
          onClick={addPhase}
          className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {phases.map((phase, pi) => (
        <div key={pi} className="border rounded-sm px-2 py-1.5 space-y-1.5 bg-background">
          <div className="flex items-center gap-1">
            <span className="flex-1 text-xs font-medium truncate">{phase.name}</span>
            <button
              type="button"
              onClick={() => removePhase(pi)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="grid gap-0.5">
              <Label className="text-[10px]">Name</Label>
              <Input
                value={phase.name}
                onChange={(e) => updatePhase(pi, { name: e.target.value })}
                className="h-6 text-xs"
              />
            </div>
            <div className="grid gap-0.5">
              <Label className="text-[10px]">Duration (s)</Label>
              <Input
                type="number"
                value={phase.duration}
                onChange={(e) =>
                  updatePhase(pi, { duration: parseFloat(e.target.value) || 0 })
                }
                className="h-6 text-xs"
              />
            </div>
          </div>

          {/* Signal States */}
          <SignalStatesEditor
            states={phase.trafficSignalStates}
            onChange={(states) => updatePhase(pi, { trafficSignalStates: states })}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Signal States Editor ──────────────────────────────────────── */

interface SignalStatesEditorProps {
  states: TrafficSignalState[];
  onChange: (states: TrafficSignalState[]) => void;
}

function SignalStatesEditor({ states, onChange }: SignalStatesEditorProps) {
  const addState = () => {
    onChange([...states, { trafficSignalId: '', state: '' }]);
  };

  const removeState = (index: number) => {
    onChange(states.filter((_, i) => i !== index));
  };

  const updateState = (index: number, updates: Partial<TrafficSignalState>) => {
    onChange(states.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  return (
    <div className="space-y-1 pt-1 border-t border-dashed">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Signal States</span>
        <button
          type="button"
          onClick={addState}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-2.5" />
        </button>
      </div>

      {states.map((st, si) => (
        <div key={si} className="flex items-center gap-1">
          <Input
            value={st.trafficSignalId}
            placeholder="signal ID"
            onChange={(e) => updateState(si, { trafficSignalId: e.target.value })}
            className="h-6 text-xs flex-1"
          />
          <Input
            value={st.state}
            placeholder="state"
            onChange={(e) => updateState(si, { state: e.target.value })}
            className="h-6 text-xs w-20"
          />
          <button
            type="button"
            onClick={() => removeState(si)}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className="size-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
