# Phase 4 Track L: WebSocket + シミュレーション連携

## 概要

`apps/web` と `apps/server` を WebSocket で接続し、ファイル I/O とシミュレーションのリアルタイム通信を実現する。
シミュレーション状態管理ストアを作成し、GT_Sim 経由のフレームデータを 3D ビューアに流す。

**Track K（コンポーネント統合）と並列開発可能。**
3D ビューアへの simulationFrames 接続は Track K 完了後にワイヤリングする。

---

## 必ず最初に読むファイル

- `docs/ARCHITECTURE.md` — 全体アーキテクチャ、esmini 連携フロー（§4）
- `docs/GT_SIM_API_REQUEST.md` — GT_Sim API 仕様
- `packages/shared/src/index.ts` — SimulationFrame, SimulationResult, SimulationStatus 型
- `apps/server/src/websocket/ws-handler.ts` — サーバー側 WebSocket ハンドラ
- `apps/server/src/websocket/ws-messages.ts` — メッセージ型定義
- `apps/server/src/services/simulation-service.ts` — サーバー側シミュレーション管理
- `apps/web/src/stores/editor-store.ts` — 既存の UI ストア
- `apps/web/src/components/layout/HeaderToolbar.tsx` — ツールバー（シミュレーション操作UI）

---

## 作業 1: WebSocket クライアント hook

**現状**: apps/web に WebSocket クライアントは存在しない

**サーバー側プロトコル** (`apps/server/src/websocket/ws-messages.ts`):
```
Client → Server:
  ping
  simulation:start  { scenarioXml: string }
  simulation:stop
  simulation:status
  file:open          { filePath: string, fileType: 'xosc' | 'xodr' }
  file:save          { filePath: string, document: ScenarioDocument }

Server → Client:
  pong
  simulation:frame    SimulationFrame
  simulation:complete SimulationResult
  simulation:status   { status: SimulationStatus }
  file:opened         ScenarioDocument | OpenDriveDocument
  file:saved          { success: boolean }
  file:error          { error: string }
```

**実装手順**:
1. `apps/web/src/hooks/use-websocket.ts` を作成
   - 接続管理（自動再接続、指数バックオフ）
   - ハートビート（ping/pong、30秒間隔）
   - 接続状態管理（connecting, connected, disconnected, error）
   - メッセージ型定義（サーバーの型と完全一致させる）
   - 型安全な send メソッド
   - メッセージハンドラの登録・解除 API
2. `apps/web/src/hooks/use-server-connection.ts` を作成（オプション）
   - `useWebSocket` を使い、上位レベルの API を提供
   - `openFile(path, type)`, `saveFile(path, doc)`, `startSimulation(xml)`, `stopSimulation()` 等
   - エラーハンドリング（接続切断時のフォールバック等）

**設計ポイント**:
- サーバーが起動していない場合は graceful に失敗（ファイル操作は File System Access API にフォールバック）
- WebSocket URL は環境変数 or 自動検出（`ws://localhost:${port}/ws`）
- React Strict Mode 対応（二重接続防止）

---

## 作業 2: シミュレーション状態ストア

**実装手順**:
1. `apps/web/src/stores/simulation-store.ts` を作成（Zustand）
   ```typescript
   interface SimulationState {
     status: 'idle' | 'running' | 'completed' | 'error';
     frames: SimulationFrame[];
     currentFrameIndex: number;
     error?: string;
     // 再生制御
     isPlaying: boolean;
     playbackSpeed: number; // 0.25x, 0.5x, 1x, 2x, 4x
     // アクション
     addFrame: (frame: SimulationFrame) => void;
     setCompleted: (result: SimulationResult) => void;
     setError: (error: string) => void;
     reset: () => void;
     // 再生アクション
     play: () => void;
     pause: () => void;
     seekTo: (frameIndex: number) => void;
     setSpeed: (speed: number) => void;
   }
   ```
2. WebSocket `simulation:frame` → `addFrame()` を呼ぶ
3. WebSocket `simulation:complete` → `setCompleted()` を呼ぶ
4. 再生ロジック: `requestAnimationFrame` ベースのフレーム進行
   - `isPlaying` 中は `currentFrameIndex` を `playbackSpeed` に応じて進める
   - 完了後のバッファ再生（シーク・速度変更対応）

