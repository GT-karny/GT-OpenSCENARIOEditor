# Phase 4 Track M: E2E テスト + GT_Sim 統合 + ポリッシュ

## 概要

Track K（コンポーネント統合）と Track L（WebSocket + シミュレーション UI）の成果を統合した上で、
Playwright による E2E テスト、GT_Sim 実連携、翻訳・パフォーマンス・アクセシビリティのポリッシュを行う。

**前提**: Track K + Track L が main にマージ済みであること。

---

## 必ず最初に読むファイル

- `docs/ARCHITECTURE.md` — 全体アーキテクチャ
- `apps/web/src/components/layout/EditorLayout.tsx` — 統合後のレイアウト
- `apps/web/src/hooks/use-websocket.ts` — WebSocket クライアント
- `apps/web/src/stores/simulation-store.ts` — シミュレーション状態
- `apps/server/src/app.ts` — サーバー初期化（MockEsminiService → 実 GtSimService 切替対象）
- `packages/esmini/src/client/types.ts` — GtSimConfig（REST/gRPC デフォルト設定）
- `packages/i18n/src/locales/` — 翻訳リソース（en/, ja/）

### GT_Sim リファレンス

- `Thirdparty/GT_Sim_v0.6.0-rc/docs/web/api_reference.md` — REST API 全エンドポイント
- `Thirdparty/GT_Sim_v0.6.0-rc/docs/web/manual.md` — Web UI/API マニュアル（起動方法、連携フロー）
- `Thirdparty/GT_Sim_v0.6.0-rc/docs/integration/osi_integration.md` — OSI ストリーミング仕様

---

## GT_Sim アーキテクチャ（重要）

```
Thirdparty/GT_Sim_v0.6.0-rc/
├── GT_Sim.bat                    # 起動スクリプト（ダブルクリック or CLI）
├── server/gt_sim_web.exe         # Web サーバー（REST API + gRPC + Web UI 内包）
├── bin/GT_Sim.exe                # シミュレーションエンジン（gt_sim_web が subprocess 起動）
├── bin/GT_esminiLib.dll           # esmini ライブラリ
├── resources/xosc/               # シナリオ 78 ファイル（cut-in, lane_change 等）
├── resources/xodr/               # 道路 17 ファイル（straight_500m, fabriksgatan 等）
├── resources/models/             # 3D モデル
├── config/                       # 設定ファイル
└── docs/                         # ドキュメント
```

### 起動方法

```bash
# gt_sim_web.exe が REST API + gRPC + Web UI を全て内包
cd Thirdparty/GT_Sim_v0.6.0-rc
server/gt_sim_web.exe --host 127.0.0.1 --port 8000
```

### サービス一覧

| サービス | アドレス | 説明 |
|:---|:---|:---|
| REST API | `http://127.0.0.1:8000/api/` | シナリオ管理、シミュレーション実行、結果取得 |
| gRPC OSI | `0.0.0.0:50051` | GroundTruth ストリーミング（`@osce/esmini` が使用） |
| WebSocket OSI | `ws://127.0.0.1:8000/ws/osi/{job_id}` | ブラウザ向け OSI JSON ストリーミング |
| Swagger UI | `http://127.0.0.1:8000/docs` | API ドキュメント |

### エディタ連携フロー（gt_sim_web.exe 内部）

```
POST /api/scenarios/upload (XML) → scenario_id (tmp_xxx)
POST /api/simulations { scenario_id } → job_id
  → gt_sim_web.exe が bin/GT_Sim.exe をサブプロセスとして起動
  → GT_Sim.exe が OSI UDP 出力 → gt_sim_web.exe 内の OSI Bridge が受信
  → gRPC StreamGroundTruth() / WebSocket /ws/osi/{job_id} でクライアントに配信
```

### @osce/esmini デフォルト設定との対応

| @osce/esmini 設定 | デフォルト値 | GT_Sim 対応 |
|:---|:---|:---|
| `restBaseUrl` | `http://127.0.0.1:8000` | ✅ 一致 |
| `grpcHost` | `127.0.0.1:50051` | ✅ 一致 |
| `timeout` | `30000` | — |

---

## 作業 1: apps/server — MockEsminiService → 実 GtSimService 切替

### 目的

現在 `apps/server/src/app.ts` は `MockEsminiService` をハードコードしている。
環境変数ベースで実 `GtSimService`（`@osce/esmini`）に切り替え可能にする。

