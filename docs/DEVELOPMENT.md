# 開発ガイド

> セットアップ・起動・テスト・ビルド・トラブルシューティングを記載。
> アーキテクチャや設計思想は [ARCHITECTURE.md](./ARCHITECTURE.md)、コーディング規約は [CLAUDE.md](../CLAUDE.md) を参照。

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

# git submodule（OSI proto 定義、GT_Sim）
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

### モード 2: フロントエンド + WASM シミュレーション（バックエンド不要）

モード1の機能に加え、ブラウザ内でesminiシミュレーションを実行可能。
WASMモジュール (`apps/web/public/wasm/esmini.js`) をWeb Workerで実行し、バッチモードで全フレームを取得する。

```bash
pnpm dev
```

ブラウザで http://localhost:5173 を開き、シナリオを読み込んで「Run Simulation」ボタンを押す。
WASMファイルが `apps/web/public/wasm/esmini.js` に存在する必要がある。

### モード 3: フロントエンド + バックエンド（モック）

WebSocket 接続が有効になる。シミュレーションはモックデータ（Ego + Target の直進）で動作。

```bash
# ターミナル 1: バックエンド（port 3001）
pnpm dev:server

# ターミナル 2: フロントエンド（port 5173）
pnpm dev
```

### モード 4: フロントエンド + バックエンド + GT_Sim（フル構成）

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

Swagger UI: http://127.0.0.1:8000/docs（GT_Sim 起動時）

### モード 5: デスクトップアプリ（Electron）

Electronベースのデスクトップアプリケーション。ネイティブファイルシステムアクセスが可能。

```bash
# 開発モード
pnpm dev:desktop

# ビルド（配布用パッケージ作成）
pnpm build:desktop
```

---

## 環境変数

### apps/web

| 変数 | デフォルト | 説明 |
|:---|:---|:---|
| `VITE_WS_URL` | `ws://localhost:3001/ws` | バックエンド WebSocket URL |

### apps/server

| 変数 | デフォルト | 説明 |
|:---|:---|:---|
| `PORT` | `3001` | バックエンド HTTP/WebSocket ポート |
| `GT_SIM_URL` | (未設定 = モック) | GT_Sim REST API URL（例: `http://127.0.0.1:8000`） |
| `GT_SIM_GRPC` | `127.0.0.1:50051` | GT_Sim gRPC ホスト |

---

## プロジェクト構成

```
GT-OpenSCENARIOEditor/
├── apps/
│   ├── web/                  # React フロントエンド（Vite, port 5173）
│   ├── server/               # Node.js バックエンド（Fastify, port 3001）
│   └── desktop/              # Electron デスクトップアプリ
├── packages/
│   ├── shared/               # 型定義・インターフェース（全パッケージの契約）
│   ├── openscenario/         # .xosc パーサー / シリアライザ
│   ├── opendrive/            # .xodr パーサー / 道路形状計算
│   ├── scenario-engine/      # Zustand ストア / Command パターン
│   ├── node-editor/          # React Flow ノードエディタ
│   ├── 3d-viewer/            # Three.js 3D ビューア（道路/エンティティ/交通信号）
│   ├── esmini/               # GT_Sim API クライアント（REST + gRPC）
│   ├── mcp-server/           # MCP ツール（AI 連携）
│   ├── templates/            # ユースケーステンプレート
│   ├── i18n/                 # 翻訳（英語 / 日本語）
│   └── theme-apex/           # APEX デザインシステム（フォント / ガラスエフェクト）
├── docs/                     # アーキテクチャ、開発ガイド
└── Thirdparty/               # 外部リソース（submodule 含む）
    ├── open-simulation-interface/  # OSI proto 定義（git submodule）
    ├── GT_Sim/                    # GT_Sim ソース（git submodule）
    ├── GT_Sim_v0.6.0-rc/         # GT_Sim 実行環境
    ├── openscenario-v1.3.1/       # OpenSCENARIO v1.3.1 スキーマ（プライマリ）
    ├── openscenario-v1.2.0/       # OpenSCENARIO v1.2 スキーマ + サンプル（後方互換）
    └── esmini-demo_Windows/       # esmini テスト用リソース
```

各パッケージの詳細な責務は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照。

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

# Electron デスクトップアプリをビルド
pnpm build:desktop

# クリーンビルド
pnpm clean && pnpm build
```

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
モックで試す場合は環境変数なしでサーバーを起動する（モード 3）。
WASMモードで試す場合はバックエンド不要（モード 2）。

### WASM シミュレーションが動かない

`apps/web/public/wasm/esmini.js` が存在するか確認する。このファイルは Emscripten でビルドされた静的アセットで、リポジトリにコミット済み。

DevTools の Console / Network タブで `/wasm/esmini.js` のリクエストを確認。404 が返る場合はファイルが欠落している。

### WASM esmini のビルド方法

WASM リビルドが必要な場合（通常は不要）:

- **必要ツール**: Emscripten SDK (`emsdk`)
- **注意**: Windows では `cmd.exe` を使用すること（bash ではパス解決が失敗する）
- **ビルド元**: `Thirdparty/GT_Sim/EnvironmentSimulator/Libraries/esminiJS/`
- **出力先**: `apps/web/public/wasm/esmini.js`
- CI ではビルドしない（静的アセットとしてコミット）

### `pnpm install` 後に型エラーが出る

`packages/shared` のビルド成果物が必要。初回セットアップ時は `pnpm build` を先に実行する:

```bash
pnpm install
pnpm build    # shared を含む全パッケージをビルド
```

`pnpm build` の代わりに `pnpm build:shared` で shared のみビルドすることも可能。
