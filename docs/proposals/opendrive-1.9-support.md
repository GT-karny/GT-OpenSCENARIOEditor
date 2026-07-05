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
- Road Network エディタ経由で xodr を開くと `roadNetworkXml` がクリアされ（`RoadNetworkEditorLayout.tsx:93` の odrStore→editorStore 同期に rawXml 経路なし）、`<include>` 道路を sim へ渡す経路はプロジェクトのシナリオ自動ロードのみ — 既存の制約。Phase 1 の「未編集時 rawXml 直通」で解消予定。
- 合成オブジェクトは現状 apps/web のリスト UI には未出現（`EntityListPanel` は authored entity のみ、3d-viewer 消費者は名前照合で非 authored を除外）。よってフィルタは取り込み境界（`esmini-wasm-service.ts`）に配置し全消費者へ将来にわたり適用。
- 未知ジオメトリは raw 保全でなく明示エラーを選択（`OdrGeometry` 判別共用体への raw variant 追加はスコープ超過）。Phase 1 のパススルー基盤で再検討。

## 進捗 (2026-07-06 — Phase 1 ロスレス往復基盤)

**消費追跡パススルー機構を確立し、全 parse/build モジュールへ展開:** shared に `OdrExtra { attrs?, children? }` を追加し、parser に `trackNode()`（`takeAttr`/`takeChild`/`takeChildren`/`rest`）、serializer に `applyExtra()` を新設。header / road（+road-type +lateralProfile）/ lanes（+laneSection）/ objects（+outline +material）/ signals / junctions（+laneLink）/ controllers を追跡アクセサへ移行し、各ノードの未対応属性・子要素を `extra` として往復保全。**個別実装なしで**次が往復するようになった（gap-matrix ⚠ 行）：crossSectionSurface/surfaceStrips（F1）、object skeleton/surface/curveLocal+outline 内 markings（C1/C3/C4）、signal semantics/board（D2/D3）、junction crossing/direct サブツリー+crossPath（E9）、laneLink `@overlapZone/@fromLayer/@toLayer`（E8）、road/type `@country`（F5）、lane `@direction`（B1）、lane/section userData のベンダーペイロード、空 `<surface>`/`<railroad>`。ヘッダーは `@version/@vendor` を明示モデル化+`<license>`/`<defaultRegulations>` をパススルー（E1/E2）。宣言 revMajor/revMinor は parse→serialize で元から保持（`defaults.ts` の 1.6 は新規作成時のみで往復に無関係）。

**未編集時 rawXml 直通（S1-1 revision API を利用）:** `RoadNetworkEditorLayout` の reverse-sync が、ロード+自動 lane-link 補正後の `CommandHistory.getRevision()` を baseline として控え、位置が baseline のままなら元ファイルテキストを再添付（baseline へ undo すれば復元）、最初のユーザー編集で初めて null 化。エディタを開いて何もしなければ 1.9 マップがバイト等価でシミュレータへ直通（degraded 警告なし）。

**テスト:** 全 13 フィクスチャで serialize∘parse 冪等 + 「原文の全要素が出力に存在」フィデリティ + ⚠代表要素の存在アサーション + header version/vendor/license 往復。E2E 1本（シナリオ経由で 1.9 マップを開く→Road モード往復→無編集 Run で degraded 警告が出ない）。ゲート：typecheck / lint 0 errors / unit 1878 passed / build 全パッケージ / E2E 56 passed。

**次送り（Phase 2 スコープ）:** (1) 1.9 lane-link レイヤ多重度（1 lane-link に複数 `<predecessor>`/`<successor>`）— fast-xml-parser の同名子要素配列と applyExtra のマージ非対応のため単一へ縮退（タグ存在は保持、件数のみ減）。(2) speed `@max` 文字列値（`"no limit"`/`"undefined"`）の型保持 — `speed.max: number` の全消費者に波及する型変更のためフィクスチャ無しでは着手せず。