### 実装方針

```typescript
// apps/server/src/app.ts
import { GtSimService, DEFAULT_GT_SIM_CONFIG } from '@osce/esmini';
import { MockEsminiService } from './services/mock-esmini-service.js';

const esminiService = process.env.GT_SIM_URL
  ? new GtSimService({
      restBaseUrl: process.env.GT_SIM_URL,          // e.g. http://127.0.0.1:8000
      grpcHost: process.env.GT_SIM_GRPC ?? '127.0.0.1:50051',
      timeout: 30_000,
    })
  : new MockEsminiService();
```

### 環境変数

| 変数 | デフォルト | 説明 |
|:---|:---|:---|
| `GT_SIM_URL` | (未設定 = モック) | GT_Sim REST API ベース URL |
| `GT_SIM_GRPC` | `127.0.0.1:50051` | GT_Sim gRPC ホスト |

### .env.example

`apps/server/.env.example` を作成:

```env
# GT_Sim 連携（未設定時はモックサービスを使用）
# GT_SIM_URL=http://127.0.0.1:8000
# GT_SIM_GRPC=127.0.0.1:50051
```

---

## 作業 2: Playwright E2E テストセットアップ

### セットアップ手順

1. `apps/web` に Playwright を追加:
   ```bash
   cd apps/web && pnpm add -D @playwright/test
   npx playwright install chromium
   ```
2. `apps/web/playwright.config.ts` を作成:
   - baseURL: `http://localhost:5173`
   - webServer: `pnpm dev`（テスト実行前に自動起動）
   - ブラウザ: Chromium のみ
   - projects: `default`（モック）+ `gt-sim`（実 GT_Sim、条件付き）
3. `apps/web/e2e/` ディレクトリを作成

### GT_Sim 自動起動（globalSetup）

`apps/web/e2e/global-setup.ts` を作成:

```typescript
import { execFile } from 'child_process';
import { resolve } from 'path';

const GT_SIM_EXE = resolve(__dirname, '../../../Thirdparty/GT_Sim_v0.6.0-rc/server/gt_sim_web.exe');

export default async function globalSetup() {
  if (!process.env.USE_GT_SIM) return;

  // GT_Sim を起動、ヘルスチェック待機
  const proc = execFile(GT_SIM_EXE, ['--host', '127.0.0.1', '--port', '8000'], {
    cwd: resolve(__dirname, '../../../Thirdparty/GT_Sim_v0.6.0-rc'),
  });

  // GET /api/health が返るまで待機（最大 15 秒）
  await waitForHealth('http://127.0.0.1:8000/api/health', 15_000);

  // globalTeardown でプロセスを停止するため保存
  (globalThis as any).__GT_SIM_PROC__ = proc;
}

export async function globalTeardown() {
  const proc = (globalThis as any).__GT_SIM_PROC__;
  if (proc) proc.kill();
}
```

### 実行コマンド

```bash
# モックベース（CI 向け、GT_Sim 不要）
cd apps/web && npx playwright test

# GT_Sim 連携テスト込み（ローカル向け）
cd apps/web && USE_GT_SIM=true npx playwright test
```

---

## 作業 3: E2E テストシナリオ（モックベース）

以下のテストは GT_Sim 不要。`apps/web/e2e/` に作成:

### 3-1: 基本表示テスト (`app-startup.spec.ts`)
- アプリ起動 → ヘッダーが表示される（ロゴ、ナビ項目）
- ステータスバーが表示される（「Ready」テキスト）
- 4 パネル（NodeEditor, Viewer, Timeline, Sidebar）が表示される
- APEX v4 デザイン: ペンタゴンロゴ、グロウディバイダーの存在確認

### 3-2: エンティティ操作テスト (`entity-crud.spec.ts`)
- 「+」ボタン → AddEntityDialog 表示
- エンティティ追加 → リストに表示
- エンティティ選択 → プロパティパネルに反映
- エンティティ削除 → リストから消える
- ノードエディタ / 3D ビューアでの選択同期

### 3-3: テンプレート適用テスト (`template-apply.spec.ts`)
- テンプレートパレットにカテゴリが表示される
- テンプレート選択 → パラメータダイアログ表示
- パラメータ設定 → 適用 → ノードエディタにノード生成
- ドラッグ&ドロップでの適用

