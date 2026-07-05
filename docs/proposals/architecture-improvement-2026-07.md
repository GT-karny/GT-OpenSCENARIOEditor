# アーキテクチャ改善 全体プラン(2026-07)

> 入力: 2026-07-05 実施のアーキテクチャ監査(依存グラフ/型契約・apps/web 構造・ドメイン4パッケージ・ビルド基盤・統合境界の5系統 + ドキュメントライフサイクル精査)。主要な主張はコード直接検証済み。
> 既存計画との関係: [tech-debt-audit-2026-06.md](../development/tech-debt-audit-2026-06.md)(Phase 0〜4 消化済み)の未了分 Phase 5 を本プラン S5 に吸収。[opendrive-1.9-support.md](./opendrive-1.9-support.md) とは並走し、合流点を明記する。
> 対象外: OpenDRIVE 1.9 固有の作業(上記提案で計画済み)。

## 背景と診断(要約)

型規律・パッケージ境界・Zustand セレクタ規律・ドメイン層テストは健全(前回監査以降の改善が定着)。残る負債は **「TypeScript の型チェックが及ばない場所」** に集中している:

1. **永続データに版数がない** — project.json / シナリオ埋め込み `_editor` メタ / localStorage 設定のいずれも schemaVersion・migrate を持たず、`@osce/shared` の型変更で旧データが無音で欠落する
2. **ダーティ/保存/モード切替の状態機械が手書きフラグ + モード分岐** — データ消失・保存状態の虚偽表示シーケンスを8本、再現手順つきで確認(下表)
3. **パーサー網羅性と Feature Registry が型システムと非連動** — シリアライザ側だけ union 網羅 switch で守られ、パーサー側は実行時 throw のみ。Registry は手保守で登録漏れが検出不能
4. **ビルドグラフと実依存のズレ** — tsconfig references 欠落4箇所(偶然動作中)、CI に E2E なし・auto-merge が unit のみで通過

### 確認済みのデータ消失/状態虚偽シーケンス(危険度順)

| # | 概要 | 主因 |
|---|------|------|
| 1 | 未保存の道路編集が File>New/Open 後もエンジン(モジュールシングルトン)に残存し、無関係なシナリオの道路として再編集・保存できる | `use-app-lifecycle.ts` の resetForNewFile が opendrive ストアを未リセット |
| 2 | 道路を1回編集すると rawXml が null 化(Undo でも不可逆)、以後シミュレーションが道路なしで無音実行 | `RoadNetworkEditorLayout.tsx:93` の1引数 setRoadNetwork |
| 3 | Electron 終了時の「保存」が現在モードの文書のみ保存し、ウィンドウが理由表示なしに閉じなくなる | `use-unsaved-changes-guard.ts:49-65` のモード分岐 |
| 4 | 道路の別名保存後もシナリオ `logicFile.filepath` が旧名のまま保存され、ファイル対が不整合化 | 参照の自動整合機構が不在(プロジェクトモードの補正も直列化時のみ) |
| 5 | File>Open / ドラッグ&ドロップ / 最近使ったファイルが未保存確認なしで文書を即置換 | アプリ内オープン経路にガードなし |
| 6 | カタログ / パラメータ分布はダーティ概念が不在で、ガード・オートセーブ・表示の全安全網の外 | catalog-store / distribution-store にフラグなし |
| 7 | 道路のみ編集したセッションはオートセーブが一度も発火せず、クラッシュ復旧不能。シナリオ保存時に道路未保存分を含むスナップショットごと削除 | `use-autosave.ts` が scenario 側 isDirty のみ監視 |
| 8 | ネイティブメニューの Undo/Redo がモード無視でシナリオ側を巻き戻す(キーボードは正常) | `use-electron-menu.ts:75-80` に isRoadNetwork 分岐なし |

E2E はこの領域(dirty 表示・保存・モード切替・オートセーブ復旧)を1本もカバーしていない。

## 設計方針: ドキュメントセッション層

モード境界問題の本丸はディレクトリ構成ではなく **状態の所有権**。原則5つ:

