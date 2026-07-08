# OpenDRIVE 1.9 対応プラン（2026-07 改訂2版）

> 初版 2026-07-02: XSD 1.6→1.9 差分 + 実装カバレッジ（12エージェント）→ [odr-1.9-gap-matrix.md](../development/odr-1.9-gap-matrix.md)
> 改訂 2026-07-05: 要素別 Open/Edit 精査（6領域×6軸、152要素行）+ GT_Sim dev_v0.12 整合（9エージェント）→ [odr-element-support-matrix.md](../development/odr-element-support-matrix.md)
> 高影響の主張はコードで直接検証済み。

## 要約（改訂版）

**前提が逆転した。** GT_Sim（esmini フォーク）の `dev_v0.12` 先端 `db7d609e` は「ODR 1.6-1.9 対応プログラム（P0〜P9b）」を完遂しており（適合テスト 350 PASS / 0 FAIL、`[ODR-UNSUPPORTED]` 要素・属性カウント 0）、lane layers・virtual junction ネイティブ・crossing junction/crossPath→横断歩道合成・signal semantics 挙動・crossSectionSurface 縮退対応まで済んでいる。**シミュレータが先行し、エディタが追う側**である。

一方エディタは、1.6 のデータ層（parse/serialize）は広いが「開いても見えない」層が厚く、1.9 はほぼ全滅。**strict-whitelist パーサーがパススルーを持たない**ため、シミュレータが解釈する 1.9 データ（virtual junction 属性、semantics、crossPath、crossSectionSurface 等）を load→save で**無音破壊**する。これが全領域に共通する構造的根本原因。

さらに重要: サブモジュールのピン（`f2674640`）が先端より古いだけでなく、**配備中の `apps/web/public/wasm/esmini.js`（5,375,824 bytes / 6月13日）はピンコミットの odr_side リンク修復よりも前のビルド**で、実質 P0 以前の挙動で動いている。バンプ + リビルドは必須かつ安価（embind API 非破壊 = TS 側コード変更ゼロ確認済み）。

## Open/Edit 対応状況サマリ（2026-07-05 精査）

判定: **OPEN** = 開いて見える（parse+model+可視化 or パネル表示）/ **EDIT** = UI から変更できる。
⚠ = 「往復はするが見えない」= ユーザーにデータの存在が伝わらない罠。全152行は [odr-element-support-matrix.md](../development/odr-element-support-matrix.md)。

| 領域 | OPEN | EDIT | 特記 |
|---|---|---|---|
| road 本体 / planView | line/arc/spiral は full | line/arc full、spiral は変換のみ、**poly3/paramPoly3 は表示のみ編集不可** | elevation はメッシュ反映あるが**グラフ編集のドラッグが未配線で保存されない** |
| header | 主要属性 full | full | `@version/@vendor` は**モデル化されておらず消える**。offset は往復のみ（3D 未適用・UI 無し） |
| lanes | type/width は full | width/type/roadMark 編集可（追加削除に制限） | **`solid_solid` を出力する schema-invalid バグ**（正: `solid solid`）、**center lane の編集が無音で捨てられる**、border 車線は幅ゼロ描画、material/access/height/speed は往復のみ⚠ |
| objects | **ほぼ全部 ⚠**（往復するが 3D 表示ゼロ・パネルゼロ） | 実質 none（コマンドは信号ポール専用） | 最悪の「見えないデータ」領域。tunnel/bridge/parkingSpace 含め完全に不可視 |
| signals | コア属性 full（3D カタログ描画 + 配置/移動） | 主要属性 full | validity/dependency/position 系は往復のみ⚠。**controller はエンジンコマンド完備なのに UI 到達経路ゼロ（死にコマンド）** |
| junctions | default 型 partial（laneLink は 唯一の本格 CRUD あり） | 自動検出 + laneLink 編集が強み | **virtual junction の属性（mainRoad/sStart/sEnd/orientation）が型に存在せず、開いて保存すると壊れる**。direct/crossing は空になる |
| railroad/stations | 往復のみ⚠（表示・UI ゼロ） | none | 1.9 差分ゼロで低優先。空 `<railroad>` が消える小バグ。※初版の「station side 型誤り」は**再現せず（撤回）** |
| 1.9 全般 | **ほぼ none**（パススルー不在で全て消える） | none | dual `<lanes>` は全レーン消失（T0）、その他は無音ドロップ |

## エディタ vs シミュレータ整合（要点）

| 1.9 機能 | エディタ | GT_Sim dev_v0.12 | 製品ギャップ |
|---|---|---|---|
| lane layers（工事帯） | 破壊（全レーン消失） | **完全対応** + `GT_RM_GetLaneLayersJson` | sim が解釈するデータをエディタが破壊 |
| virtual junction | **保存で破壊**（属性未モデル） | **ネイティブ完全対応**（経路・走行） | 最重症。正しいファイルを開いて保存→schema-invalid |
| crossing/crossPath | junction が空になる | 横断歩道合成 + 歩行者譲り挙動 | 歩行者シナリオが編集で壊れる |
| signal semantics | 消える | L2 挙動（STOP/GIVE_WAY）に使用 | sim の挙動に効くデータを編集で失う |
| crossSectionSurface | 消える | 縮退対応（等価 superelevation 化） | エディタは superelevation すら路面に未適用 |
| `<include>` | 参照を温存して保存 | **ハードエラー（ロード拒否）** | エディタ保存ファイルが sim で開けない。現状は汎用エラー表示のみ |
| GT_RM_* メタデータ JSON API | 未使用 | DLL C-API 完備、**ただし embind 未公開** | 各 ~半日の binding 追加で「sim 視点の 1.9 メタデータ/監査パネル」を作れる好機 |

## フェーズ計画 v2

原則: 基盤同期とデータ破壊停止 → ロスレス基盤 → 明示モデル化 → 可視化 → 編集 UI。各フェーズ末に typecheck/test/build + 1.9 サンプルスモーク。

### Phase 0: 基盤同期 + データ破壊停止 — 目安 2〜3日（即着手可）

**A. GT_Sim バンプ + WASM リビルド（必須・安価）**
1. サブモジュール `f2674640` → `db7d609e`、esmini.js リビルド（5.4MB→約6.3MB。ビルド手順変更不要 — CMake が odr_side を自動収集。罠: Git Bash では `source /e/emsdk/emsdk_env.sh`）。**TS 側コード変更ゼロ**（embind 署名不変をハンドオーバーノートで確認済み）
2. `<include>` ハードエラーの特定メッセージ化（現状 `esmini-worker.ts:333` 経由の汎用トースト）+ 保存時に `<include>` 温存ファイルへの警告
3. 吸収すべき挙動変化: 合成オブジェクト（横断歩道 9.0e8 / 橋 9.1e8 / objectRef 9.2e8 の巨大 ID）がエンティティリストに出る → **表示/フィルタの判断**、信号数増加、多層道路は WASM が常に permanent 選択、ロード時の `[GT_ODR]`/`[ODR-UNSUPPORTED]` コンソール出力
4. E2E ギャップ補填: include ハードエラー経路 + 1.9 マルチレイヤ/VJ シナリオのスモーク（既存 E2E は6シナリオとも旧構造のみ）

