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

## 進捗ノート

### S0 / S1 (〜2026-07-06、要約)

S0(止血 10 項目)と S1(DocumentRegistry 基盤)は完了・レビュー合格済み。S1-1 の位置同一性 revision API(`6c39989`)→ DocumentRegistry と導出ダーティ(`161acc2`〜`6f84ea7`: 手書きフラグ退役、複数文書インジケータ、registry 駆動オートセーブ/ガード、E2E)。1.9-P1(消費追跡パススルー)も同列車で完了(詳細は opendrive-1.9-support.md の進捗節)。ゲート実績: unit 1,889 / E2E unsaved-guard 系通過。

### S2 完了 (2026-07-06)

**S2-1 logicFile 参照の registry 管理(#4 恒久修正)** — `cfb4866` + fixup `5ddd032`:
- 道路 Save-As(プロジェクトモード)が scenario の `logicFile.filepath` を既存の `UpdateRoadNetworkCommand` 経由で即時更新(undo 可能、scenario が正しくダーティ化、info トースト)。参照を持たない scenario には参照を発明しない
- 旧 `convertPathsForSerialization`(無警告の直列化時補正)は `lib/document-references.ts` の `reconcileLogicFileForSave` へ移設・一本化。保存時に参照を検証し、**真の不整合のみ警告**(`warnings.logicFileCorrected`)。正規化比較(`normalizeRelativePath`、先頭 `..` 保持)により `./`・バックスラッシュ等の綴り違いは無警告の正準化に留まる。scenario Save-As の位置移動による相対パス再計算も無警告(旧位置形を整合とみなす)
- スコープ: プロジェクトモードのみ(standalone の道路 Save-As は現状維持)

**S2-2 rawXml の revision タグ付きキャッシュ(#2 恒久修正)** — `e4fe9b0` + fixup `5ddd032`:
- `editor-store.roadNetworkRawXml: {text, validForRevision}`。validity は**読み取り時に**現在の OpenDRIVE CommandHistory revision と比較して導出(S1 の導出ダーティと同型)。編集での null 化は存在せず、undo でベースラインへ戻れば自動再有効化
- S1-1 期の暫定機構(`RoadNetworkEditorLayout` の `originalRawXmlRef`/`baselineRevisionRef`)は完全退役(grep 残存ゼロ)。reverse-sync はドキュメント転送のみに縮退
- スタンプ点: ローダー4箇所(仮スタンプ)/ 道路モード入場時の再スタンプ(自動 lane-link 補正は編集に数えない)/ **道路保存の全経路**(保存直後から raw 直通復活 — 従来は保存後も degraded のままだった改善)/ オートセーブ復旧はキャッシュなし(次の保存まで degraded)
- ペイロード決定の一本化: `simulation-xodr.ts` の `isRawXmlValid` が唯一の判定。シミュレーション実行・バッチ実行・リプレイ・RoadManagerClient の全消費者が「valid → raw 直通 / invalid → 再シリアライズ + degraded 警告」。**警告はオーナー決定により 1.9-P2 完了まで撤去しない**

**E2E**(`586ef23` + `5ddd032`): `road-references.spec.ts` 2本 — (1) 道路 Save-As → 同期トースト・per-document ダーティ・undo/redo・保存後のディスク上 LogicFile 正準値・偽警告ゼロ、(2) 道路編集後の Run → degraded 警告 + シミュレーション到達(道路は失われない)。既存の「未編集往復で警告なし」(opendrive-1.9.spec)は緑のまま

**敵対的レビュー**: 未関与 Opus による監査で BLOCKER/MAJOR ゼロ、MINOR 2件(validity 判定の重複・非正準綴りの偽警告)は fixup 済み、E2E 補強指摘も反映。判定 SHIP

**ゲート実績**: typecheck / lint 0 errors / unit 1,912(+23)/ build / E2E 60 passed(gt-sim 4 は USE_GT_SIM ゲートでスキップ、従来どおり)。lht-direction-arrows の負荷フレーク1件を確認(単体通過、S5-1 の安定化対象に追加)

**完了条件の充足**: #4 再現不能(Save-As 即同期 + 保存時検証の二段)/ rawXml の無音欠落が構造的に不能(無効キャッシュは必ず警告つき再シリアライズ、判定単一ソース)。詳細は `tmp/s2-report.md`

### S3 完了 (2026-07-06)

**S3-1 catalog / distribution の registry 編入 + Undo(#6 恒久修正)** — `56b25bb`(catalog)+ `86cf003`(distribution・ガード・オートセーブ)+ fixup `6b3e224`:
- 両ストアに scenario-engine 共有の `CommandHistory` を導入し全変異をコマンド化(catalog: エントリ CRUD・rename・unload(undo で rawXml ごと復元)/ distribution: 全5変異、whole-doc 捕獲 + 導出1回キャッシュで redo 決定的)。手書き boolean・互換シムなし
- **per-catalog ダーティ**: 単一履歴上の editLog(revision id × catalogName)+ savedEditIds から導出。カタログ A の保存が B の未保存編集を偽クリーンにしない(kind の markSaved は「全カタログがディスクと一致」時のみ)。dirty カタログの unload は確認ダイアログ(無警告クローズ不能の完了条件をアンロード経路まで貫徹)
- registry は 4 kind に拡張。**focusedOverride** による undo/redo のフォーカス文書ルーティング(カタログモーダル・分布ダイアログ/セクションが override、キーボード・Electron メニュー共通の 4-way switch)— 「モードはビュー」原則
- ガード(アプリ内 replace / beforeunload / Electron close)とオートセーブが 4 文書対応: catalog は dirty 分の一括保存(in-place: project API / Electron パス、不能ならピッカー)+ キャンセル伝播、スナップショット payload は v2(catalogs + distribution 同梱)で復旧時は 4 kind とも restored-dirty。StatusBar に catalog / distribution インジケータ追加(スクリーンショット目視確認済)
- File>New で distribution が残留する既存バグを修正。キャンセルされた分布エクスポートがダーティを残さないよう S2 パターン(一時クローン直列化 → 成功後コマンド)へ統一

**S3-2 永続データ版数(監査 A1)** — `49ceeac` + `86cf003`(スナップショット封筒):
- project.json: `ProjectMeta.schemaVersion`(現行2、欠落=v1)。server が読取時 migrate + 書込時刻印、新しい版は警告つきパススルー(silent downgrade なし)
- localStorage persist(editor-preferences / project-state): `version: 1` + エクスポート済み migrate(v0 パススルー、将来の構造変更の分岐点)
- オートセーブスナップショット: 封筒 `version: 2` + `migrateSnapshot`(v1→catalogs/distribution 空補完)+ `_editor.formatVersion` の読取検査(不一致は警告+続行)。**注記**: 監査 A1 の「シナリオ埋め込み _editor メタ」は実態としては .xosc に直列化されておらず(パーサーが毎回再生成)、実在する埋め込み永続面 = スナップショットに版数を実装した

**E2E**(`4e1a5f2`): カタログ編集→ガード発火→Cancel で編集温存 / モーダル内 Ctrl+Z のカタログルーティング + ベースライン復帰でクリーン / 2文書同時ダーティ表示(スクリーンショット)/ v1 project.json が API 経由で v2 として返る migrate 検証

**敵対的レビュー**: 未関与 Opus。MAJOR 1件(dirty カタログの unload が全ガードから編集を無警告で外す — 設計判断の穴)→ 確認ダイアログで修正済み。MINOR 4件中 2件採用(キャンセル残留・formatVersion 検査)、trim 起因の偽ダーティ(safe 方向・CommandHistory 体系の S1 期からのコーナー)等は次送り。判定 SHIP

**ゲート実績**: typecheck / lint 0 errors / unit 1,966(S2 末 1,912 → +54)/ build / E2E 63 passed + 4 skipped(gt-sim)、flaky 1(entity-crud、リトライ通過 — S5-1 安定化リストへ)。fixup 後に typecheck / apps/web 368 / catalog-guard・parameter-distributions E2E を再確認

**完了条件の充足**: カタログ編集後の無警告クローズ不能(E2E + unload 確認)/ Undo で保存時点まで戻すとクリーン表示(unit + E2E)/ カタログ A 保存後も B はダーティ維持(unit)/ migrate 発火回帰テスト 3 系統緑。詳細は `tmp/s3-report.md`

### S4 完了 (2026-07-06)

**S4-1 正準リスト機構** — `45ae9fc`:
- 各 union の隣に判別子の `as const` 配列(PRIVATE 20 / GLOBAL / SCENARIO 合成 / ENTITY / VALUE 7 / POSITION 10)を置き、`Equals`/`Assert` 型ユーティリティで**既存 union と双方向溶接**(片側だけの追加 = コンパイルエラー)。既存の型名・判別子・interface 構造は不変更(後方互換厳守)。`export type *` が値を落とすため明示 value 再エクスポート(S3 前例)
- 下流の平行リストを一掃: apps/web パレットは shared 再エクスポート + `satisfies` 溶接 + 完全性テスト(除外は明示集合で宣言)、node-editor ラベル Map は `Record<正準型, string>`(キー漏れ = コンパイルエラー)、`defaultActionByType` の **silent speedAction フォールバックを撤去**(未知は throw、内部 switch は never 溶接で網羅)

**S4-3 v1.3 型実装 + registry 密化** — `8f5ad9d`:
- コメントアウトエントリの解消: **AngleCondition / RelativeAngleCondition / SetMonitorAction を v1.3.1 XSD 準拠で実装**(パーサー・シリアライザ同時更新の掟遵守。XSD に rule 属性なし等、XSD を法として実装)。randomRouteAction = 既存 routingAction/randomRoute、trafficAreaAction = trafficAction パススルーで往復(テストで実証)として注記解消
- Feature Registry を疎(例外+デフォルト)→**密**(`Record<正準型, FeatureEntry>` — 新メンバーはコンパイル強制)へ。since は v1.2 XSD と照合済み。パレット露出は専用エディタ未実装のため明示除外(次送り)

**S4-2 網羅性テスト + S4-4** — `ce70861` + `f4669c2`:
- 列挙駆動スイート: 全正準メンバーを defaults から合成 → serialize → parse → 構造等価(62 tests)。acquirePositionAction はパーサー正規化(routingAction/acquirePosition)を仕様として厳密アサート
- **導入したテストが即座に実バグを検出**: setMonitorAction が `buildScenarioAction` のハードコード列挙から漏れ `<PrivateAction>` へ誤ルート(Event 内で保存→再読込不能)→ GLOBAL_ACTION_TYPES 参照へ修正
- **既存の往復ギャップ 9 件を検出し全て修正**(空デフォルト → schema-invalid XML → 再読込 throw): XSD-required 欠落 6 件は defaults を XSD 準拠の最小形に補完、空要素が XSD-valid な controller 系 3 件はパーサーを has() ディスパッチ化。thirdparty 164 ファイル往復は無傷
- S4-4: `parsePosition` の silent WorldPosition(0,0) フォールバックを throw 化(Position choice は 10 メンバーで完備のため発火はスキーマ違反入力のみ)
- レジストリカバレッジテスト(キー集合 == 正準リスト両方向)

**ミューテーション確認(完了条件)**: `'fakeTestAction'` を配列に一時追加 → **5 系統の独立コンパイルエラー**(union 溶接 ×2 / registry Record / defaults never 溶接 / ラベル Record)を確認 → revert でクリーン復帰。runtime のカバレッジ/完全性テストは Record が widen された場合のバックストップ

**敵対的レビュー**: BLOCKER/MAJOR ゼロ。MINOR-1(global パレットのみ完全性テスト欠落)→ `58c37a9` で修正。外部作成 v1.3 ファイルのプロパティ UI 劣化(データ消失なし)は UI 次送りの帰結として許容。判定 SHIP

**ゲート実績**: typecheck / lint 0 errors / unit **2,056**(S3 末 1,966 → +90)/ build / **E2E 64 passed + 4 skipped、flaky 0**。詳細は `tmp/s4-report.md`

### S5 完了 (2026-07-06)

**S5-1/S5-2 CI 強化** — `bdcf7fd` → 反復 `a18e6cf` `4ea4e1c` `ab58b46`(**GitHub Actions 実績: dev_v0.5 で check + E2E 両ジョブ連続緑**、E2E 約7分):
- ci.yml に E2E ジョブ新設(Playwright ブラウザキャッシュ / 全ビルド / 失敗時 artifact)。trigger を `dev_**` push へ拡大、check ジョブへ `maturity:validate` + `check:wasm` 編入
- CI 自走反復で潰した障害: (1) pnpm/action-setup と packageManager の競合 (2) **サンプルプロジェクトのシード元が GT_Sim submodule 依存**(CI では未取得→全滅)→ 7 ファイルを test-fixtures へ追補し seeder にフォールバック候補追加 + 代表ファイル実在プローブ (3) Thirdparty 依存の fixture 参照修正。CI は workers 2 / maxFailures 10 / timeout 45m
- **flaky 安定化は 2/3**(addEntity の肯定シグナル化で unsaved-guard 系 + entity-crud を安定化)。**lht-direction-arrows は CI 除外**(視覚キャプチャ専用スペック。CI のソフトウェア WebGL でメインスレッド飢餓、クリック自体が 90s 未完 — 実測 run 28781306023)。**オーバーレイトグルの CI E2E カバレッジは意図的に喪失**(ローカル実行 + lht-default-rule.spec の機能面 CI カバレッジで代替)。次送り: GPU runner か DOM 分離での CI 復帰
- **必須チェック昇格(check + e2e)と main 反映は未実施 — オーナー承認待ち**(手順書は tmp/s5-report.md §オーナー承認パッケージ)

**S5-3 WASM 運用ガード** — `bdcf7fd`: `pnpm check:wasm`(provenance ブロック vs 実 pin/sha256/size、依存ゼロ)。**実際に stale だった記録**(pin f2674640・~5MB → 実際 db7d609e・6,331,405 bytes)を訂正、運用注記(LFS 不採用=オーナー決定、履歴書き換え禁止)追加、.gitignore の虚偽エントリ削除。CI 編入済み

**S5-4 PatchCommand ポリシー** — `bdcf7fd`: 本体を scenario-engine へ移設(opendrive-engine は再エクスポート、32 サブクラス無変更)+ ARCHITECTURE.md に明文化(新規コマンドは両エンジンとも PatchCommand 既定 / 既存 52 クラスは機会移行 / レビュー観点)。**docs + レビュー運用であり自動 lint 強制ではない**(計画どおり)

**S5-5 小粒バックログ** — `3f7c512` + `4926599`:
- ポート定数を `@osce/shared` に一元化(ランタイム全箇所。ビルド時 config は env + literal + 参照コメントの設計例外)/ apps/web の .env.example 新設
- **templates 初のテストスイート 78 本**(8 use-case の decompose 列挙駆動 + helper factories)
- **i18n greenfield 変換 30 コンポーネント**(conditions 22 + opendrive/property 8、+1 は文字列なし)= 158 en/ja キー。en 値はバイト同一維持(E2E セレクタ保全)。XSD スペックトークンと enum キャプションは既存前例に従い対象外
- レビュー fixup(`6958426`): シード候補の内容プローブ / 新セクションの en/ja パリティテスト / templates assert の頑健化 / vite proxy の空文字ガード

**敵対的レビュー**: BLOCKER ゼロ。MAJOR 1(報告の誇張防止 — flaky 2/3 と CI 除外の明記)は本ノートに反映、MINOR 3 件は fixup 済み。判定 SHIP

**ゲート実績**: typecheck / lint 0 errors / unit **2,136**(S4 末 2,056 → +80)/ build / E2E ローカル 64 passed + 4 skipped / **GitHub Actions 連続緑**。詳細は `tmp/s5-report.md`

### S6 完了 (2026-07-06)

**前提検証(停止条件)**: S1〜S3 の正常化により editorMode は「非永続の2値ビューポインタ + リセットカスケード」まで縮退済みと確認 — 状態機械の手直しは不要、**停止せず続行**(敵対的レビューも「状態機械の手直しではなく抽出の帰結」と追認)

**editorMode → registry focus** — `e93c68c`: registry が `focusedBase`(ビュー・保存ルーティング)+ `focusedOverride`(カタログ/分布)の完全なフォーカス概念を所有。editor-store の editorMode/setEditorMode はシム無しで退役。switchEditorMode のリセットカスケードは不変。S3 残骸だった UndoRedoButtons の editorMode 直読みも focused-document ルーティングへ解消

**features/ 3分割(オーナー決定の物理化)** — `130af1e`(road 49)+ `4e027e5`(simulation 27)+ `bc01097`(scenario 179): 全て `git mv` の純移動(`--follow` で履歴貫通を確認)。共有シェル(layout/editor/home/共有 toolbar/ui/form)とインフラ hooks・stores は設計判断として残置。新規循環 import ゼロ(madge、既存 13 件のみ)

**God 分割(pure split)** — `dee4b38` `c96eaf0` `c2192f5` + lint パリティ `e92bd1b`:
| 対象 | 前 | 後 |
|---|---|---|
| EditorLayout | 890 | **91**(シェル)+ ScenarioEditorLayout 826(scenario 面の凝集レイアウト) |
| use-file-operations | 955 | **62**(合成点)+ core 277 / xosc 430 / xodr 301 |
| PositionEditor | 804 | **165** + position-fields/ 9 ファイル |
| FollowTrajectoryActionEditor | 807 | **552** + shape 別 3 セクション |
| IntersectionTimelinePanel | 918 | **713** + pick-mode hook / PhaseHeader / track-meta |

設計目標 ~400 行に対し 713 / 552 / 430 が残存 — いずれも単一関心の凝集ハンドラ群で、多パラメータ抽出のリスクに見合わないため受理(レビュー追認。ハンドラ hook 化は次送り)。分割副産物: シナリオ専用 hooks 11 本が features/scenario へ移動し、シナリオ面のみでマウントされる(旧挙動は road モード中も破棄される作業を実行 — 抽出の意図された帰結)

**挙動差ゼロの検証**: 3画面(scenario / road / catalog modal)の前後スクリーンショット比較で一致(唯一の差 = カタログ一覧順は `loadProjectCatalogs` の完了順挿入という既存非決定性で S6 非起因)。E2E 全緑

**敵対的レビュー**: **コード欠陥ゼロ**(pure move/split 忠実性・focus 移設の完全 parity・saveFnsRef 配線・trackCounter 単一性まで追跡済み)。指摘は docs 2 件(CLAUDE.md / feature-graph.yaml — 処置済み `2b64cb2` + ローカル yaml 修正)と報告精度 2 件(実数記載・scenario→simulation 結合 7 箇所の明示 — 本ノートに反映)。判定 SHIP

**ゲート実績**: typecheck / lint 0 errors(11 warnings 不変)/ unit **2,138** / build / E2E 64 passed + 4 skipped / **GitHub Actions 緑**(最終 HEAD)。詳細は `tmp/s6-report.md`

## 総括 (2026-07-06 — 全フェーズ完了)

S0〜S6 の 7 フェーズ + OpenDRIVE 1.9-P0/P1 を完遂。主要判断: ダーティ/フォーカスの完全導出化(S1/S6)、rawXml の読み取り時 validity(S2)、per-catalog ダーティの editLog 導出(S3)、型溶接 + 密レジストリ(S4)、CI の実測反復による E2E ジョブ確立(S5)、純移動/純分割の規律(S6)。

### 危険シーケンス 8 本の最終状態(全て構造的に不能化)

| # | 不能化の根拠 | 担保テスト |
|---|---|---|
| 1 道路残存 | resetForNewRoadNetwork + registry の文書所有(S0-4/S1) | use-app-lifecycle unit / unsaved-guard E2E |
| 2 rawXml 無音欠落 | revision タグ付きキャッシュ — null 化コード自体が不在、無効時は必ず警告つき再シリアライズ(S2-2) | simulation-xodr unit(undo 再有効化含む)/ opendrive-1.9・road-references E2E |
| 3 close 片側保存 | ガードが registry の 4 文書を列挙保存(S0-2/S1-3/S3) | use-unsaved-changes-guard unit(4 kind・キャンセル伝播) |
| 4 logicFile 不整合 | Save-As 即時の undo 可能同期 + 保存時 reconcile 検証(S2-1) | document-references unit / road-references E2E(ディスク読み戻し) |
| 5 ガード無しオープン | 全オープン経路が discard ガード経由(S0-3) | unsaved-guard・file-operations E2E |
| 6 カタログ/分布が安全網外 | CommandHistory + registry 編入で自動加入、unload も確認制(S3) | catalog-store/distribution-store unit / catalog-guard E2E |
| 7 オートセーブ不発火・道連れ削除 | anyDirty 発火 + 全文書クリーン時のみ削除 + v2 スナップショット(S1-3/S3) | use-autosave unit(catalog 単独発火・削除条件・復旧 dirty) |
| 8 メニュー Undo のモード無視 | focused-document ルーティングに一本化(キーボード・メニュー・ボタン)(S0-1/S3/S6) | use-electron-menu unit / catalog-guard E2E(モーダル内 Ctrl+Z) |

### 新設 E2E 9 本の所在

| 計画名 | 所在 |
|---|---|
| 複数文書ダーティの個別表示と保存(S1) | unsaved-guard.spec.ts §Derived dirty display |
| アプリ内オープン/DnD/Recent の未保存ガード(S0) | unsaved-guard.spec.ts / file-operations.spec.ts |
| Electron close の全文書保存(S1) | **unit 代替**(use-unsaved-changes-guard.test — Electron main は E2E 対象外、S1 で判断済み) |
| 道路のみ編集のオートセーブ復旧(S1) | **unit 代替**(use-autosave.test — IndexedDB 復旧系、S1 で判断済み) |
| モード切替をまたぐ Undo 分離(S1) | unsaved-guard.spec.ts(cross-mode)+ catalog-guard.spec.ts(focused routing) |
| 道路 Save-As 後の logicFile 整合(S2) | road-references.spec.ts Test1 |
| 編集後シミュレーションの道路健全性(S2) | road-references.spec.ts Test2(+ opendrive-1.9.spec の未編集直通) |
| カタログ編集の未保存ガード(S3) | catalog-guard.spec.ts |
| 旧版 project.json の migrate(S3) | project-meta-migrate.spec.ts + server unit |

### 次の推奨

1. **OpenDRIVE 1.9-P2 着手**(明示モデル化: lane layers / junction 4型 / crossPath / speed `@max` / laneLink 多重度 → 完了後に degraded 警告撤去を判断)
2. **オーナー承認待ち**: ブランチ保護の必須チェック昇格(check + E2E)と main への反映(`tmp/s5-report.md` §オーナー承認パッケージ)
3. **C1(MCP 連携方針)/ C2(GT_Sim 位置づけ)のオーナー判断**(registry 完成により C1-(b) live 同期の前提資産は整った)
4. 次送りの束は各 `tmp/sN-report.md` に集約(主要: CommandHistory trim コーナー / v1.3 新型の UI / lht 視覚スペックの CI 復帰 / ハンドラ hook 化 / scenario→simulation 結合の整理)

**オーナー決定 (2026-07-06 ヒヤリング)**: 上記 2(必須チェック昇格・main 反映)と 3(C1/C2)はいずれも**当面保留**。次の実装は **1.9-P2 に着手**と決定(推奨どおり)。