**確認**: `packages/shared/src/types/` にある SimulationFrame / SimulationResult の型定義を参照

---

## 作業 3: ツールバー接続

**現状**: `HeaderToolbar.tsx` にはファイル操作とシミュレーション関連の UI が一部存在

**実装手順**:
1. シミュレーション開始ボタン追加（またはメニューから「Run Simulation」）
   - クリック → 現在のシナリオを `@osce/openscenario` で XML エクスポート → WebSocket `simulation:start` 送信
2. シミュレーション停止ボタン
   - クリック → WebSocket `simulation:stop` 送信
3. ステータス表示
   - `StatusBar.tsx` の「Ready」ドットをシミュレーション状態に連動
   - running: 黄色、completed: 緑、error: 赤
4. 再生コントロール（シミュレーション完了後）
   - Play/Pause、シークバー、速度セレクタ
   - タイムラインパネル or ビューアパネル内に配置

---

## 作業 4: ファイル I/O の WebSocket 対応

**現状**: apps/web は File System Access API でローカルファイルを直接読み書き

**方針**: WebSocket 経由のファイル I/O はサーバーモード時のみ使用
- スタンドアロン: 既存の File System Access API（変更なし）
- サーバー接続時: WebSocket `file:open` / `file:save` を使用
- 接続状態に応じて自動切替

**実装手順**:
1. `apps/web/src/hooks/use-file-operations.ts` を修正（既存ファイルがあれば）
   - WebSocket 接続時はサーバー経由のファイル操作を優先
   - 未接続時は File System Access API にフォールバック
2. サーバーから `file:opened` 受信 → scenario-store にドキュメントをセット
3. サーバーから `file:error` 受信 → エラートーストを表示

---

## 作業 5: 既知のテスト失敗修正

**対象**: `apps/web/src/stores/__tests__/use-scenario-store.test.tsx` の 3 件

**原因**: テスト環境（jsdom/happy-dom）で `document` が未定義

**修正方法**:
- `vitest.config.ts` の environment 設定を確認（`jsdom` or `happy-dom`）
- テストファイルに `@vitest-environment jsdom` アノテーション追加、またはグローバル設定
- 必要に応じて DOM 関連の mock を追加

---

## 修正対象ファイル

| ファイル | 作業 |
|---------|------|
| `apps/web/src/hooks/use-websocket.ts` | 新規作成 |
| `apps/web/src/hooks/use-server-connection.ts` | 新規作成（オプション） |
| `apps/web/src/stores/simulation-store.ts` | 新規作成 |
| `apps/web/src/components/layout/HeaderToolbar.tsx` | シミュレーション操作 UI 追加 |
| `apps/web/src/components/layout/StatusBar.tsx` | シミュレーション状態連動 |
| `apps/web/src/App.tsx` | WebSocket 初期化 |
| `apps/web/src/stores/__tests__/use-scenario-store.test.tsx` | DOM テスト修正 |

## 修正しないもの

- `apps/server/` — Phase 3 で完成済み（クライアント側のみ作業）
- `packages/esmini/` — サーバー側が使う（クライアントは直接触らない）
- コンポーネント統合（プレースホルダー差し替え）— Track K の担当

---

## 検証方法

1. `apps/server` を起動: `cd apps/server && pnpm dev`
2. `apps/web` を起動: `cd apps/web && pnpm dev`
3. ブラウザで確認:
   - ステータスバーに WebSocket 接続状態が表示される
   - シミュレーション開始 → サーバーログにリクエスト到着
   - フレーム受信 → simulation-store にフレーム蓄積（DevTools で確認）
   - シミュレーション完了 → 再生コントロール表示
   - ファイル操作がサーバー経由で動作（サーバー接続時）
4. サーバー未起動でも apps/web 単体で動作する（File System Access API フォールバック）
5. `pnpm test` — 504 テスト全合格（DOM 失敗 3 件を修正後）
6. `npx tsc --noEmit -p apps/web/tsconfig.json` — 型エラーなし