**B. データ破壊の修正（往復安全性、sim 対応済みが故に緊急化）**
1. **virtual junction 属性（`@mainRoad/@sStart/@sEnd/@orientation`）のモデル化+往復** — 最優先。sim がネイティブ走行する junction をエディタが保存で壊す
2. **dual `<lanes>` の誤パース修正**（全レーン消失、`parse-road.ts:29-30`）
3. **repairJunctionLinks の virtual/direct/crossing 除外** + 破壊の再現テスト（現状コードリーディングでの確認のみ）
4. 未知ジオメトリの `<line>` 強制変換廃止
5. **`solid_solid` → `solid solid`**（schema-invalid 出力、`OdrLanePropertyEditor.tsx:43`）
6. **center lane 編集の黙殺修正**（id=0 が rightLanes に誤ルーティング）
7. フィクスチャ: 1.9 サンプルを `test-fixtures/opendrive-v1.9/` へ、全サンプルロードスモーク

### Phase 1: ロスレス往復基盤（passthrough）— 目安 約1週

初版から変更なし、根拠が強化された（「往復で消える」行の構造的根本原因 = whitelist 無パススルーを単一機構で解消）。**shared 変更につき単独 PR**。

1. 消費追跡型アクセサ（`takeAttr`/`takeChild`）→ 未消費分を各ノード `extra` へ、シリアライザが再放出 → semantics/crossPath/crossSectionSurface/curveLocal/VMS/board/skeleton 等が**個別実装なしで**往復保全
2. 既知要素の順序修正（additionalData 順、header 子要素順、signal position 順、junction priority 両側出力）
3. ヘッダー `revMajor/revMinor` の宣言値維持 + `@version/@vendor` の往復追加
4. 未編集時の rawXml 直通維持（`RoadNetworkEditorLayout.tsx:93` — エディタを開いただけで sim 入力が劣化する問題の解消）
5. 全 1.9 サンプルの「load→save→re-parse 意味的等価」テスト
6. 小粒の 1.6 損失も同時退治: road/type/speed `@max` の文字列値（"no limit"）NaN→0 化、空 `<railroad>` ドロップ

### Phase 2: 価値の高い機能の明示モデル化 — 目安 1〜2週

パススルーで守った上で、編集・表示価値のあるものを型付きへ昇格。優先順は sim 整合で改訂:

1. **lane layers**（dual `<lanes>` + `@layer` 系）— sim 完全対応済み、工事帯シナリオの本命
2. **junction 4型**（common/virtual/direct/crossing の型 union + variant 子要素 + UI ドロップダウン + virtual connection `@type` 出力）— Phase 0-B1 の属性往復を完全なモデルへ
3. **crossPath / roadSection**（歩行者横断歩道 — sim が挙動まで対応済み）
4. lane 新属性（`@direction`/`@advisory`/dynamic フラグ、access `<restriction>`、center lane 内容モデル厳格化）
5. **crossSectionSurface** parse/emit + superelevation/shape 排他バリデーション

semantics/VMS/skeleton/curveLocal は passthrough 維持（authoring UI の需要が出たら昇格 — semantics は sim 挙動に効くため Phase 4 の UI 候補）。
実装時検証: `curveLocal` 命名（リリース資料の `cornerLocalCurve` は誤り）、`<_OpenDriveElement/>` は codegen 産物の疑い — 盲目的に出力しない。

### Phase 3: 可視化 — 目安 約1週

1. **superelevation の路面バンク適用**（1.6 データ、既に往復済み、viz のみのギャップ。sim は crossSectionSurface を superelevation へ縮退させるため二重に重要）。※crossSectionSurface 表示は「authored 値」か「sim の縮退近似」かの表現判断が必要
2. **temporary レイヤー表示**（トグル。sim パリティには `SetLaneLayerModeForTest` の embind 追加も選択肢）
3. **object の最小可視化 + プロパティ一覧**（最大の「見えないデータ」領域の解消。sim 合成オブジェクト(9.0e8+ ID)は編集ドキュメントに存在しない — 境界を明確に）
4. 新 enum 色（lane type shared/walking/slipLane、roadMark black/violet）
5. E2E スクリーンショット検証

### Phase 4: 編集 UI + 死にコマンド配線 — 目安 1〜2週

1. **配線だけで済む既実装コマンドの UI 化**（最安の価値回収）: root controllers CRUD、geometry 追加/削除、elevation グラフ編集の永続化（onControlPointChange 未配線）、road/type エントリ追加/削除
2. poly3/paramPoly3 の編集可能化（現状表示のみ）
3. lane direction/advisory・access restrictions・junction type のプロパティ編集
4. deprecation ヒント（sidewalk→walking 等、UI バッジ）
5. バージョン選択出力（1.9 構造を含む場合のみ revMinor=9、ダウングレード時警告）

### Phase 5（機会、任意）: GT_RM_* メタデータパネル — 目安 2〜3日

embind binding（各 ~半日、2コール buffer プロトコル）で公開し、エディタに差別化パネルを追加:
- **`GetOdrAuditJson`** → 「この地図で sim が完全対応していない要素」監査パネル（最有力）
- `GetLaneLayersJson` / `GetVirtualJunctionsJson` → 1.9 メタデータパネル
- 他: semantics / junction priorities / crosswalks / railroad / userData

## バージョン戦略 v2

1. **読み込み**: 宣言バージョン保持 + スキーマで判定（1.9 サンプルの多くは 1.8/1.5 刻印のまま新要素を使う実態）
2. **保存**: 宣言バージョン維持。**1.9 構造を実際に含む場合のみ 9**。内容を落として 9 を刻まない
3. **sim 整合（改訂）**: GT_Sim は今やバージョン検出 + 1.9 ネイティブ。「esmini が無視するから安全」ではなく「**sim が解釈するデータをエディタが壊さない**」が新しい成立条件。1.9 出力の制約は事実上 OpenSCENARIO ≤1.3.1 との lane layer 併用非推奨（ASAM 注意）のみ
4. **`<include>`**: sim は恒久ハードエラー。エディタは author 時に警告し、ロード失敗は特定メッセージで表示

## 工数とマイルストーン

| フェーズ | 規模 | 完了条件 |
|---------|------|---------|
| 0 基盤同期+破壊停止 | 2〜3日 | 新 WASM 配備（~6.3MB）+ include 特定エラー、VJ/レーン/center/solid_solid の破壊ゼロ、1.9 サンプル全ロード |
| 1 ロスレス基盤 | 約1週 | 全 1.9 サンプル往復等価、未編集時 rawXml 直通 |
| 2 明示モデル化 | 1〜2週 | lane layers / junction 4型 / crossPath / lane 新属性 / crossSectionSurface が型付き往復 |
| 3 可視化 | 約1週 | バンク表示、temporary レイヤー、object 可視化、新 enum 色 |
| 4 編集 UI | 1〜2週 | 死にコマンド配線、poly3 編集、1.9 プロパティ、バージョン選択 |
| 5 メタデータパネル | 2〜3日 | GT_RM_* embind + 監査パネル |

