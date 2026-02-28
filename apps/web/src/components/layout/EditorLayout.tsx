import { useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { Node } from '@xyflow/react';
import { NodeEditorProvider, NodeEditor, TimelineView } from '@osce/node-editor';
import type { OsceNodeData } from '@osce/node-editor';
import { ScenarioViewer } from '@osce/3d-viewer';
import { HeaderToolbar } from './HeaderToolbar';
import { StatusBar } from './StatusBar';
import { GlassPanel } from '../apex/GlassPanel';
import { EntityListPanel } from '../panels/EntityListPanel';
import { TemplatePalettePanel } from '../panels/TemplatePalettePanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { ValidationPanel } from '../panels/ValidationPanel';
import { ErrorBoundary } from '../ErrorBoundary';
import { NodeEditorContextMenu } from '../node-editor/NodeEditorContextMenu';
import { ParameterDialog } from '../template/ParameterDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTranslation } from '@osce/i18n';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useTemplateDrop } from '../../hooks/use-template-drop';
import { useElementDelete } from '../../hooks/use-element-delete';

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
  const scenarioStoreApi = useScenarioStoreApi();

  // --- Selection sync ---
  const selectedElementIds = useEditorStore((s) => s.selection.selectedElementIds);
  const roadNetwork = useEditorStore((s) => s.roadNetwork);
  const preferences = useEditorStore((s) => s.preferences);
  const selectedEntityId = selectedElementIds.length === 1 ? selectedElementIds[0] : null;

  const handleSelectionChange = useCallback((ids: string[]) => {
    useEditorStore.getState().setSelection({ selectedElementIds: ids });
  }, []);

  const handleEntitySelect = useCallback((entityId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [entityId] });
  }, []);

  // --- Drag & Drop ---
  const {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragOver,
    droppedUseCase,
    dialogOpen: dropDialogOpen,
    handleDialogClose: handleDropDialogClose,
    handleApply: handleDropApply,
  } = useTemplateDrop();

  // --- Context Menu ---
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string | null;
  } | null>(null);

  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: null });
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node<OsceNodeData>) => {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    },
    [],
  );

  // --- Delete ---
  const { deleteElementById } = useElementDelete();

  const handleAddEntity = useCallback(() => {
    scenarioStoreApi.getState().addEntity({ name: 'NewEntity' });
  }, [scenarioStoreApi]);

  const handleAddStory = useCallback(() => {
    scenarioStoreApi.getState().addStory({ name: 'NewStory' });
  }, [scenarioStoreApi]);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      deleteElementById(nodeId);
      useEditorStore.getState().clearSelection();
    },
    [deleteElementById],
  );

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
              <NodeEditorProvider
                scenarioStore={scenarioStoreApi}
                selectedElementIds={selectedElementIds}
                onSelectionChange={handleSelectionChange}
              >
                <PanelGroup direction="vertical" className="enter d2">
                  {/* Node editor */}
                  <Panel defaultSize={65} minSize={20}>
                    <ErrorBoundary fallbackTitle="Node Editor Error">
                      <div
                        className={`h-full node-editor-grid ${isDragOver ? 'ring-2 ring-[var(--color-accent-1)] ring-inset' : ''}`}
                        onDragLeave={handleDragLeave}
                      >
                        <NodeEditor
                          className="h-full"
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onPaneContextMenu={handlePaneContextMenu}
                          onNodeContextMenu={handleNodeContextMenu}
                          deleteKeyCode={null}
                          disableBuiltinShortcuts
                        />
                      </div>
                    </ErrorBoundary>
                  </Panel>
                  <ResizeHandleH />
                  {/* Timeline */}
                  <Panel defaultSize={35} minSize={15}>
                    <GlassPanel className="h-full">
                      <ErrorBoundary fallbackTitle="Timeline Error">
                        <TimelineView className="h-full" />
                      </ErrorBoundary>
                    </GlassPanel>
                  </Panel>
                </PanelGroup>
              </NodeEditorProvider>
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
            <ErrorBoundary fallbackTitle="3D Viewer Error">
              <ScenarioViewer
                scenarioStore={scenarioStoreApi}
                openDriveDocument={roadNetwork}
                selectedEntityId={selectedEntityId}
                onEntitySelect={handleEntitySelect}
                onEntityFocus={handleEntitySelect}
                preferences={{
                  showGrid3D: preferences.showGrid3D,
                  showLaneIds: preferences.showLaneIds,
                  showRoadIds: preferences.showRoadIds,
                }}
                className="h-full w-full"
              />
            </ErrorBoundary>
          </div>
        </Panel>
      </PanelGroup>

      <StatusBar />

      {/* D&D Parameter Dialog */}
      <ParameterDialog
        open={dropDialogOpen}
        onOpenChange={handleDropDialogClose}
        useCase={droppedUseCase}
        onApply={handleDropApply}
      />

      {/* Context Menu */}
      {contextMenu && (
        <NodeEditorContextMenu
          position={contextMenu}
          onAddEntity={handleAddEntity}
          onAddStory={handleAddStory}
          onDeleteNode={handleDeleteNode}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
