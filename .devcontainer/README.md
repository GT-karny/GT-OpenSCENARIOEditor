# Podman Dev Container セットアップ

OpenSCENARIO Editor を Podman + VSCode の Dev Container で開発するための環境です。
Windows / macOS / Linux のどこでも同じ環境で開発でき、**Linux コンテナ内から Windows 版 .exe をクロスビルド**できます。

## 1. 必要なもの

| ツール | 用途 |
|---|---|
| [Podman Desktop](https://podman-desktop.io/) | コンテナランタイム本体 |
| [Visual Studio Code](https://code.visualstudio.com/) | エディタ |
| [Dev Containers 拡張](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) | コンテナ内で VSCode を動かす拡張 |

### Windows での Podman 初期設定

Podman Desktop をインストール後、初回起動時に Podman Machine（WSL2 上の小さな Linux VM）が作られます。GUI の指示に従えば OK。

VSCode Dev Containers 拡張を Podman で動かすには、以下の設定が必要です：

1. VSCode の `settings.json` を開く（`Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)`）
2. 次の 1 行を追加：
   ```json
   "dev.containers.dockerPath": "podman"
   ```

これで Dev Containers 拡張が `docker` コマンドではなく `podman` を呼ぶようになります。

## 2. 起動手順

1. このリポジトリを VSCode で開く
2. 画面右下に「Reopen in Container」と通知が出るのでクリック
   （出ない場合は `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`）
3. **初回はイメージのダウンロード + ビルドで 5〜15 分かかります**（Wine 込みで約 2〜3GB）
4. コンテナ起動後、自動で `pnpm install` が走ります

完了したら VSCode のターミナルが Linux コンテナ内のシェルになっています。

## 3. 日常コマンド

すべて VSCode のターミナル（コンテナ内）で実行します。

```bash
# 開発サーバ（フロントエンド + バックエンド）
pnpm dev:full
# → http://localhost:5173 が自動で開きます

# 型チェック / lint / テスト
pnpm typecheck
pnpm lint
pnpm test

# Windows 版 .exe ビルド（Wine 経由でクロスビルド）
pnpm --filter @osce/desktop dist:win
# → apps/desktop/release/ に出力されます
```

## 4. 仕組みの解説

### なぜ Linux コンテナで Windows .exe が作れるのか

- ベースイメージ `electronuserland/builder:wine` には **Wine**（Linux 上で Windows バイナリを動かすツール）が入っています
- electron-builder はこの Wine を使って Windows 用パッケージング処理を実行します
- このプロジェクトは `electron-builder.yml` で `target: dir` + `sign: false` を指定しているため、署名や NSIS インストーラ生成といった Wine の鬼門を踏みません

### 速度の工夫：node_modules を named volume に逃がす

Windows ↔ WSL2 のファイルシステム橋渡し（9P プロトコル）は遅いため、`node_modules/` と pnpm のグローバルストアは Podman の named volume に置いています。

| パス | 場所 | 速度 |
|---|---|---|
| ソースコード（`apps/`, `packages/`） | Windows ホストから bind mount | やや遅い（編集には十分） |
| `node_modules/` | Podman の named volume | **速い** |
| pnpm store | Podman の named volume | **速い** |

これで `pnpm install` や Vite の HMR が実用速度で動きます。

## 5. コンテナの**外**でやること

| 作業 | 場所 | 理由 |
|---|---|---|
| Electron アプリの GUI 起動（`pnpm dev:desktop`） | ホスト（Windows） | コンテナから X11 フォワード設定が必要で煩雑 |
| WASM の再ビルド（Emscripten） | ホスト（`E:/emsdk`） | ツールチェインが重く頻度も低い |
| `Thirdparty/GT_Sim` の C++ ビルド | ホスト | 同上、頻度低 |

## 6. トラブルシュート

### 「Reopen in Container」を押しても何も起きない

VSCode の `dev.containers.dockerPath` 設定が `"podman"` になっているか確認してください。

### `pnpm install` がパーミッションエラー

`postCreateCommand` の chown が失敗した可能性があります。コンテナ内ターミナルで手動実行：
```bash
sudo chown -R vscode:vscode node_modules /home/vscode/.local/share/pnpm
pnpm install
```

### ビルドした .exe が壊れている / 起動しない

Wine クロスビルドの不具合を疑う前に、まずホスト Windows で `pnpm --filter @osce/desktop dist:win` を直接実行して再現するか確認してください。ホストで OK / コンテナで NG なら native module 関連を疑います。

### コンテナを作り直したい

VSCode で `Ctrl+Shift+P` → `Dev Containers: Rebuild Container`。
名前付きボリューム（`osce-node-modules`, `osce-pnpm-store`）も消したい場合は Podman Desktop の Volumes 画面か `podman volume rm osce-node-modules osce-pnpm-store` で削除してから再ビルド。