## オーナー判断が必要な点 v2

1. **Phase 0-A のバンプ時期**: 即実施を推奨（配備 WASM はピンコミットの修復前ビルドで、現状すでに「古い挙動」で動いている）
2. **合成オブジェクト（9.0e8+ ID）の扱い**: エンティティリストで表示 or フィルタ（推奨: 既定フィルタ + 「sim 生成物を表示」トグル）
3. **Phase 2 スコープ**: 推奨 = lane layers + junction 4型 + crossPath + lane 新属性 + crossSectionSurface。semantics authoring は Phase 4 で判断
4. **crossSectionSurface の表示方針**: authored 値 or sim 縮退近似（推奨: authored 値 + 「sim では近似」注記）
5. **Phase 5 メタデータパネル**: 監査パネルは差別化機能として推奨
6. **着手順**: Phase 0 A/B は並行 worktree 可（A=esmini/web、B=opendrive/opendrive-engine）。Phase 1 の shared 変更のみ単独 PR

## 技術的負債ロードマップとの関係

- Phase 0-B は負債監査 A 表の続編に相当（往復正しさ）。Phase 1 のテスト群は負債 Phase 5（CI 強化）の資産になる
- `packages/opendrive/CLAUDE.md` の「Follow ASAM OpenDRIVE **1.8** conventions」を 1.9 へ更新、Key References に 1.9 XSD パス追記
- 初版の「station segment side 型誤り」は精査で再現せず撤回済み（gap-matrix 側の記述は本マトリクスが上書き）

## 進捗 (2026-07-05)

**Phase 0-A 完了（基盤同期 + データ破壊停止・インフラ）:** GT_Sim サブモジュールを `f2674640` → `db7d609e`（dev_v0.12 先端、ODR 1.6-1.9 プログラム完遂）へバンプし、esmini.js を **5,375,824 → 6,331,405 bytes（≈6.3MB、odr_side 込み）** にリビルド・配備（embind 非破壊 = TS 側変更ゼロを確認）。`<include>` 入り xodr のロード失敗を特定メッセージ化（`sim-error.ts` に `includeUnsupported` 種別 + `INCLUDE_UNSUPPORTED_MESSAGE`、worker 失敗経路を分岐）+ 保存時に `<include>` 温存ファイルへ非ブロッキング警告。sim 合成オブジェクト（ID ≥ 900000000: 横断歩道/橋/objectRef クローン）を WASM→SimulationFrame 取り込み境界で既定フィルタ + 「Show simulator-generated objects」トグル（`sim-object-filter.ts`、`editor-store` 永続化）。E2E 追加: `<include>` ハードエラー経路 + 1.9 マルチレイヤ/virtual junction ロードスモーク（`opendrive-1.9.spec.ts`、3 テスト緑）。

**Phase 0-B 完了（データ破壊の修正・各回帰テスト付き）:** (1) virtual junction 属性 `@mainRoad/@sStart/@sEnd/@orientation` を shared `OdrJunction` に optional 追加し parse/serialize 往復（全依存パッケージ typecheck 緑）。(2) 二重 `<lanes>`（1.9 lane layer）の誤パース修正 — `ensureArray` 化で permanent 層を正しくパースし全レーン消失を解消、temporary 層は `OdrRoad.temporaryLanesRaw` に raw 保全 + 警告（完全対応は Phase 2）。(3) `repairJunctionLinks` / `validateJunctionLinks` を virtual/direct/crossing junction で除外（破壊の再現テストを先行）。(4) 未知 planView ジオメトリの `<line>` 強制変換を廃止し明示エラー化。(5) roadMark トークンを XSD 準拠の空白区切りへ（`solid_solid` → `solid solid`）。(6) center lane（id=0）編集の黙殺を修正 — `'center'` を updateLane チェーン（handleUpdateLane → store → UpdateLaneCommand）へ貫通し `section.centerLane` を更新（undo/redo 対応）。(7) 公式 ASAM 1.9 例 + GT_Sim フィクスチャ計 13 件を `test-fixtures/opendrive-v1.9/` へ配置し全サンプルのロード/往復スモークを追加。

**ゲート:** lint 0 errors / typecheck クリーン（`tsc --build`）/ ユニット 1764 passed（148 files）/ build 全パッケージ完了 / E2E 51 passed（1.9 spec は再実行 6/6 で flake 解消）。コミットは /ship 準拠で Phase 0-A / 0-B を別コミット群に分割。

**申し送り（本実装で判明、Phase 1 以降の入力）:**
- Road Network エディタ経由で xodr を開くと `roadNetworkXml` がクリアされ（`RoadNetworkEditorLayout.tsx:93` の odrStore→editorStore 同期に rawXml 経路なし）、`<include>` 道路を sim へ渡す経路はプロジェクトのシナリオ自動ロードのみ — 既存の制約。Phase 1 の「未編集時 rawXml 直通」で解消予定。※Phase 1 の baseline ref 方式で解消後、2026-07-06 のアーキテクチャ改善 S2 で revision タグ付きキャッシュ（`roadNetworkRawXml {text, validForRevision}`、読み取り時に validity 導出）へ恒久化済み。
- 合成オブジェクトは現状 apps/web のリスト UI には未出現（`EntityListPanel` は authored entity のみ、3d-viewer 消費者は名前照合で非 authored を除外）。よってフィルタは取り込み境界（`esmini-wasm-service.ts`）に配置し全消費者へ将来にわたり適用。
- 未知ジオメトリは raw 保全でなく明示エラーを選択（`OdrGeometry` 判別共用体への raw variant 追加はスコープ超過）。Phase 1 のパススルー基盤で再検討。

## 進捗 (2026-07-06 — Phase 1 ロスレス往復基盤)

**消費追跡パススルー機構を確立し、全 parse/build モジュールへ展開:** shared に `OdrExtra { attrs?, children? }` を追加し、parser に `trackNode()`（`takeAttr`/`takeChild`/`takeChildren`/`rest`）、serializer に `applyExtra()` を新設。header / road（+road-type +lateralProfile）/ lanes（+laneSection）/ objects（+outline +material）/ signals / junctions（+laneLink）/ controllers を追跡アクセサへ移行し、各ノードの未対応属性・子要素を `extra` として往復保全。**個別実装なしで**次が往復するようになった（gap-matrix ⚠ 行）：crossSectionSurface/surfaceStrips（F1）、object skeleton/surface/curveLocal+outline 内 markings（C1/C3/C4）、signal semantics/board（D2/D3）、junction crossing/direct サブツリー+crossPath（E9）、laneLink `@overlapZone/@fromLayer/@toLayer`（E8）、road/type `@country`（F5）、lane `@direction`（B1）、lane/section userData のベンダーペイロード、空 `<surface>`/`<railroad>`。ヘッダーは `@version/@vendor` を明示モデル化+`<license>`/`<defaultRegulations>` をパススルー（E1/E2）。宣言 revMajor/revMinor は parse→serialize で元から保持（`defaults.ts` の 1.6 は新規作成時のみで往復に無関係）。

