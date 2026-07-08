// --- Components ---
export { NodeEditorProvider } from './components/NodeEditorProvider.js';
export type { NodeEditorProviderProps } from './components/NodeEditorProvider.js';
export { NodeEditor } from './components/NodeEditor.js';
export type { NodeEditorProps } from './components/NodeEditor.js';

// --- Hooks ---
export { useEditorStore } from './hooks/use-editor-store.js';
export { useNodeSelection } from './hooks/use-node-selection.js';

// --- Store ---
export { createEditorStore } from './store/editor-store.js';
export type { NodeEditorState, EditorStoreApi } from './store/editor-store.js';

// --- Conversion utilities ---
export { documentToFlow } from './conversion/document-to-flow.js';
export type { ConversionResult, ConversionOptions } from './conversion/document-to-flow.js';
export { applyDagreLayout } from './conversion/layout.js';
export type { LayoutOptions } from './conversion/layout.js';

// --- Types ---
export type {
  OsceNodeType,
  OsceNodeData,
  StoryboardNodeData,
  InitNodeData,
  EntityNodeData,
  StoryNodeData,
  ActNodeData,
  ManeuverGroupNodeData,
  ManeuverNodeData,
  EventNodeData,
  ActionNodeData,
  TriggerNodeData,
  ConditionNodeData,
} from './types/node-types.js';
export type { OsceEdgeType, OsceEdgeData } from './types/edge-types.js';

// --- Utils ---
export { getActionTypeLabel, getActionSummary } from './utils/action-display.js';
export { getConditionTypeLabel, getConditionSummary, getTriggerSummary } from './utils/condition-display.js';
export {
  detectElementType,
  createElementTypeDetector,
  ELEMENT_TYPE_MATCHERS,
  PARENT_FIELD_TO_TYPE,
} from './utils/detect-element-type.js';
export type { ElementTypeMatcher } from './utils/detect-element-type.js';
export { getNodeColor } from './utils/color-map.js';
