import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { HeaderToolbar } from './HeaderToolbar';
import { StatusBar } from './StatusBar';
import { GlassPanel } from '../apex/GlassPanel';
import { EntityListPanel } from '../panels/EntityListPanel';
import { TemplatePalettePanel } from '../panels/TemplatePalettePanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { ValidationPanel } from '../panels/ValidationPanel';
import { NodeEditorPlaceholder } from '../panels/NodeEditorPlaceholder';
import { TimelinePlaceholder } from '../panels/TimelinePlaceholder';
import { ViewerPlaceholder } from '../panels/ViewerPlaceholder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTranslation } from '@osce/i18n';

function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-[1px] divider-glow-v hover:w-[3px] transition-all data-[resize-handle-active]:w-[3px]" />
  );
}

function ResizeHandleH() {
  return (
    <PanelResizeHandle className="h-[1px] divider-glow hover:h-[3px] transition-all data-[resize-handle-active]:h-[3px]" />
  );
}

export function EditorLayout() {
  const { t } = useTranslation('common');

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <HeaderToolbar />

      <PanelGroup direction="vertical" className="flex-1">
        {/* Main area */}
        <Panel defaultSize={70} minSize={30}>
          <PanelGroup direction="horizontal">
            {/* Left sidebar */}
            <Panel defaultSize={20} minSize={12} maxSize={35}>
              <GlassPanel className="h-full">
                <Tabs defaultValue="entities" className="flex flex-col h-full">
                  <TabsList className="mx-2 mt-1">
                    <TabsTrigger value="entities" className="text-xs">
                      {t('panels.entityList')}
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="text-xs">
                      {t('panels.templates')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="entities" className="flex-1 overflow-hidden mt-0">
                    <EntityListPanel />
                  </TabsContent>
                  <TabsContent value="templates" className="flex-1 overflow-hidden mt-0">
                    <TemplatePalettePanel />
                  </TabsContent>
                </Tabs>
              </GlassPanel>
            </Panel>

            <ResizeHandle />

            {/* Center area */}
            <Panel defaultSize={55} minSize={30}>
              <PanelGroup direction="vertical">
                {/* Node editor */}
                <Panel defaultSize={65} minSize={20}>
                  <NodeEditorPlaceholder />
                </Panel>
                <ResizeHandleH />
                {/* Timeline */}
                <Panel defaultSize={35} minSize={15}>
                  <GlassPanel className="h-full">
                    <TimelinePlaceholder />
                  </GlassPanel>
                </Panel>
              </PanelGroup>
            </Panel>

            <ResizeHandle />

            {/* Right sidebar */}
            <Panel defaultSize={25} minSize={15} maxSize={40}>
              <GlassPanel className="h-full">
                <Tabs defaultValue="properties" className="flex flex-col h-full">
                  <TabsList className="mx-2 mt-1">
                    <TabsTrigger value="properties" className="text-xs">
                      {t('panels.properties')}
                    </TabsTrigger>
                    <TabsTrigger value="validation" className="text-xs">
                      {t('panels.validation')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="properties" className="flex-1 overflow-hidden mt-0">
                    <PropertyPanel />
                  </TabsContent>
                  <TabsContent value="validation" className="flex-1 overflow-hidden mt-0">
                    <ValidationPanel />
                  </TabsContent>
                </Tabs>
              </GlassPanel>
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandleH />

        {/* 3D Viewer */}
        <Panel defaultSize={30} minSize={10}>
          <GlassPanel variant="elevated" className="h-full">
            <ViewerPlaceholder />
          </GlassPanel>
        </Panel>
      </PanelGroup>

      <StatusBar />
    </div>
  );
}
