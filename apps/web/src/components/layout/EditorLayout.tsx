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
              <div className="h-full bg-[var(--color-bg-deep)] enter-l">
                <Tabs defaultValue="entities" className="flex flex-col h-full">
                  <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
                    <TabsTrigger value="entities" className="apex-tab flex-1">
                      {t('panels.entityList')}
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="apex-tab flex-1">
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
              </div>
            </Panel>

            <ResizeHandle />

            {/* Center area */}
            <Panel defaultSize={55} minSize={30}>
              <PanelGroup direction="vertical" className="enter d2">
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
              <div className="h-full bg-[var(--color-bg-deep)] enter-r">
                <Tabs defaultValue="properties" className="flex flex-col h-full">
                  <TabsList className="bg-[var(--color-glass-1)] backdrop-blur-[28px] rounded-none p-0">
                    <TabsTrigger value="properties" className="apex-tab flex-1">
                      {t('panels.properties')}
                    </TabsTrigger>
                    <TabsTrigger value="validation" className="apex-tab flex-1">
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
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandleH />

        {/* 3D Viewer */}
        <Panel defaultSize={30} minSize={10}>
          <div className="h-full bg-[var(--color-bg-deep)] enter d5">
            <ViewerPlaceholder />
          </div>
        </Panel>
      </PanelGroup>

      <StatusBar />
    </div>
  );
}