**未編集時 rawXml 直通（S1-1 revision API を利用）:** `RoadNetworkEditorLayout` の reverse-sync が、ロード+自動 lane-link 補正後の `CommandHistory.getRevision()` を baseline として控え、位置が baseline のままなら元ファイルテキストを再添付（baseline へ undo すれば復元）、最初のユーザー編集で初めて null 化。エディタを開いて何もしなければ 1.9 マップがバイト等価でシミュレータへ直通（degraded 警告なし）。

**テスト:** 全 13 フィクスチャで serialize∘parse 冪等 + 「原文の全要素が出力に存在」フィデリティ + ⚠代表要素の存在アサーション + header version/vendor/license 往復。E2E 1本（シナリオ経由で 1.9 マップを開く→Road モード往復→無編集 Run で degraded 警告が出ない）。ゲート：typecheck / lint 0 errors / unit 1878 passed / build 全パッケージ / E2E 56 passed。

**次送り（Phase 2 スコープ）:** (1) 1.9 lane-link レイヤ多重度（1 lane-link に複数 `<predecessor>`/`<successor>`）— fast-xml-parser の同名子要素配列と applyExtra のマージ非対応のため単一へ縮退（タグ存在は保持、件数のみ減）。(2) speed `@max` 文字列値（`"no limit"`/`"undefined"`）の型保持 — `speed.max: number` の全消費者に波及する型変更のためフィクスチャ無しでは着手せず。

## 進捗 (2026-07-07 — Phase 2 明示モデル化・完了)

**lanes ドメイン(`6969a5b`):** temporary `<lanes>` 層を raw 保全から `OdrRoad.temporaryLanes?: OdrLanesLayer`(permanent と同じ laneOffset/laneSection 機構)へ昇格し、Phase-2-pending の console.warn を撤去。lane に `@direction`/`@advisory`/`@dynamicLaneType`/`@dynamicLaneDirection`/`@roadWorks`。`<access>` は `@restriction`(optional 化)+ `<restriction>` 子要素の両対応。`laneSection @length`。center lane は `buildCenterLane` が link+roadMark 系のみを出力(1.9 の redefine 準拠 — schema-invalid 入力が center に持っていた禁止子は妥当性優先で意図的に非再出力)。**P1 繰延 2 件を解消**: road-type `speed/@max` が `'no limit'`/`'undefined'` リテラルを型保持(lane speed は XSD `t_grEqZero` により数値のまま — XSD is law)、lane-link predecessor/successor は `OdrLaneLinkRef{id, layer}[]` の完全多重度(`Ex_Lane_MultiLaneLayer` の「同一 id が permanent/temporary 両層に分割」パターンが verbatim 往復。新規フィクスチャ `GT_min_lanelink_multiplicity.xodr` で保護。lane-link `@layer` は XSD 上 xs:string のため out-of-enum も verbatim)。

**junction ドメイン + crossSectionSurface(`7d2c1e9`):** `@type` を 4 値溶接 union(`ODR_JUNCTION_TYPES`)へ。未知 type は警告 + extra 保全。`crossPath`/`roadSection` を XSD 準拠で型付け。connection laneLink に `@overlapZone`/`@fromLayer`/`@toLayer`(こちらの layer は `e_layerType` enum — lane-link 側と対照的、XSD どおり)。virtual connection は `@type` を出力。`boundary`/`elevationGrid`/`planView`/`objects` は設計どおり extra パススルー維持。`crossSectionSurface` は strip 深度まで型付け(polynomial 葉は strip の extra で無損失)、superelevation/shape との排他 assert は parse 時警告として可視化。

**UI(`7f5a233`):** junction エディタが 4 型ドロップダウン + virtual 時の Main Road/Start S/End S/Orientation 編集(undoable)+ crossPath/roadSection 読取サマリ。lane link は複数 ref をレイヤーバッジ付きで列挙。road-type speed は数値と特殊値の両方を設定可能。i18n en/ja、スクリーンショット目視検証済み。

**E2E + ドキュメント(`bffef89`):** virtual junction 属性の表示・編集・Ctrl+Z 復元を固定する E2E を追加(1.9 スイート計 5 件緑)。gap-matrix(A1/A2/A3/B1-B4/B7/E8/E9/F1)と element-support-matrix の該当行へ日付入り注釈。

**監査フォローアップ(`1641f36` + `9d936b2`):** マトリクス監査が発見した最後の属性レベル損失 — `<validity>` `@layer`(e_layerType)— をモデル化(object/signal 両経路、extra バッグ付き)。全 leaf 型の XSD 突合で**宣言済み属性の損失ゼロを確認**。敵対的レビューの MAJOR(junction type 切替で virtual 属性が schema-invalid に出力される)を恒久修正: serializer が virtual 属性を type='virtual' 時のみ出力 + UI は切替時に undoable クリア + connections を持つ junction への 'crossing' 切替を disable。`<access>` ノードの追跡化、`<restriction>` の `type=""` 廃止、direct junction が `connectingRoad=""` を獲得する問題も解消。

**再シリアライズ経路の既知損失: ゼロ(宣言済み属性・モデル化対象範囲)。** 意図的な境界: junction 配下の boundary/elevationGrid/planView/objects と direct `@linkedRoad` は extra パススルー(無損失・個別型なし)/ center lane の禁止子は妥当性優先で非再出力(schema-invalid 入力のみ影響)/ leaf 型の userData バッグ網羅は将来ハードニング。

**テスト:** 全 14 フィクスチャ serialize∘parse 冪等 + fidelity。opendrive 362 / engine 381 / apps/web 384。E2E 65 passed(1.9 スイート 5 件含む)。CI(check + E2E)緑。

**申し送り:** degraded 警告(再シリアライズ警告)の撤去可否は**オーナー判断**(本フェーズは判断材料の提示まで — 既知損失は解消済み)。可視化(temporary 層の 3D 区別・crossSectionSurface/superelevation のバンク表示)は Phase 3、lane 新属性・access の編集 UI と crossing/direct の本格編集は Phase 4。speed 特殊値切替で数値が 0 に戻る小 UX、strip 内 g_additionalData の初回往復での位置正規化(冪等)は既知の NIT。

**degraded 警告の撤去(2026-07-07 オーナー決定、`10f4de0`):** P2 で既知の再シリアライズ損失が解消されたことを受け、編集後シミュレーションの「再生成警告」トーストを撤去(ペイロード解決 — valid キャッシュ→verbatim / 無効→再シリアライズ — の機構自体は不変)。パススルー E2E は「警告が出ない」から「シミュレーションが playback まで到達する」正シグナルへ強化。
## 進捗 (2026-07-07 — Phase 3 可視化)