### 3-4: ファイル操作テスト (`file-operations.spec.ts`)
- .xosc インポート → パース → ノード表示
  - テストデータ: `Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc`
- .xosc エクスポート → ファイル保存
- Undo/Redo（Ctrl+Z / Ctrl+Y）
- .xodr 読み込み → 3D ビューアに道路描画
  - テストデータ: `Thirdparty/GT_Sim_v0.6.0-rc/resources/xodr/straight_500m.xodr`

### 3-5: 言語切替テスト (`i18n.spec.ts`)
- EN ↔ JA 切替 → UI テキストが切り替わる
- ヘッダー、パネルタブ、ダイアログのラベルが正しい言語で表示

### 3-6: バリデーションテスト (`validation.spec.ts`)
- バリデーション実行 → 結果パネルに表示
- エラー/警告のバッジ表示
- エラー項目クリック → 該当要素にフォーカス

---

## 作業 4: GT_Sim 統合テスト（USE_GT_SIM=true のみ実行）

`apps/web/e2e/gt-sim/` ディレクトリに作成。`test.skip(!process.env.USE_GT_SIM)` でガード。

### 4-1: GT_Sim 接続テスト (`gt-sim-connection.spec.ts`)
- GT_Sim REST API ヘルスチェック（GET /api/health → `{"status": "ok"}`）
- シナリオ一覧取得（GET /api/scenarios）→ 78+ シナリオが返る
- apps/server が `GT_SIM_URL` 設定時に実 GtSimService を使用していることを確認

### 4-2: シミュレーション実行テスト (`gt-sim-simulation.spec.ts`)

GT_Sim 内蔵シナリオを使用したフルパステスト:

```
テストシナリオ: cut-in_simple.xosc（短時間で完了する単純なシナリオ）
道路: straight_500m.xodr

フロー:
1. エディタ UI からシミュレーション実行ボタンクリック
2. apps/server → GT_Sim REST API（POST /api/simulations）
3. GT_Sim.exe がシミュレーション実行
4. gRPC GroundTruth ストリーミング → apps/server → WebSocket → ブラウザ
5. SimulationTimeline にフレームが表示される
6. シミュレーション完了 → 再生 UI でシーク・速度変更が動作する
```

### 4-3: シナリオアップロードテスト (`gt-sim-upload.spec.ts`)

エディタで作成したシナリオを GT_Sim にアップロードして実行:

```
フロー:
1. エディタ上でテンプレート（CutIn）を適用
2. シリアライズ → XOSC XML 生成
3. POST /api/scenarios/upload → tmp_xxx scenario_id 取得
4. POST /api/simulations { scenario_id: "tmp_xxx" } → シミュレーション実行
5. 完了 → GET /api/results/{job_id}/metrics → メトリクス確認
```

### テストで使用するシナリオ・道路ファイル

| ファイル | パス | 用途 |
|:---|:---|:---|
| `cut-in_simple.xosc` | `Thirdparty/GT_Sim_v0.6.0-rc/resources/xosc/` | 短時間シミュレーションテスト |
| `lane_change_simple.xosc` | 同上 | 車線変更テスト |
| `straight_500m.xosc` | 同上 | 直進テスト |
| `straight_500m.xodr` | `Thirdparty/GT_Sim_v0.6.0-rc/resources/xodr/` | 道路描画テスト |
| `fabriksgatan.xodr` | 同上 | 複雑道路テスト |

---

## 作業 5: 統合テスト（Vitest）

### 5-1: ラウンドトリップテスト
- `Thirdparty/openscenario-v1.2.0/Examples/` の .xosc ファイルを使用
- 読み込み → 内部モデル → エクスポート → 再読み込み → 比較
- 既存の `packages/openscenario` テストを拡張

### 5-2: MCP 統合テスト
- `@osce/mcp-server` のツールを scenario-engine に接続
- 代表的なツール呼び出し → ストア状態の変更を確認:
  - `create_scenario` → 新規シナリオ作成
  - `add_entity` → エンティティ追加
  - `apply_template` → テンプレート適用
  - `export_xosc` → XML 出力
- テスト環境: Vitest + scenario-engine の実インスタンス

### 5-3: WebSocket 統合テスト
- apps/server 起動 → WebSocket 接続
- ファイルオープン → サーバーからレスポンス → クライアントにドキュメント到着
- シミュレーション開始 → フレーム受信 → 完了通知
- テスト環境: Vitest + 実サーバー or モックサーバー

