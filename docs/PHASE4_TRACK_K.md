# Phase 4 Track K: コンポーネント統合 + UI インタラクション

## 概要

Phase 2 で開発した `@osce/node-editor` と `@osce/3d-viewer` を `apps/web` に統合する。
現在のプレースホルダーを実コンポーネントに差し替え、ストア連携・選択同期・インタラクション強化を行う。

**Phase 4 の最重要トラック。Track L（WebSocket）と並列開発可能。**

---

## 必ず最初に読むファイル

- `docs/ARCHITECTURE.md` — 全体アーキテクチャ
- `packages/shared/src/index.ts` — 型定義（契約の中核）
- `apps/web/src/components/layout/EditorLayout.tsx` — 現在のレイアウト（プレースホルダー使用箇所）
- `apps/web/src/stores/` — editor-store.ts, scenario-store-context.tsx, use-scenario-store.ts
- `apps/web/src/App.tsx` — アプリルート
- `packages/node-editor/src/index.ts` — node-editor 公開 API
- `packages/3d-viewer/src/index.ts` — 3d-viewer 公開 API

---

## 作業 1: NodeEditor 統合

**現状**: `NodeEditorPlaceholder.tsx` — アイコンとテキストのみ表示

**目標**: `@osce/node-editor` の実コンポーネントに差し替え

**公開API** (`packages/node-editor/src/index.ts`):
```typescript
// 必須ラッパー
import { NodeEditorProvider } from '@osce/node-editor';
// メインコンポーネント
import { NodeEditor } from '@osce/node-editor';
// Props: { onSelectionChange?: (ids: string[]) => void, className?: string }

// タイムラインも同パッケージ
import { TimelineView } from '@osce/node-editor';
// Props: { className?: string, pixelsPerSecond?: number }
```

**実装手順**:
1. `EditorLayout.tsx` で `NodeEditorProvider` を追加（`ScenarioStoreProvider` の中に配置）
   - `NodeEditorProvider` は内部で `createEditorStore()` を使用
   - scenario-engine の store と同期するため、`useScenarioStore` から `document` を渡す仕組みが必要
2. `NodeEditorPlaceholder` → `NodeEditor` に差し替え
   - `onSelectionChange` で `useEditorStore` の `setSelection` を呼ぶ
3. `TimelinePlaceholder` → `TimelineView` に差し替え
   - `NodeEditorProvider` スコープ内に配置（ノードエディタと同じ Provider）
4. `node-editor-grid` CSS クラスの扱い:
   - 現在 `NodeEditorPlaceholder` に適用中
   - React Flow のラッパーに移す、または `NodeEditor` の `className` に渡す

**注意**: `@osce/node-editor` の `useEditorStore` と `apps/web` の `useEditorStore` は別物（名前衝突）。apps/web 側は selection/preferences を管理、node-editor 側は nodes/edges を管理。混同しないこと。

**確認ファイル**:
- `packages/node-editor/src/components/NodeEditor.tsx`
- `packages/node-editor/src/components/TimelineView.tsx`
- `packages/node-editor/src/store/editor-store.ts` — node-editor 内部 store
- `packages/node-editor/src/hooks/` — useAutoLayout, useKeyboardShortcuts 等

---

## 作業 2: 3D Viewer 統合

**現状**: `ViewerPlaceholder.tsx` — アイコンとテキストのみ表示

**目標**: `@osce/3d-viewer` の `ScenarioViewer` に差し替え

**公開API** (`packages/3d-viewer/src/index.ts`):
```typescript
import { ScenarioViewer } from '@osce/3d-viewer';

interface ScenarioViewerProps {
  scenarioStore: StoreApi<ScenarioState>;  // vanilla Zustand store
  openDriveDocument: OpenDriveDocument | null;
  selectedEntityId?: string | null;
  onEntitySelect?: (entityId: string) => void;
  onEntityFocus?: (entityId: string) => void;
  simulationFrames?: SimulationFrame[];
  preferences?: Partial<EditorPreferences>;
  className?: string;
  style?: React.CSSProperties;
}
```

**実装手順**:
1. `ViewerPlaceholder` → `ScenarioViewer` に差し替え
2. Props 接続:
   - `scenarioStore`: `useScenarioStoreApi()` から取得（vanilla store）
   - `openDriveDocument`: `useEditorStore((s) => s.roadNetwork)` から取得
   - `selectedEntityId`: `useEditorStore((s) => s.selection.selectedElementIds[0])` から取得
   - `onEntitySelect`: `useEditorStore` の `setSelection` を呼ぶ
   - `simulationFrames`: Track L 完了後に simulation store から接続（初期は `undefined` でOK）