**バンキング + crossSectionSurface ドメイン(V1):** superelevation バンクを road/lane メッシュへ適用。`stToXyz`(`packages/opendrive/src/geometry/lane-boundary.ts`)が `roll` 引数を取り、断面を完全回転(小角近似ではない)— 横位置 `t·cos(roll)` を XY perpendicular に、`z += t·sin(roll)` を高さに合成。`evaluateSuperelevation(road.lateralProfile, s)` をサンプル毎に評価し、lateralProfile の区間境界を criticalS(通常 + curvature-adaptive 双方)に追加。新設 `evaluateCrossSectionProfile`(`packages/opendrive/src/geometry/cross-section-profile.ts`)は crossSectionSurface の各 strip の多項式葉(`extra` 内)を一度だけパース・キャッシュし、s 方向は elevation と同じ区分3次で厳密評価。t 方向は**明示的な近似**: `height = Σ variant(s)·uᵏ`(u = |t| − innerEdge、k=0/1/2/3 が constant/linear/quadratic/cubic に対応)— ASAM 散文仕様の t 方向厳密式は XSD だけでは確定できないため。内側 strip のみ `<width>` が必須(XSD 準拠)なので、width を持たない strip には道路端まで傾斜が追従するよう 1000m のフォールバック幅を与える。`<tOffset>` は鉛直方向の一様オフセットとして適用(ASAM 定義は横方向シフトだが、CrossFall フィクスチャを authored 高さ −0.375m に正しく配置する近似として採用)。crossSectionSurface と superelevation は XSD assert により排他のため、道路のバンクはどちらか一方のみで決まる。プロパティパネル(道路)に crossSectionSurface 保有時の i18n 注記(`odrProperty.road.crossSectionSurfaceNote`)— 「シミュレータはこのプロファイルを近似表示する」。

**temporary レイヤー可視化 + RoadObjectsGroup ドメイン(V2):** `generateRoadMesh(road, { layer: 'temporary' })` が `OdrRoad.temporaryLanes` を permanent と同じ lane-boundary/laneOffset 機構でメッシュ化。表示は +0.05m z オフセット + オレンジ系 tint(opacity 0.75、vertex color と乗算)の重畳とし、「工事帯」の直感を狙う(道路の複製ではなく)。新規 `showTemporaryLanes` トグル(既定 ON、`data-testid="toggle-temporary-lanes"`、ViewerToolbar の「Temp」ボタン)。新設 `RoadObjectsGroup`(`packages/3d-viewer`)は `road.objects` の各エントリを signal-position-resolver 同型の resolver(s/t/zOffset/hdg/pitch/roll + superelevation roll 合成)で配置し、box(length×width×height)、欠落時は cylinder(radius)、どちらも無ければ 0.5m 立方を半透明プレースホルダーとして描画 — outline/material/skeleton の忠実再現ではない。`repeat` は distance>0 の場合に等間隔展開し、上限 50 個/entry でクランプ(到達時ログ)。新規 `showObjects` トグル(既定 ON、`data-testid="toggle-objects"`、「Objects」ボタン)。両トグルとも既存の `showDrivingDirection` と同じ4点セット(viewer-store フラグ + ViewerToolbar ボタン + ScenarioViewer 配線 + editor-store 永続 pref シード)を踏襲。