---

## 作業 6: ポリッシュ

### 6-1: 日本語翻訳レビュー
- Phase 3〜4 で追加した UI テキストの翻訳漏れチェック
- `packages/i18n/src/locales/ja/` の各 namespace を確認
- 新規キー: シミュレーション操作、WebSocket 状態、Error Boundary メッセージ
- 技術用語の統一（シナリオ、エンティティ、マニューバ等）

### 6-2: パフォーマンス最適化
- 大規模シナリオ（50+ エンティティ、100+ ノード）での描画性能
- React Flow: ノード数が多い場合の re-render 最適化（memo, useMemo）
- Three.js: エンティティ数が多い場合のインスタンシング検討
- Zustand: セレクタの粒度確認（不要な re-render 防止）

### 6-3: アクセシビリティ
- キーボードナビゲーション（Tab, Enter, Escape）
- ARIA ラベル（パネル、ボタン、フォーム要素）
- フォーカスインジケーター（APEX デザインに合わせた accent 色リング）

### 6-4: レスポンシブ + エッジケース
- パネルサイズ変更時のレイアウト崩れチェック
- 最小サイズでの表示確認
- ブラウザリサイズ対応

---

## 修正対象ファイル

| ファイル | 作業 |
|---------|------|
| `apps/server/src/app.ts` | MockEsminiService → GtSimService 条件切替 |
| `apps/server/.env.example` | 新規作成（GT_SIM_URL, GT_SIM_GRPC） |
| `apps/web/playwright.config.ts` | 新規作成 |
| `apps/web/e2e/global-setup.ts` | 新規作成（GT_Sim 自動起動） |
| `apps/web/e2e/*.spec.ts` | 新規作成（6 テストファイル） |
| `apps/web/e2e/gt-sim/*.spec.ts` | 新規作成（3 テストファイル、GT_Sim 連携） |
| `apps/web/package.json` | `@playwright/test` devDependency 追加 |
| `packages/i18n/src/locales/ja/**/*.json` | 翻訳漏れ修正 |
| `packages/i18n/src/locales/en/**/*.json` | 新規キー追加（必要に応じて） |
| 各コンポーネント | ARIA ラベル追加、パフォーマンス最適化 |

## 修正しないもの

- `packages/shared` — 契約は変更しない
- `packages/openscenario`, `packages/opendrive`, `packages/scenario-engine` — Phase 1 で完成済み
- `packages/node-editor`, `packages/3d-viewer` — Phase 2 で完成済み
- `packages/mcp-server` — Phase 3 で完成済み
- `packages/esmini` — Phase 3 で完成済み（GtSimService の API 自体は変更不要）
- `apps/web/src/globals.css` — APEX v4 デザインは Phase 3 で修正済み
- `Thirdparty/GT_Sim_v0.6.0-rc/` — GT_Sim 本体は変更しない（テストデータとして参照のみ）

---

## 検証方法

1. **E2E テスト（モック）**: `cd apps/web && npx playwright test`
   - 全テストシナリオが合格（GT_Sim 不要）
   - テストレポート: `apps/web/playwright-report/`
2. **E2E テスト（GT_Sim）**: `cd apps/web && USE_GT_SIM=true npx playwright test`
   - GT_Sim 連携テストが合格（`Thirdparty/GT_Sim_v0.6.0-rc/` が必要）
   - CI では skip 可能
3. **ユニット + 統合テスト**: `pnpm test`
   - 全テスト合格（504+ テスト）
4. **型チェック**: `npx tsc --noEmit -p apps/web/tsconfig.json`
5. **GT_Sim 接続確認**:
   ```bash
   # GT_Sim 起動
   cd Thirdparty/GT_Sim_v0.6.0-rc && server/gt_sim_web.exe --host 127.0.0.1 --port 8000
   # 別ターミナル: ヘルスチェック
   curl http://127.0.0.1:8000/api/health
   # apps/server を GT_Sim 接続モードで起動
   GT_SIM_URL=http://127.0.0.1:8000 pnpm --filter @osce/server dev
   ```
6. **翻訳チェック**: EN/JA 切替で全画面のテキストが正しく表示
7. **パフォーマンス**: 大規模シナリオで 60fps 維持（DevTools Performance パネル）