3. 現在の `bg-[var(--color-bg-deep)]` スタイルを維持

**確認ファイル**:
- `packages/3d-viewer/src/components/ScenarioViewer.tsx`
- `packages/3d-viewer/src/store/viewer-store.ts`

---

## 作業 3: Error Boundary

**実装方針**:
- `apps/web/src/components/ErrorBoundary.tsx` を作成
- 各パネル（NodeEditor, Viewer, Timeline）を個別に Error Boundary で wrap
- エラー表示: パネル内にフォールバックUI（エラーメッセージ + リトライボタン）
- Three.js / React Flow のクラッシュがアプリ全体を落とさないようにする
- APEX デザインに合わせたフォールバック表示（glass-1 背景、accent 色テキスト）

---

## 作業 4: UI インタラクション強化

### 4-1: ドラッグ&ドロップ（テンプレート → ノードエディタ）

- `TemplateCard.tsx` に `draggable` + `onDragStart` 追加（dataTransfer に useCase ID）
- ノードエディタ領域に `onDragOver` + `onDrop` ハンドラ
- ドロップ時に `useTemplateApply` の `applyTemplate` を呼ぶ
- ドラッグ中のビジュアルフィードバック（ゴースト要素、ドロップゾーンハイライト）

### 4-2: コンテキストメニュー（ノードエディタ内）

- shadcn/ui の `ContextMenu` コンポーネントを使用
- 右クリック位置に応じたメニュー:
  - 空白領域: 「ノード追加」サブメニュー（Story, Act, Event, Action 等）
  - ノード上: 「削除」「折りたたみ」「プロパティ表示」
  - エッジ上: 「接続解除」
- scenario-engine の対応する Command を実行

### 4-3: Delete キーによるノード/エンティティ削除

- `useEffect` で `keydown` リスナー（Delete / Backspace）
- 現在選択中の要素を `useEditorStore` から取得
- scenario-engine の `removeEntity` / `removeStory` / `removeEvent` 等を呼ぶ
- 確認ダイアログ（初回のみ or 常時）の検討
- React Flow の `onNodesDelete` / `onEdgesDelete` コールバックとの連携

---

## 修正対象ファイル

| ファイル | 作業 |
|---------|------|
| `apps/web/src/components/layout/EditorLayout.tsx` | Provider 追加、プレースホルダー差し替え |
| `apps/web/src/components/panels/NodeEditorPlaceholder.tsx` | 削除または書き換え |
| `apps/web/src/components/panels/ViewerPlaceholder.tsx` | 削除または書き換え |
| `apps/web/src/components/panels/TimelinePlaceholder.tsx` | 削除または書き換え |
| `apps/web/src/components/ErrorBoundary.tsx` | 新規作成 |
| `apps/web/src/components/template/TemplateCard.tsx` | D&D 追加 |
| `apps/web/src/App.tsx` | Provider 構成変更（必要に応じて） |

## 修正しないもの

- `packages/shared` — 契約は変更しない
- `packages/node-editor`, `packages/3d-viewer` — Phase 2 で完成済み（apps/web 側で統合するのみ）
- `apps/web/src/globals.css` — APEX v4 デザインは Phase 3 で修正済み
- WebSocket / シミュレーション関連 — Track L の担当

---

## 検証方法

1. `pnpm dev` でアプリ起動
2. ブラウザで確認:
   - ノードエディタに React Flow canvas が表示される
   - テンプレート適用 → ノードが生成される
   - 3D ビューアに Three.js canvas が表示される
   - タイムラインにトラックが表示される
   - エンティティ選択 → 全パネルで同期（ノードハイライト + 3D 選択 + プロパティ表示）
   - テンプレートカードをノードエディタにドラッグ&ドロップ → シナリオ適用
   - ノード右クリック → コンテキストメニュー表示
   - ノード選択 + Delete キー → 削除
   - パネルでエラー発生 → Error Boundary が表示（他パネルは影響なし）
3. `npx tsc --noEmit -p apps/web/tsconfig.json` — 型エラーなし
4. `pnpm test` — 既存テスト合格（リグレッションなし）