**Objects タブ + 読み取り専用プロパティ + 新色 ドメイン(V3):** OdrSidebar に4番目のタブ「Objects」+ `ObjectListPanel`(道路別グルーピング、ヘッダに authored オブジェクト件数「{n} objects」、行に name/type バッジ/s)+ 新設 `OdrObjectPropertyEditor`(apps/web)— id/name/type/subtype/dynamic/position(s,t,zOffset,orientation)/rotation(heading,pitch,roll)/dimensions(box または cylinder)/repeat件数/validity/content件数(outlines/markings/borders)を**読み取り専用**表示。編集は明示的にスコープ外、Phase 4 へ委譲。document/sim 生成物の境界を UI で明示: Objects パネルヘッダが「Document objects」を示し、i18n ヒントで sim 側「Show simulator-generated objects」トグル(ID≥900000000 の合成物、別パイプライン、Phase 0-A のオーナー決定)へ相互参照 — authored 側は string id のまま、9.0e8 概念は導入していない。新 enum 色: `lane-type-colors.ts` に `shared`(#A48858、biking/sidewalk の中間色)・`walking`(#C8A868、非推奨 `sidewalk` と同系統のタン)・`slipLane`(#8C8868、driving 系統の暖灰変化色)の専用色を追加(従来の `#606060` デフォルトフォールバックから昇格)。`OdrLanePropertyEditor` の `LANE_TYPES` にも3種を追加(パース/シリアライズ/色フォールバックだけでなく UI で選択可能に)。`road-mark-mesh-builder.ts` に `black`(#1A1A1A、3D 路面の暗背景でも視認できるよう純黒から僅かに持ち上げ)を追加、既存 `violet`(#8800FF)と並立。`OdrLanePropertyEditor` の `ROAD_MARK_COLORS` にも両方追加済み。**既知の残存ギャップ**: 2D 断面ビュー `CrossSectionView.tsx` は独自の別 `ROAD_MARK_COLORS`(rgba 文字列形式、mesh builder ともプロパティエディタとも別ファイル)を持ち、本波では未着手 — black・violet とも依然欠落し、2D 断面では `standard`/白と区別できない。また、本リポジトリの `test-fixtures/` 配下に文字どおり `type="slipLane"` を持つレーンを含むフィクスチャは一件もない(全 1.9 フィクスチャを grep して確認済み)— slipLane の色/UI 対応はコード検査で確認したものであり、実データに対する E2E/スクリーンショットでの固定はできていない。

**E2E + ビジュアルキャプチャ + ドキュメント(V4、本波):** `apps/web/e2e/opendrive-1.9.spec.ts` に機能テストを2件追加(既存5件→計7件)— (1) 新トグル2種の既定 ON 確認 + `.click()` による aria-pressed 往復(作成過程でツールバー/Speed スライダー重なりバグを発見 → チーム側で並行修正、詳細は次項)、(2) Objects タブが document-authored オブジェクトを一覧表示し行選択で読み取り専用プロパティエディタを表示する確認(Ex_Objects.xodr、authored `<object>` 12件、ヘッダ件数アサーション + 先頭オブジェクトの name="house"/type="building"/subtype="building" をプロパティパネルで固定)。新規フィクスチャを `apps/web/e2e/fixtures/opendrive/` へ複製: `Ex_Objects.xodr`・`Ex_Slip_Lane.xodr`・`Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr`・`velodrome.xodr`(`Thirdparty/GT_Sim/resources/xodr/` 由来 — 当初計画の `multi_intersections.xodr` はその `<superelevation>` 係数が全てゼロで実際には傾かないことが判明したため、明確な −60° バンクを持つこちらに差し替え。詳細は下記訂正欄)。新規 CI-skip ビジュアルキャプチャ spec `apps/web/e2e/p3-visuals.spec.ts`(lht-direction-arrows.spec.ts 方式: `test.skip(!!process.env.CI, ...)`、最大面積 canvas のスクリーンショット、出力先 `tmp/p3-visuals/` — `test-results/` は playwright が実行毎に消去するため使わない)— banking.png(velodrome、斜め視点)・crossfall.png(CrossFall_LeftTurn_1)・temporary-on.png/temporary-off.png(MultiLaneLayer、トグル前後)・objects-on.png/objects-off.png(Ex_Objects、トグル前後)・slip-lane-colors.png(Ex_Slip_Lane — 上記 V3 の注記どおり、entry/exit/median/border/driving/shoulder のレーン色 + 16件の矢印/ポールオブジェクトを併せて示すもので、slipLane enum 自体のスウォッチではない)の計7枚。マトリクス更新: `docs/development/odr-1.9-gap-matrix.md`(A1・F1・B5・B6 行)と `docs/development/odr-element-support-matrix.md`(OBJECTS セクション冒頭 + `road/objects/object` 行 + repeat/objectReference・tunnel・bridge 行 + `lane @type` 行 + roadMark black/violet 行、および Synthesis セクションの OBJECTS/LANES ロールアップ行・alignment テーブルの lane-layers/crossSectionSurface 行・優先度リスト項目7・9・contradiction #3)へ `*[✅ 2026-07-07 P3: ...]*` の日付入り注釈を P2 の precedent どおりに追加(既存の採点セルを勝手に書き換えず、検証済みの範囲のみ注記を追記)。

**⚠→✅ 本波で発見し、並行して修正されたバグ:** トグル E2E 作成中に、標準 1600×900 ビューポート・Road Network モード・サイドバー/断面/プロパティパネルを開いた状態で、`ViewerToolbar` の単一行ツールバー(`packages/3d-viewer/src/components/ViewerToolbar.tsx` の `toolbarStyle`)が今や十分長くなり、末尾が常時最前面の「Speed」フライトコントロールスライダー(`ScenarioViewer.tsx` の `speedSliderStyle`: `top:8; right:8`、無条件レンダリング)の直下に重なることを発見。本セッションで実測: Speed のコンテナは x:[1019,1190] y:[92,118.5] に及び、「Temp」ボタン(x:[1032,1074])と「Objects」ボタン(x:[1078,1138])は完全にその範囲内、「Dir」(x:[991,1028])も末尾約8px が重なる。実際のスクリーンショットでも Temp/Objects が Speed スライダーの裏に完全に隠れて**視覚的にも見えない**ことを確認 — クリック不能なだけでなく存在に気づく手がかりすらない状態だった。**2段階で確認**: (1) 素の `.click()` はタイムアウト、(2) `click({ force: true })` も aria-pressed 不変化で失敗(実ブラウザのヒットテストは座標上の最前面要素へイベントを配送するため、force でも実要素には届かない)。E2E は当初キーボード操作(`.focus()` + `.press('Enter')`)で回避していた。

**修正済み(`a1040eb`):** チーム側が並行して `ViewerToolbar.tsx` の `toolbarStyle` に `right: 200` を追加 — 行の利用可能幅を制限し、Speed スライダーの列に達する前に `flexWrap` が確実に折り返すようにする恒久修正。修正確認後、本波の E2E 側もキーボード回避を撤去し通常の `.click()` に戻した(`opendrive-1.9.spec.ts` のトグルテスト、`p3-visuals.spec.ts` の temporary/objects トグル)— 全テスト実クリックで緑を再確認済み。

**フィクスチャ選定の訂正(banking.png):** 当初計画どおり `test-fixtures/esmini/xodr/multi_intersections.xodr` を試したが、その2件の `<superelevation>` は**係数(a/b/c/d)が全てゼロ**(grep で確認)— コードパスは通るが道路は数学的に完全に平坦で、どの角度から撮っても傾きは映らない。より広く `test-fixtures/`・`Thirdparty/` 配下を探索し、`Thirdparty/GT_Sim/resources/xodr/velodrome.xodr`(単一道路のベロドローム周回路、90行)を発見 — カーブ区間に `a=-1.0471975511965976`(= −60°)の明確なバンクを持つ。banking.png はこちらに差し替え済み。ミニマップクリックでメインカメラをテレポート focus させる機構(`Minimap.tsx` の `onClickPosition` → `viewer-store.setFocusWorldPosition` → `CameraController` のスムーズフォーカスアニメーション)を発見・活用し、既定カメラでは道路がフレーム外になる3フィクスチャ(banking、crossfall、一部)のカメラ合わせに使用(単純なズーム/回転操作より確実)。

**テスト:** `apps/web/e2e/opendrive-1.9.spec.ts` 7件(既存5件 + 新規2件)+ `apps/web/e2e/p3-visuals.spec.ts` 5件、計12件全緑(ローカル実行、2.3分)。新規2件の内訳は上記参照。ビジュアルは5テストで7枚のスクリーンショットを生成(temporary/objects はトグル前後で1テスト2枚)。`node scripts/maturity/validate-capabilities.mjs` も緑(files=11, total=88)。

**スクリーンショット:** すべて `apps/web/tmp/p3-visuals/`(gitignore 済み、`test-results/` は playwright が実行毎に消去するため使わない — 絶対パス `E:\Repository\GT-karny\GT-OpenSCENARIOEditor\apps\web\tmp\p3-visuals\`)。banking.png(312KB, velodrome.xodr のバンクカーブ — 自動カメラでは傾きがやや控えめにしか読み取れず、対話的に操作した方が分かりやすい)/ crossfall.png(344KB, CrossFall_LeftTurn_1 — 断面の傾きが明瞭に見える)/ temporary-on.png・temporary-off.png(275KB/250KB, MultiLaneLayer のオレンジ重畳トグル前後 — 明瞭な差分、ツールバー修正後のスクショで Temp/Objects ボタンが Speed スライダーと重ならず完全に見えることも視覚確認)/ objects-on.png・objects-off.png(301KB/288KB, Ex_Objects の半透明プレースホルダー表示トグル前後 — 明瞭な差分)/ slip-lane-colors.png(342KB, Ex_Slip_Lane の交差点、レーン色が明瞭)。全て876×417(largest canvas)。目視確認済み — banking.png 以外は全て意図どおり明瞭。トグル系テストは全てツールバー修正後に実クリックで再検証済み(`.focus()`+`.press('Enter')` の回避策は撤去)。

**次送り:**
- tunnels/bridges は依然 3D 表現ゼロ(Objects タブには読み取り専用行として列挙されるが、3D ビューには出ない)。
- crossSectionSurface の t 方向評価は明示的な近似であり、ASAM 散文仕様の厳密閉形式ではない(s 方向は厳密)。
- `CrossSectionView.tsx`(2D 断面)の独自 `ROAD_MARK_COLORS` は black/violet とも依然欠落。
- オブジェクト編集 UI(作成・更新・削除)は Phase 4 スコープ — 本波は読み取り専用表示のみ。
- 本リポジトリのどのフィクスチャも文字どおりの `type="slipLane"` レーンを持たない — slipLane の色/UI 対応は実データでの E2E/スクショ固定がまだない。
- banking.png は velodrome.xodr のバンクを自動カメラで撮影しているが、角度がやや浅く傾きが控えめにしか見えない — 対話的に操作すればより明瞭(crossfall.png は明瞭に撮れている)。

**敵対的レビューと処置(V5、`2a906ea` + `8679456`):** 関与していない Opus レビュアーの判定は SHIP-WITH-FIXES(BLOCKER 0 / MAJOR 2)。M1「メッシュはバンクするがエンティティ/標識/レーンスナップ/矢印/ラベルのリゾルバは平坦投影のまま」= velodrome でエンティティが路面下 ~8m に埋まる潜在回帰 → `bankedSurfacePoint`(新設、`packages/3d-viewer/src/utils/banked-surface.ts`)へ全リゾルバ・全オーバーレイを統一し、`getCrossSectionEvaluator`(WeakMap キャッシュ)で mesh とリゾルバが道路毎に同一評価器を共有する恒久修正(velodrome 数値 t=−9・roll=−60° → +7.79m/−4.5m をテストで固定)。M2「ツールバー修正後も e2e がキーボード回避のまま + 陳腐化コメント」→ 実クリック化 + 回帰ガード注記に圧縮。crossSectionSurface 道路ではリゾルバも高さ場を適用(css⇔superelevation の排他 gating を lane-boundary と厳密一致)。残余 MINOR(2D 断面ビューの css 平坦・色欠落・×3誇張、object の単一オイラー合成)は gap-matrix に日付入りで記録し次送り。3d-viewer テスト 169→178。

**フェーズ最終ゲート:** typecheck / lint 0 errors / unit **2,253**(P2 末 2,189 から +64)/ E2E 機能スイート緑(lht-default-rule はスイート並列時の `newPage` 30s タイムアウトフレーク1回 — 単体 47.9s 緑で回帰でないことを確認、既知の並列 WASM 飽和)/ CI(check + E2E)**success**(`8679456`)。

## 進捗 (2026-07-08 — Phase 4 編集 UI + 死にコマンド配線・完了)
## Phase 4 完了（編集 UI + 死にコマンド配線）

波分割（直列、`tmp/p4-design.md` 参照）: **X1**(死にコマンド配線)→ **AUQ**(semantics UI 方向確認、オーナー承認)→ **X2**(shared 直列: linkedRoad + crossing/direct 編集 + poly3 + version 出力)→ **X3**(lane 属性/access UI)→ **X4**(semantics)→ **X5**(E2E + docs、本ノート)。

### X1 — 死にコマンド配線 + speed stash（コミット `042942c`）
- **Controllers**: `OdrSidebar` に5番目のタブ「Controllers」+ `ControllerListPanel`（add/rename/delete）+ `OdrControllerPropertyEditor`（id/name/sequence + control エントリ一覧編集）。既存の Add/Update/Remove コマンドを配線 — 併せて `markSideEffects`（dirty マーク）の欠落を修正
- **Geometry**: `addGeometry`/`removeGeometry` store action を既存コマンドへ配線。`OdrRoadPropertyEditor`(Plan View)に「Add segment」、`OdrGeometryPropertyEditor`に「Delete segment」（最終セグメントは削除不可）
- **Elevation**: `ElevationGraphEditor` に `onControlPointCommit`（mouseup 時に1回の undo 単位でコミット、ドラッグ中はローカルプレビュー）を追加、`RoadNetworkEditorLayout` を配線
- **Road type**: エントリ add（既定 town/40km/h）/ remove ボタン
- **Speed stash**: numeric↔special 切り替え時に直前の数値を保持（戻すと 0 になる UX バグを解消）

### X2 — linkedRoad + junction 構造編集 + poly3 + バージョン出力（コミット `108cb1f`, `14f1faf`）
- **linkedRoad 昇格**（shared）: `OdrJunctionConnection.linkedRoad?: string` を型付け、parse/build が `extra` から消費するよう変更（fidelity needle 差し替え）
- **crossPath / roadSection 編集可能化**: `OdrJunctionPropertyEditor` に add/remove/編集行（crossPath: crossingRoad/roadAtStart/roadAtEnd + start/endLaneLink s/from/to、roadSection: roadId/sStart/sEnd）。直接接続の `linkedRoad` も編集可能なテキストフィールド化。すべて undoable
- **RemoveJunctionConnectionCommand**: 各 connection 行に削除ボタン
- **poly3/paramPoly3 編集可能化**: `OdrGeometryPropertyEditor` の `Poly3Fields`/`ParamPoly3Fields` から `readOnly` を撤去（既存の `applyGeometryUpdate` 再構築ロジックがそのまま使える）
- **バージョン自動昇格出力**: `detectOdr19Constructs(doc)`（`packages/opendrive/src/version/detect-odr19.ts`、純関数）+ `willResolveToOdr19` を追加。`XodrSerializer.serializeFormatted(doc, {resolveVersion: true})` は revMinor<9 かつ 1.9 構造検出時のみ 9 へ昇格して出力（既定は `false` — 冪等テストは無傷）。アプリの保存経路（`saveXodr`/`saveAsXodr`/`handleSaveAsXodr`）はすべて `resolveVersion: true` を渡し、昇格時に `labels.savedAsOdr19` トースト通知

### X3 — lane 属性・access UI + deprecation（コミット `17268c1`）
- **Lane Flags**: `direction`（`EnumSelect`、both/reversed/standard + 未設定）、`advisory`（both/inner/none/outer + 未設定）、`dynamicLaneType`/`dynamicLaneDirection`/`roadWorks`（チェックボックス）。左右レーンのみ（center レーンは XSD どおり除外）
- **Access**: エントリ一覧の add/remove（sOffset + rule allow/deny）+ エントリごとの `<restriction>` type チップ add/remove（`HOV` 含む）。旧 `@restriction`（レガシー属性）は読み取り専用バッジとして共存
- **Deprecation ヒント**: `LANE_TYPES` に deprecated サフィックス + Badge「Deprecated」+ title に置換先（sidewalk→walking / bidirectional→@direction / special1-3→access restrictions / bus・taxi・HOV→access restrictions / mwyEntry→entry / mwyExit→exit）

### X4 — semantics 編集 UI（コミット `3e356f5`、オーナー承認: 2026-07-07 AUQ）
- **shared 型**: `OdrSignalSemantics{entries: OdrSemanticsEntry[]}`（kind 判別 union、~13 種）+ participant（animal/person{category}/vehicle{category}）。各 kind の enum は const 配列で溶接
- parse/build: signal の `<semantics>` を `extra` から消費（fidelity needle 差し替え、空 `<semantics/>` も `{entries:[]}` として保持）
- **UI（オーナー承認済み: フラット行リスト方式）**: `SignalSemanticsEditor` — エントリごとに kind ドロップダウン + kind 別インラインフィールド + × ボタン、road-type エントリ編集と同様式。`OdrSignalPropertyEditor` の「Semantics」節に配線、undoable
- フィクスチャ: `GT_min_signal_semantics.xodr`（手書き 1.9、signal id=100 に speed/lane/priority/prohibited/supplementaryTime/supplementaryAllows/supplementaryDistance/supplementaryEnvironment の全種、signal id=101 は空 `<semantics/>`）

### X5 — E2E + 総括素材（本波）

**新規 E2E（`apps/web/e2e/road-editing.spec.ts`、5 テスト、全緑）**
1. `elevation control-point drag persists and Ctrl+Z undoes it` — Ex_Objects.xodr の唯一の elevation control point をドラッグ→ `<title>` の a 値変化を確認 → Ctrl+Z で a=0.000 に復帰
2. `controller add, rename, undo chain, and delete` — Add→デフォルト名確認→Rename→リスト反映確認→Ctrl+Z(rename取消)→Ctrl+Z(add取消、件数復帰)→Ctrl+Y×2(redo)→リスト項目の削除ボタンで明示的に削除
3. `lane direction edit persists and Ctrl+Z undoes it` — road 1 の lane -1（driving）を選択、Direction を reversed に設定→persist確認→Ctrl+Zで(none)に復帰
4. `signal semantics: add entry, edit value, undo` — GT_min_signal_semantics.xodr の空 semantics 信号に Add entry→Value編集→Ctrl+Z(値取消)→Ctrl+Z(エントリ取消、空表示復帰)
5. `editing a pre-1.9 document to add a 1.9 construct and saving auto-bumps revMinor to 9` — revMinor=8 のプロジェクト内シードファイルに lane direction 編集で 1.9 構造を追加→File > Save→`labels.savedAsOdr19` トースト確認→サーバ経由で保存済みファイルを読み戻し `revMinor="9"` を確認

**既存回帰**: `opendrive-1.9.spec.ts` 7/7 緑（無変更で回帰なし）

**視覚キャプチャ（`apps/web/e2e/p4-visuals.spec.ts`、CI スキップ、`tmp/p4-visuals/`）**
- `semantics-editor.png` — SpeedLimit50 信号、Semantics 節（speed/lane/priority エントリ表示）
- `controllers-tab.png` — Controllers タブ + プロパティエディタ（フルページ）
- `lane-flags-access.png` — fabriksgatan.xodr の sidewalk レーン、Deprecated バッジ + Lane Flags + Access Restrictions 節
- `junction-structural.png` — GT_21（commonCrossPath junction、crossPath 1件 + connection 1件、編集可能行）

**フィクスチャ追加**（`apps/web/e2e/fixtures/opendrive/`）: `GT_min_signal_semantics.xodr`、`GT_21_common_junction_crosspath_19.xodr`、`fabriksgatan.xodr`（esmini デモ資産の再利用、新規作成ではない）

**ドキュメント更新**: `docs/development/odr-1.9-gap-matrix.md`（A3/A8/B1/B2/B3/D2/E8 に P4 追記）、`docs/development/odr-element-support-matrix.md`（controllers/elevation/geometry/road-type/junction structural/lane 1.9 属性/access/semantics の EDIT 列を更新、P2 パスで見落とされていた lane direction/advisory/dynamic* の詳細行の model/parse/serialize 表記も修正）

## オーナー決定の適用状況

- **P4-6 バージョン出力 = 自動昇格 + 通知**（確認ダイアログ・バージョン選択 UI は作らない）: 実装済み、E2E で固定
- **semantics UI = フラット行リスト方式**（2026-07-07 AUQ 承認）: 実装済み
- **main 反映（マージ・push・v0.5.0 リリース）**: 本ノートの範囲外。フェーズ末の別ステップとして実施予定

## 完了条件チェック

- [x] 配線した全編集が undo/redo + 導出ダーティと整合（E2E 固定）
- [x] 1.9 構造を含むファイルの保存が revMinor=9 で出力（自動昇格 + 通知、冪等テストは無傷）
- [x] poly3/paramPoly3・lane 新属性・access・crossing/direct・semantics が編集可能
- [x] semantics UI はオーナー承認済みの形
- [x] 新規 E2E 5件 + 既存 opendrive-1.9 7件 + 視覚キャプチャ 4件、全緑。`pnpm maturity:validate` 緑

## 次送り（Phase 5 以降）

- **明示的バージョンピッカー UI**（A8 T4 完全形）— 現状は自動昇格のみ、ユーザーが対象バージョンを選ぶ UI は未実装
- **poly3/paramPoly3 の新規作成**（変換元にできるのは line/arc/spiral のみ、既存セグメントの編集のみ可能）
- **laneValidity `@layer` の編集 UI**（型はあるが UI なし）
- **junction `boundary`/`elevationGrid`/junction-level `planView`/`objects`** — 設計どおり `extra` パススルーのまま、個別型・UI化はしない
- **direct-junction 接続の新規作成 UI**（既存接続の `linkedRoad` は編集可能、ゼロから作る UI はまだ無い）
- **トンネル/ブリッジの 3D 表現**、object のアウトライン/マテリアル忠実度
- **監査パネル + GT_RM_* embind 再公開**（Phase 5、`tmp/p5-prompt.md` にドラフト済み）

**敵対的レビューと処置(X6、`12001ab`):** 判定 SHIP-WITH-FIXES(BLOCKER 0 / MAJOR 2)。M1「junction type 切替が variant 子要素(crossPath/roadSection)を残骸化し schema-invalid 出力」(P2 の virtual 属性 MAJOR と同型)→ serializer の type 別ゲート + UI 切替時の undoable クリア + 検出器整合の三重防御で恒久修正。M2「geometry add/remove が road.length と s 連続性を破壊」→ Add/Remove/Update コマンド内で planView を正規化(後続セグメントの s・開始姿勢を再連鎖 + road.length 再計算、immer パッチで undo も正確)。レビュー中に私自身が先行発見した「検出器に semantics が未登録(1.6 ファイル + semantics 編集で昇格漏れ)」も修正済み(`7c30b91`)。低優先の指摘(access の旧属性と子要素の同時出力=冗長だが valid、ゼロ差分ドラッグの no-op コマンド)は次送り。

**フェーズ最終ゲート:** typecheck / lint 0 errors / unit **2,337**(190 files、P3 末 2,253 から +84)/ E2E **80 passed** + flaky 1(retry 緑、既知の並列飽和)/ CI(check + E2E)緑。
