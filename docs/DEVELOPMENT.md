# 開発ガイド

## 前提条件

| ツール | バージョン |
|:---|:---|
| Node.js | 20.0.0 以上 |
| pnpm | 9.0.0 以上 |

```bash
# pnpm が未インストールの場合
corepack enable && corepack prepare pnpm@latest --activate
```

---

## セットアップ

```bash
git clone <repo-url>
cd GT-OpenSCENARIOEditor

# git submodule（OSI proto 定義）
git submodule update --init

# OSI proto テンプレートから osi_version.proto を生成（初回のみ）
cd Thirdparty/open-simulation-interface
sed 's/@VERSION_MAJOR@/3/;s/@VERSION_MINOR@/5/;s/@VERSION_PATCH@/0/' osi_version.proto.in > osi_version.proto
cd ../..

# 依存インストール + 全パッケージビルド
pnpm install
pnpm build
```

---

## 起動方法

### モード 1: フロントエンドのみ（最小構成）

バックエンド不要。ファイル操作は File System Access API（ブラウザ側）で動作。
シミュレーション機能は使用不可。

```bash
pnpm dev
```

ブラウザで http://localhost:5173 を開く。

### モード 2: フロントエンド + バックエンド（モック）

WebSocket 接続が有効になる。シミュレーションはモックデータ（Ego + Target の直進）で動作。

```bash
# ターミナル 1: バックエンド（port 3001）
pnpm dev:server

# ターミナル 2: フロントエンド（port 5173）
pnpm dev
```

### モード 3: フロントエンド + バックエンド + GT_Sim（フル構成）

GT_Sim と連携し、実際のシミュレーションを実行。gRPC で OSI フレームをリアルタイム受信。

```bash
# ターミナル 1: GT_Sim（port 8000 + gRPC 50051）
cd Thirdparty/GT_Sim_v0.6.0-rc
server\gt_sim_web.exe --host 127.0.0.1 --port 8000

# ターミナル 2: バックエンド（GT_Sim 接続モード）
# PowerShell:
$env:GT_SIM_URL="http://127.0.0.1:8000"; pnpm dev:server
# bash:
GT_SIM_URL=http://127.0.0.1:8000 pnpm dev:server

# ターミナル 3: フロントエンド
pnpm dev
```

---

## 環境変数

### apps/server

| 変数 | デフォルト | 説明 |
|:---|:---|:---|
| `PORT` | `3001` | バックエンド HTTP/WebSocket ポート |
| `GT_SIM_URL` | (未設定 = モック) | GT_Sim REST API URL（例: `http://127.0.0.1:8000`） |
| `GT_SIM_GRPC` | `127.0.0.1:50051` | GT_Sim gRPC ホスト |

### apps/web

| 変数 | デフォルト | 説明 |
|:---|:---|:---|
| `VITE_WS_URL` | `ws://localhost:3001/ws` | バックエンド WebSocket URL |

---

## テスト

### ユニットテスト

```bash
# 全パッケージ
pnpm test

# 特定パッケージ
pnpm --filter @osce/openscenario test
pnpm --filter @osce/scenario-engine test
```

### 型チェック

```bash
pnpm typecheck
```

### E2E テスト（Playwright）

```bash
cd apps/web

# Chromium インストール（初回のみ）
npx playwright install chromium

# モックベーステスト（バックエンド + フロントエンドを自動起動）
npx playwright test

# GT_Sim 連携テスト（GT_Sim が起動済みであること）
# PowerShell:
$env:USE_GT_SIM="true"; npx playwright test
# bash:
USE_GT_SIM=true npx playwright test
```

### リント + フォーマット

```bash
pnpm lint
pnpm format
```

---

## ビルド

```bash
# 全パッケージ + アプリをビルド
pnpm build

# クリーンビルド
pnpm clean && pnpm build
```

---

## プロジェクト構成

```
GT-OpenSCENARIOEditor/
├── apps/
│   ├── web/                  # React フロントエンド（Vite, port 5173）
│   └── server/               # Node.js バックエンド（Fastify, port 3001）
├── packages/
│   ├── shared/               # 型定義・インターフェース（全パッケージの契約）
│   ├── openscenario/         # .xosc パーサー / シリアライザ
│   ├── opendrive/            # .xodr パーサー / 道路形状計算
│   ├── scenario-engine/      # Zustand ストア / Command パターン
│   ├── node-editor/          # React Flow ノードエディタ
│   ├── 3d-viewer/            # Three.js 3D ビューア
│   ├── esmini/               # GT_Sim API クライアント（REST + gRPC）
│   ├── mcp-server/           # MCP ツール（AI 連携）
│   ├── templates/            # ユースケーステンプレート
│   └── i18n/                 # 翻訳（英語 / 日本語）
├── docs/                     # アーキテクチャ、プロンプト、モックアップ
└── Thirdparty/               # 外部リソース（.gitignore、submodule 除く）
    ├── open-simulation-interface/  # OSI proto 定義（git submodule）
    ├── openscenario-v1.2.0/       # OpenSCENARIO スキーマ + サンプル
    ├── esmini-demo_Windows/       # esmini テスト用リソース
    └── GT_Sim_v0.6.0-rc/         # GT_Sim 実行環境
```

---

## GT_Sim アーキテクチャ

```
gt_sim_web.exe (port 8000)     ← REST API + gRPC サーバー + Web UI
    └── bin/GT_Sim.exe         ← シミュレーションエンジン（サブプロセスとして起動）

エディタ連携フロー:
  POST /api/scenarios/upload (XML)  →  scenario_id
  POST /api/simulations             →  job_id + GT_Sim.exe 起動
  gRPC StreamGroundTruth()           →  OSI フレーム受信
  WebSocket /ws/osi/{job_id}         →  ブラウザ向け JSON ストリーム
```

Swagger UI: http://127.0.0.1:8000/docs（GT_Sim 起動時）

---

## よくある問題

### `osi_version.proto not found` 警告

OSI submodule の `osi_version.proto.in` はテンプレートファイル。手動生成が必要:

```bash
cd Thirdparty/open-simulation-interface
sed 's/@VERSION_MAJOR@/3/;s/@VERSION_MINOR@/5/;s/@VERSION_PATCH@/0/' osi_version.proto.in > osi_version.proto
```

### PowerShell で環境変数付きコマンドが動かない

PowerShell では `VAR=value command` 構文は使えない。代わりに:

```powershell
$env:GT_SIM_URL="http://127.0.0.1:8000"; pnpm dev:server
```

### `Run Simulation` ボタンで "No simulation is running"

GT_Sim が起動していない、または `GT_SIM_URL` が未設定。
モックで試す場合は環境変数なしでサーバーを起動する（モード 2）。
