import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { HeaderToolbar } from './HeaderToolbar';
import { StatusBar } from './StatusBar';
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
    <PanelResizeHandle className="w-1 hover:bg-ring/50 transition-colors data-[resize-handle-active]:bg-ring" />
  );
}

function ResizeHandleH() {
  return (
    <PanelResizeHandle className="h-1 hover:bg-ring/50 transition-colors data-[resize-handle-active]:bg-ring" />
  );
}

export function EditorLayout() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <HeaderToolbar />

      <PanelGroup direction="vertical" className="flex-1">
        {/* Main area */}
        <Panel defaultSize={70} minSize={30}>
          <PanelGroup direction="horizontal">
            {/* Left sidebar */}
            <Panel defaultSize={20} minSize={12} maxSize={35}>
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
                  <TimelinePlaceholder />
                </Panel>
              </PanelGroup>
            </Panel>

            <ResizeHandle />

            {/* Right sidebar */}
            <Panel defaultSize={25} minSize={15} maxSize={40}>
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
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandleH />

        {/* 3D Viewer */}
        <Panel defaultSize={30} minSize={10}>
          <ViewerPlaceholder />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </div>
  );
}