1. **DocumentRegistry** — 開いている全文書(scenario / roadNetwork / catalog / distribution)を `{kind, source, engineStore, revision, savedRevision}` で一元管理。エンジンストアのインスタンスは registry エントリが所有し、close で確実に破棄(シーケンス#1 を構造的に不能化)
2. **ダーティは導出値** — `dirty = revision !== savedRevision`。revision は CommandHistory の履歴位置由来とし、Undo で保存時点に戻れば自動的にクリーン表示。手書き boolean 全廃
3. **モードはビュー** — editorMode は「どの文書にフォーカスしているか」のみ。保存・ガード・Undo ルーティングは常に registry 経由(メニューもショートカットも同一経路)
4. **rawXml は revision タグ付きキャッシュ** — `{text, validForRevision}`。無効時のシミュレーション入力は「モデルから再シリアライズ + 警告」に明示フォールバック(現状の無音欠落を廃止)。1.9 Phase 1 のパススルー完成後は再シリアライズがロスレスになり警告を撤去
5. **参照は registry が管理** — 道路 Save-As 時に `logicFile` 更新を undo 可能コマンドとして適用。保存時に参照解決を検証

ガード・オートセーブは registry の `dirtyDocuments()` を購読するだけになり、カタログ/分布は registry 編入と同時に安全網へ自動加入する。

## フェーズ計画

原則: **止血 → 基盤 → 構造 → 物理整理**。各フェーズ末に typecheck / lint / vitest / build + 新設 E2E の全ゲート。`@osce/shared` および scenario-engine の共有基盤に触る変更は単独 PR(並行 worktree 禁止)。

### Phase S0: 止血 + 即効修正 — 2〜3日(設計に依存しない、即着手可)

| 項目 | 内容 | 対応シーケンス/監査項目 |
|------|------|------|
| S0-1 | Electron メニュー Undo/Redo のモードルーティング修正 | #8 |
| S0-2 | Electron close 時の保存を全ダーティ文書ループに変更 | #3 |
| S0-3 | アプリ内オープン全経路(Open/DnD/Recent)に未保存ガード | #5 |
| S0-4 | resetForNewFile で opendrive エンジンもリセット(暫定) | #1 |
| S0-5 | rawXml null 時はモデル再シリアライズ + 警告トースト(暫定) | #2 |
| S0-6 | ASAM 公式 v1.3.1 サンプル19本を往復テストへ編入 + THIRDPARTY_DIR 旧パス修正。失敗はトリアージ表化(即修正はしない) | A3 |
| S0-7 | tsconfig references 欠落4件の補完(opendrive-engine→opendrive、3d-viewer→opendrive-engine、templates→scenario-engine、desktop→server) | B1 |
| S0-8 | ARCHITECTURE.md を実態に更新(依存3エッジ、server 現状、desktop 配布経路、shared の「型のみ」記述訂正) | D1 |
| S0-9 | Vite の `@osce/*` source alias 導入(dev の dist 参照を解消、HMR 有効化)。dev 起動 + E2E スモークで検証 | B2 |
| S0-10 | 小粒同梱: desktop の `@osce/server` を dependencies へ、tsconfig.main.json の base 継承、`crypto.randomUUID()` 直呼び5箇所を shared `generateId` へ | D4 |

**完了条件**: 8シーケンス中 #1/#2/#3/#5/#8 が再現不能(暫定策込み)、v1.3.1 サンプル19本のロード + 往復テストが CI 対象、references 補完後の `tsc --build` クリーン、dev モードでパッケージ編集が即時反映。
**新設 E2E**: 未保存ガード(アプリ内オープン)、モード別ダーティ表示の現状仕様固定。

### Phase S1: DocumentRegistry 基盤 — 約1週

1. **S1-1**: CommandHistory に revision/baseline API を追加(scenario-engine。共有基盤につき**単独 PR**、opendrive-engine は既存 import 経由で自動追随)
2. **S1-2**: DocumentRegistry を apps/web に導入し scenario + roadNetwork を編入。ダーティ導出化、手書き isDirty / isRoadNetworkDirty を退役。ステータスバーを複数文書ダーティ表示に変更
3. **S1-3**: ガード(beforeunload / Electron close / アプリ内オープン)とオートセーブを registry 購読へ置換。道路のみのセッションも autosave 対象化、スナップショット削除条件を「全文書クリーン」に変更(#7 恒久修正)

**完了条件**: Undo で保存時点に戻るとクリーン表示になる / 両文書ダーティ時の close で両方保存される / 道路のみ編集セッションのクラッシュ復旧が E2E で通る。

### Phase S2: 参照整合 + rawXml キャッシュ — 3〜5日

1. **S2-1**: `logicFile` 参照の registry 管理(道路 Save-As 連動の undo 可能な参照更新、保存時の解決検証)(#4 恒久修正)
2. **S2-2**: rawXml を revision タグ付きキャッシュへ(#2 恒久修正)。シミュレーション/バッチ実行のペイロード決定を「valid→rawXml、無効→再シリアライズ+警告」に一本化

**推奨**: S2-2 は 1.9 提案 Phase 1(ロスレスパススルー)と同一列車。パススルー完成をもって警告を撤去する。

### Phase S3: 全文書の registry 編入 + 永続データ版数 — 3〜5日

1. **S3-1**: catalog / distribution を registry 文書化(ダーティ・ガード・オートセーブへ自動加入)(#6 恒久修正)
2. **S3-2**: 永続データに schemaVersion + migrate を導入 — project.json、localStorage persist(zustand persist の version/migrate 指定)、`_editor` メタデータ(監査 A1)

**完了条件**: カタログ編集後の無警告クローズが不能 / 旧形式 project.json を読み込んで migrate が発火する回帰テスト。

### Phase S4: 型の単一ソース化 — 3〜5日(S1〜S3 と独立、並行可)

1. **S4-1**: アクション/条件型の**正準リスト**を shared に単一ソース化する機構設計・導入(union と const 配列の相互導出。**単独 PR**)
2. **S4-2**: パーサー網羅性テスト(「union 全メンバーが最低1フィクスチャに登場し往復する」)を追加(監査 A2)
3. **S4-3**: Feature Registry のカバレッジ強制テスト(「union 全メンバーに registry エントリ必須」)+ コメントアウト済み v1.3 系エントリの解消(監査 B4)
4. **S4-4**: `parse-positions.ts` の未知 Position→WorldPosition(0,0) 消失フォールバックを throw または raw 保全に変更

**完了条件**: 型 union への追加がパーサー/Registry の対応漏れとしてテスト失敗になることをミューテーションで確認。

### Phase S5: ゲート強化(旧負債ロードマップ Phase 5 を吸収) — 3〜5日

1. **S5-1**: CI に E2E ジョブ追加(mock backend の CI-able 全 spec)、auto-merge の必須チェックへ昇格(監査 B5)
2. **S5-2**: CI トリガーを開発ブランチへ拡大、`maturity:validate` を CI へ編入
3. **S5-3**: WASM 運用ガード — サブモジュール pin と配備 WASM の一致チェックスクリプト、`.gitignore` の虚偽記載訂正、git-lfs 化の判断実施(履歴書き換えは行わない)
4. **S5-4**: PatchCommand の前方適用ポリシー制定(scenario-engine の新規コマンドは PatchCommand ベース、既存52クラスは機会移行)(監査 B3)
5. **S5-5**: 小粒バックログ — ポート番号の定数一元化(3001×5箇所、5173×4箇所)、apps/web の .env.example 整備、i18n ハードコード文字列の一括掃除(property/conditions・opendrive/property 中心)、templates のテスト新設

### Phase S6: モード境界の物理化 — 約1週(最後に実施)

- `features/`(scenario / road / simulation)ディレクトリ再編。editorMode を registry のフォーカス概念へ置換
- **状態の所有権が S1〜S3 で正常化した後**に行うことで、単なるファイル移動に縮退させる(順序を逆にすると散らかった状態機械ごと引っ越すことになる)
- God コンポーネント残(IntersectionTimelinePanel 918行、FollowTrajectoryActionEditor 807行、PositionEditor 804行、EditorLayout 890行、use-file-operations 824行)の分割は本フェーズの移動単位に合わせて実施

## OpenDRIVE 1.9 計画との合流点

```
S0 ∥ 1.9-P0(止血同士、worktree 並行。apps/web のファイル所有権を分割)
  → S1(registry 基盤)
  → 1.9-P1 + S2(ロスレス基盤と rawXml キャッシュを同一列車)
  → S3 ∥ S4 ∥ 1.9-P2(触るパッケージが分かれるため並行余地あり)
  → S5(ゲート強化。以降の 1.9-P3/P4 は強化済み CI の上で実施)
  → 1.9-P3/P4 → S6
```

**共有基盤の単独 PR キュー**(並行禁止、直列実行): S1-1(CommandHistory)→ S4-1(正準リスト)→ 1.9-P1(パススルー)。着手時点の優先度で順序入替可。

## 新設 E2E 一覧(再発防止の本体)

現状カバレッジゼロの領域。各フェーズに同梱する:

- 複数文書ダーティの個別表示と保存(S1)
- アプリ内オープン/DnD/Recent の未保存ガード(S0)
- Electron close ガードの全文書保存(S1)
- 道路のみ編集セッションのオートセーブ復旧(S1)
- モード切替をまたぐ Undo の分離(S1)
- 道路 Save-As 後の logicFile 整合(S2)
- 編集後シミュレーションの道路データ健全性(rawXml 無効時の再シリアライズ経路)(S2)
- カタログ編集の未保存ガード(S3)
- 旧版 project.json の migrate(S3)

## 工数とマイルストーン

| フェーズ | 規模 | 完了条件(要約) |
|---------|------|----------------|
| S0 止血 | 2〜3日 | 危険シーケンス5本の封鎖、v1.3.1 サンプル編入、references/HMR/ドキュメント修正 |
| S1 registry 基盤 | 約1週 | ダーティ導出化、全ガード/オートセーブの registry 化 |
| S2 参照整合 | 3〜5日 | logicFile 自動整合、rawXml キャッシュ化 |
| S3 編入+版数 | 3〜5日 | カタログ/分布の安全網加入、schemaVersion + migrate |
| S4 単一ソース化 | 3〜5日 | 型追加漏れがテスト失敗になる状態 |
| S5 ゲート強化 | 3〜5日 | CI で E2E 必須化、WASM 整合ガード |
| S6 物理再編 | 約1週 | features/ 境界確立、God ファイル分割完了 |

## オーナー判断が必要な点

1. **着手順**: 推奨は S0 と 1.9-P0 の並行 worktree 即時着手。1.9 全優先/本プラン全優先の指定も可
2. **WASM の git-lfs 化**: 前方のみ LFS(履歴は現状維持)か、現状維持 + gitignore 注記のみか
3. **MCP 連携方針**(別提案として設計予定): (a) ファイル経由連携と明文化して現状を仕様化、(b) live 同期(エディタと同一文書を編集)へ投資。(b) の場合は registry(S1)が前提資産になる
4. **GT_Sim / esmini パスの製品位置づけ**: 復活時期の目安、または当面 WASM 専念の明文化
5. **S6 の features/ 粒度**: 将来のエディタモード追加計画の有無で scenario/road/simulation の3分割か、より細分化かが変わる

## 実行体制

- 設計・作業仕様書・差分レビュー・グローバルゲート(typecheck/lint/vitest/build/E2E): メインセッションが保持
- 実装: 並列サブエージェント波(worktree、ファイル所有権の明示分割、パッケージ境界準拠)
- 並行可否の要点: S0 内は全項目独立 / 共有基盤 PR(S1-1・S4-1・1.9-P1)は直列 / S4 は openscenario・scenario-engine 中心のため apps/web 中心の S1〜S3 と並行余地あり
