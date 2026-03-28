import { useTranslation } from '@osce/i18n';
import type { CatalogLocations } from '@osce/shared';
import { FileText, TrafficCone } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
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
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-glass-edge)]">
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

              {/* Traffic Signal Controllers — summary + link to timeline */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-glass-edge)]">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Traffic Signal Controllers</Label>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {(roadNetwork.trafficSignals ?? []).length} defined
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => useEditorStore.getState().setShowIntersectionTimeline(true)}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] border border-[var(--color-glass-edge)] rounded-none transition-colors"
                >
                  <TrafficCone className="size-3" />
                  Open in Signal Timeline
                </button>
              </div>
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

