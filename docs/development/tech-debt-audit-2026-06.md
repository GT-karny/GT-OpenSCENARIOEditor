## 進捗 (2026-06-13)

**Phase 0 完了（A表 全10件）:** A1 雲量 enum を shared の XSD 由来配列に統一・A2 SynchronizeActionEditor 新設・A3 ParameterAction/VariableAction modify 往復修正・A4 VariableDeclarations 順序修正・A5 roadMark typeDef 往復修正・A6 OpenDRIVE Redo 配線（コマンドクラス採用）・A7 MCP lane-change relative 修正・A8 MCP import_xosc ロスレス化・A9 サーバー 127.0.0.1 バインド + CORS 制限・A10 Windows スクリプト修正 + ESLint no-any error 化。

**Phase 1 完了（B表 削除 約10,000行）:** サーバーファイル/シナリオ/シミュレーション REST+WS API・WASM ストリーミングパス・サーバー WS 自動接続・templates action-components・.osce.json 操作・esmini 生成物 2.3MB・node-editor PropertyPanel/Timeline クラスタ・3d-viewer 孤児群・shared editor-enums ほか。userData/dataQuality/include は削除でなく配線（往復対応）。

**Track A 完了:** 往復修正続編（AnimationAction/LightStateAction・TrajectoryRef・EnvironmentAction CatalogReference・ClothoidSpline・RandomRouteAction・TrajectoryPosition）、A2 エラー可視化・A3 自動保存+クラッシュ復旧・A4 未保存ガード・A6 ドラッグ&ドロップ+最近使ったファイル。E2E スイートを HomeScreen フローに合わせて全面修復（31 passed）。残: A1 WASM 完遂・A5 帳簿（本更新で対応）。

## 進捗 (2026-07-02 追記)

**A1 WASM 完遂:** GT_Sim を f2674640（upstream v3.3.0 キャッチアップ + SwapAndClearDirtyBits 修正）へ更新し再ビルド。凍結エンティティ問題解消。wasm-simulation E2E を「位置が実際に変化する」アサーション + シード5シナリオのスイープに強化。

**Phase 2 完了（C表 重複統合）:** math utils export + normalizeAngle（(-π,π] 統一）/ findLaneSectionAtS / evalCubic / ensureArray 統合、opendrive-engine ジオメトリ評価を正規評価器へ置換（junction-validator のスパイラル直線フォールバック修正）、CommandHistory/BaseCommand/CompoundCommand を scenario-engine に単一ソース化（collapseUndo を ICommandHistory へ昇格）、デフォルトエンティティ定義を物理的に現実的なカテゴリ別テーブルへ一本化（AI/UI 作成の乖離解消）+ generateId → shared、detectElementType / action サマリーを node-editor 正本化（'Longitudinal Distance' に統一）、EntityRefSelect 3兄弟を共有コア化（消費者無変更）、信号アイコンレンダラーをエンジン集約（BULB_SPACING 0.38 統一）。※WS 型は Phase 1 で削除済みのため対象外。

**Phase 3 完了（型固定）:** osc-enums を v1.3.1 XSD から再生成（~35 enum を const 配列 + union 化、CoordinateSystem 'world' 追加、ODR enum 18型削除）しモデルフィールド + UI ドロップダウンへ配線、openscenario を unknown ベース RawXml 化（any 255 / eslint-disable 272 → 0、eslint override 撤廃）、property エディタに型付き updater ヘルパー導入（as Partial 106 → 0）、OdrGeometry を判別共用体化（?? 0 フォールバック退役）。

**Phase 4 前倒し分:** route/trajectory 編集スタック統合（draft-edit-store ファクトリ、3D 共有プリミティブ、編集フックのセレクタ化 = EditorLayout ドラッグ時全体再レンダー解消）。

**機能側（ロードマップ フェーズ2）:** B1 軌跡プレビュー（ClothoidSpline 実装 + 車線変更遷移プレビュー + Init ルート走査）、B2 バリデーション UX（保存時自動検証・debounced 検証・エラーナビ可視化・i18n 契約修復）、B5 クリップボード強化（エンティティ複製・複数選択・Ctrl+D・複数削除単一 undo）、B4 タイムライン操作（スクラブ・ズーム・イベントブロックドラッグ→undo 可能な時刻書き戻し）。

ゲート実績: typecheck / eslint 0 エラー、vitest 1,485、E2E 45 passed（+preview/validation/clipboard/timeline 新規ケース）。

---

# 技術的負債監査レポート & リファクタリング・ロードマップ（2026-06）

> 実施: 2026-06-13 | 手法: マルチエージェント監査（領域別14 + 横断スイープ6、計97エージェント）
> 高重要度・削除候補の指摘は別エージェントによる敵対的検証済み（誤検出は除外・補正済み）
> 対象: 追跡済みコード約135k行（`Thirdparty/`, WASM成果物, 進行中のルート編集作業は除外）
> 機能面の提案は [docs/proposals/feature-roadmap-2026-06.md](../proposals/feature-roadmap-2026-06.md) を参照

## 総評

コードベースは全体として健全（領域別ヘルススコア平均 6.5/10）。型規律・パッケージ分離・コアエンジンのテストは良好。
負債は以下の5パターンに集中している:

1. **仕様準拠バグ**: enum の手書き複製が XSD からドリフトし、不正な .xosc/.xodr を出力する（検証済みのものだけで5件）
2. **死コードの塊**: 廃止機能（テンプレート、サーバーサイドシミュレーション）と実験の残骸が合計 **約8,000行 + 2.3MB のコミット済み生成物**
3. **コピペ重複**: 小さな数学ヘルパーから900行級のUIコンポーネントまで。根本原因は `@osce/opendrive` の utils が package index から export されていないこと等
4. **God コンポーネント**: 700〜1,800行のファイル6本に変更が集中する構造
5. **品質ゲートの形骸化**: lint/clean が Windows で動かない、ESLint の no-any が warn 止まり、E2E が CI 未実行

---

## A. 確定バグ（検証済み・修正必須）

リファクタリング以前に修正すべき正しさの問題。すべて敵対的検証で実在確認済み。

| # | 内容 | ファイル | 規模 |
|---|------|---------|------|
| A1 | 雲量 enum が XSD からドリフト（`oneOkta`/`skyObscured` 等の不正値を .xosc に出力。正しい値は選択不可） | `apps/web/src/components/property/actions/EnvironmentActionEditor.tsx` | S |
| A2 | SynchronizeAction の必須属性 `masterEntityRef` を編集する UI が無く、空文字のまま出力される | `ActionPropertyEditor.tsx`（POSITION_BASED_TYPES 経由で TeleportActionEditor に誤ルーティング） | M |
| A3 | ParameterAction/VariableAction の modify が往復で壊れる（`addValue` が `MultiplyByValue` + 非スキーマの `<ByValue>` になり、再パースで例外） | `packages/openscenario/src/serializer/build-actions.ts:386` | S |
| A4 | `VariableDeclarations` が Storyboard の後に直列化され XSD の sequence 順序違反 | `packages/openscenario/src/serializer/xosc-serializer.ts:36-39` | S |
| A5 | xodr パーサーが roadMark の `<type>` 子要素を黙って破棄（属性名と衝突、ロード→セーブでデータ消失） | `packages/opendrive/src/parser/xml-helpers.ts`（attributeNamePrefix:'' が原因） | M |
| A6 | OpenDRIVE ストアの Redo が大半の操作で無音 no-op（インラインコマンドの execute が空。undo スタックも壊す）。影響面は roadNetwork モードの Ctrl+Y とツールバー | `packages/opendrive-engine/src/store/opendrive-store.ts` | S〜M |
| A7 | MCP `add_lane_change_action` が relative 対応を謳いながら常に absolute を出力（プロンプトの指示通りに使うと誤った車線へ） | `packages/mcp-server/src/tools/action-tools.ts:147-152` | S |
| A8 | MCP `import_xosc` が fileHeader/roadNetwork/catalogLocations/parameters/stopTrigger を黙って破棄 | `packages/mcp-server/src/tools/scenario-tools.ts:118-158` | M |
| A9 | 開発サーバーが 0.0.0.0 バインド + 任意オリジン CORS + 任意パスのファイル読み書き API（起動中は LAN/任意サイトからファイルアクセス可能） | `apps/server/src/main.ts`, `app.ts`, `services/file-service.ts` | S |
| A10 | `pnpm lint` / `lint:fix` / `clean` が Windows で動作しない（シングルクォートglobと `rm -rf`。/ship パイプラインのゲートが素通り） | ルート `package.json`（`format` は動作する） | S |

未検証だが高確度の同類（修正時に併せて確認）: AnimationAction/LightStateAction の往復データ消失、FollowTrajectoryAction の TrajectoryRef 破壊（空 Polyline 再パース例外）、`followToConnectingRoad` のシリアライザ/パーサー非対称、TrajectoryPosition→WorldPosition(0,0) への無音変換、RandomRouteAction（v1.3 正規要素）でパース例外、ラウンドトリップテストがフィクスチャ欠落時に無音パス。

---

## B. 死コード一覧（検証済み・削除候補）

すべて repo 全域 grep（動的 import / 文字列参照 / テスト含む）で消費者ゼロを確認済み。**推定合計 約8,000行 + 2.3MB**。

### 廃止機能の残骸（オーナー判断が必要なもの）
- **サーバーファイル API 一式**: `/api/files/*`(5), `/api/scenario/*`(2), `/api/simulation/*`(3), WS の file:open/save ハンドラ — web は project-api と Electron IPC のみ使用。A9 のセキュリティ問題もこの面に存在するため、削除すれば同時に解消
- **WASM ストリーミング実行パス**: `{type:'step'}`/'frame'/'completed'、onFrame 系コールバック、simulation-store の addStoryBoardEvent 等 — バッチモードに置換済みで到達不能
- **サーバー WebSocket 自動接続**: `useServerConnectionContext` は消費者ゼロなのに、毎起動時に localhost:3001 へ最大10回再接続を試みる（Electron では必ず失敗: 埋め込みサーバーはランダムポート）
- **templates の action-components サブシステム**(~400行) と全8ユースケースの no-op `reconcile()` + scenario-engine の `reconcileComponent`
- **.osce.json ファイル操作**: `loadOpenDrive`/`saveOsce`/`exportXodr` と editor-store の osce ハンドル状態、opendrive-engine の `parseOsceJson`/`serializeOsceJson`（消費者はこの死んだ関数のみ）

### パッケージ別の確定死コード
- **opendrive-engine**: コマンドクラス8ファイル **約2,000行** + テスト約1,400行（ストアがインラインで再実装している。**A6 の Redo バグはこれを配線すれば同時に直る** — 削除か配線かを A6 とセットで決めること）。SignalAssembly 系の未使用 interface、空の BUILT_IN_ASSEMBLY_PRESETS、createVirtualJunction 等（※ buildRoutingOverrides は使用中につき残す）
- **esmini**: コミット済み生成物 `src/generated/osi.js` **2.3MB/45,883行**（型のみ使用。実行時は proto-loader）。`proto:gen` は存在しないファイルを参照しており再生成不能。未使用 REST メソッド群
- **node-editor**: PropertyPanel クラスタ ~492行（ライトテーマでAPEX違反）、Timeline クラスタ ~450行（stale-data バグ持ち）、selectors.ts、collapse-button、editor-types.ts、use-keyboard-shortcuts（唯一の消費者が無効化済み）、未使用 dep `lucide-react`
- **3d-viewer**: 孤児7ファイル（ApexGlassMaterial、LaneMesh + legacy registry、useEntityInteraction、VehicleLightIndicators、TrafficLightSignal、signal-shapes 等）、RoadCreationTool/LaneGhostPreview、playback ストアスライス、index.ts の外部消費者ゼロな ~25 export（※ getSignalTexture/housingForBulbCount/ARROW_SUBTYPE_MAP/snapToGrid は内部使用ありのため削除不可）
- **apps/web**: 孤児コンポーネント4（ParameterListPanel, VariableListPanel, SceneCard, SceneTransitionArrow）、lib の死 export ~15、診断 console ログ（シミュレーション毎に XML 全文ダンプ等）、空ディレクトリ layouts/pages/panels
- **apps/server・desktop**: `@osce/mcp-server` 未使用依存（+ tsconfig 参照）、write-only な recent-files、未使用 setTitle IPC、ELECTRON_DEV フラグ
- **shared/theme-apex/i18n**: editor-enums.ts 全死（しかも app と異なる同名 `EditorMode` を export — auto-import 事故の元）、GlassPanel + cn() + clsx/tailwind-merge 依存、ロケールあたり **~121 個の未使用 i18n キー**（errors 名前空間は20/20死。一方バリデータの messageKey はどのロケールにも未定義 = 翻訳契約が双方向に断絶）
- **横断**: 消費者がバイパスしている barrel index.ts 6ファイル、openscenario の numStr/boolStr、opendrive の build-common.ts 全体 + parse userData/dataQuality/include（半実装で未配線 → `<userData>` がロードで黙って消える。配線するか消すか要判断）

---

## C. 重複コード（統合候補）

| 重複 | 箇所数 | 備考 |
|------|--------|------|
| EntityRefSelect / EntityRefMultiSelect / RefSelect | 3（~1,140行） | 行単位80%一致。26ファイルから使用中 |
| 信号キャンバス描画（shape/色/レンダリングループ） | 2.5 | signal-icon-renderer.ts(374行) が engine の THREE-free 実装を再コピー。BULB_SPACING が既にドリフト（0.33 vs 0.38） |
| normalizeAngle | 5 + テスト2 | 境界規約が2種類混在（[-π,π] vs (-π,π]） |
| findLaneSectionAtS | 5 | 二分探索/線形走査/範囲走査とアルゴリズムまで分裂 |
| ensureArray ×4 / generateId ×3 + inline ×5 / evalCubic ×3 | — | **根本原因: `packages/opendrive/src/utils/math.ts` が index.ts から export されていない** |
| CommandHistory / BaseCommand | 2 | scenario-engine と opendrive-engine でバイト一致（collapseUndo の有無のみ差分） |
| detectElementType | 3 | apps/web が両方を同時使用中。判定ルールがドリフト済み |
| action/trigger サマリーロジック | 2 | ラベルが既にドリフト（'Follow Distance' vs 'Longitudinal Distance'）。テストがあるのは node-editor 側のみ |
| route / trajectory 編集スタック | 2系統 | ストア(~250行×2)・プレビューフック(~120行×2)・3D コンポーネント6ペア(~800行)が構造的コピペ |
| WS プロトコル型 | 2 | web と server で手動同期。@osce/shared の存在意義そのもの |
| デフォルトエンティティ定義 | 4 | **値が分岐済み**: mcp-server は maxAcceleration 5、templates は 200 — AI 作成と UI 作成で物理特性が異なる |
| ジオメトリ評価（opendrive-engine 内の再実装） | 3 | junction-validator はスパイラルを直線にフォールバック = **正しさの問題**。@osce/opendrive は既に依存関係にある |
| Storyboard 深い走査 | 6+ | visitStoryboard ユーティリティ不在 |

---

## D. 型安全・アーキテクチャ・テスト・CI の構造課題

### 型安全
- **shared が自前の XSD enum を素通し**: OSC enum 36個中~17個・ODR enum 18個全部がどこからも参照されず、該当フィールドは `string`。**A1/A3 系のドリフトバグの根本原因**。enum を v1.3.1 XSD から再抽出（現状 v1.2.0 由来）し、モデルのフィールド型に配線すればこのバグクラスはコンパイルエラーになる
- openscenario パーサー/シリアライザ: `: any` ~250箇所 / eslint-disable ~265（opendrive パッケージは同じ問題を RawXml エイリアス1箇所に封じ込めており、パターンの手本がある）
- property エディタ: `as Partial<...>` 99箇所 + kind 未チェックの blind cast 23ファイル
- ESLint が no-explicit-any を warn に降格 + `--max-warnings 0` なし = 「No any」ルールはツールで未執行
- OdrGeometry が判別共用体でない（フラットな optional + `?? 0` フォールバックが不正データを隠蔽）

### アーキテクチャ（God ファイル）
| ファイル | 行数 | 問題 |
|---------|------|------|
| `apps/web/.../RoadNetworkEditorLayout.tsx` | 1,803 | エンジンロジック（RHT/LHT変換、atan2、junction再生成）が UI 層に内在。~69 props を ScenarioViewer へ |
| `packages/3d-viewer/.../ScenarioViewer.tsx` | 1,467 | ~122 props を5箇所で再宣言。全編集機能の変更がここを通る |
| `apps/web/.../EditorLayout.tsx` | 1,330 | + use-route-edit/use-trajectory-edit がセレクタ無しの全ストア購読 → ドラッグ毎に全体再レンダー（プロジェクトルール違反） |
| `IntersectionTimelinePanel.tsx` | 921 | + module-level 可変カウンタ、全文ハードコード英語 |
| `FollowTrajectoryActionEditor.tsx` | 756 | 3形状 + knot 再生成 + 業務ロジック混在 |
| `use-file-operations.ts` | 704 | 6つの save 関数がほぼ同型 |

その他: エディタディスパッチが3箇所に重複（否定リストのフォールバック付き）、opendrive-engine の undo が変異毎に全ドキュメント structuredClone（最大100スナップショット保持）、openscenario パーサーが module-level 可変状態で非リエントラント。

### テスト
- apps/web のテスト比率 ~6%。**property 領域12.3k行・テストゼロ**。純粋関数の宝庫（NURBS、クロソイド、route-path-computation 407行 — 進行中の変更に回帰網なし）が未テスト
- trajectory-edit-store(651行)、simulation/catalog/project ストア未テスト。WASM ワーカープロトコル未テスト
- templates: 22ファイル全部テストゼロ（生成した storyboard が validator/serializer を通る保証なし）
- server のルートテストが実データディレクトリに書き込み（サービス差し替えが効いていない）

### ビルド/CI
- **E2E(34ケース)が CI で一度も実行されない**。しかも auto-merge は unit CI のみをゲートに通過。CI トリガーは main のみ（dev_v0.5 はチェックなし）
- @react-three/drei v9 が fiber 9 / React 19 と peer 不整合（v10 が対応ライン）
- ルート `test:e2e` スクリプトは実行不能（playwright がルートに無い）
- README が MIT 表記（実際は Apache-2.0）— OSS として法的リスク
- ルート tsconfig references から opendrive-engine と theme-apex が漏れ。6パッケージで dist にテストが混入。packageManager フィールド未設定

---

## E. リファクタリング・ロードマップ

原則: **正しさ → 削除 → 統合 → 型で固定 → 分解 → ゲート強化** の順。コードが減ってから統合・分解する方が安い。各フェーズ末に `pnpm typecheck && pnpm test && pnpm build` をゲートとする。

### Phase 0: 正しさの即効修正（A 表の10件）— 目安: 数日
出力ファイルの仕様違反とゲート破損を先に止める。
- A1〜A8 の修正。**修正と同時に該当ケースのラウンドトリップテストを追加**（壊れていた action 族 + フィクスチャ欠落時の無音パス修正）
- A9: 127.0.0.1 バインド + CORS 制限（Phase 1 でルート削除するなら最小限でよい）
- A10: lint→`eslint .`、clean→Node スクリプト化。ESLint の no-explicit-any を error 化（openscenario のみ Phase 3 まで scoped override）
- README ライセンス表記、ルート test:e2e スクリプト、tsconfig references 2件 — 各1行級
- 並行開発: A1-A2(apps/web) / A3-A4(openscenario) / A5(opendrive) / A6(opendrive-engine) / A7-A8(mcp-server) はパッケージが分かれており worktree 並行可

### Phase 1: 死コード一掃（B 表）— 目安: 1週間
**先にオーナー判断が必要な4点**:
1. opendrive-engine コマンドクラス: 配線（A6 が直る・推奨）か削除か
2. サーバーファイル API: 削除（GT_Sim 復活時は git から戻す）か、意図的 headless API として防御するか
3. node-editor の Timeline/PropertyPanel: タイムライン再実装計画があるなら残す価値はあるか（apps/web に別実装あり。残すなら stale-data バグ修正が前提）
4. opendrive の userData/dataQuality: ロスレス往復として配線するか削除するか
- 残りは機械的に削除 → 各削除後 typecheck。i18n は「enum ラベル群を UI に配線 or 削除」をグループ単位で判断
- 仕上げに knip.json を整備して CI に `pnpm knip` を追加（再発防止）

### Phase 2: 重複統合（C 表）— 目安: 1〜2週間
順序が重要。土台から:
1. `@osce/opendrive` の utils/math を index から export → normalizeAngle/findLaneSectionAtS/evalCubic/ensureArray の複製を順次置換（境界規約は (-π,π] に統一し、math.ts 実装を合わせる）
2. opendrive-engine のジオメトリ評価を @osce/opendrive の import に置換（スパイラル正しさ修正を兼ねる）
3. CommandHistory/BaseCommand を共有化（@osce/shared は型のみの規約なので、実装は scenario-engine から export して opendrive-engine が import する形を推奨）
4. WS 型 → @osce/shared、デフォルトエンティティ定義 → scenario-engine に一本化、generateId → shared
5. detectElementType / action-summary 統合（node-editor 側を正とする — テストがある側）
6. EntityRef ドロップダウン3兄弟 → 単一コア + モードパラメータ
7. 信号レンダラー: signal-icon-renderer.ts を engine export の薄いラッパーに書き換え
- ※ @osce/shared に触る 3・4 は単独 PR・並行 worktree 禁止（CLAUDE.md ルール）

### Phase 3: 型で固定する — 目安: 1〜2週間
Phase 0 のバグクラスを構造的に再発不能にする。
1. osc-enums を v1.3.1 XSD から再抽出 → モデルフィールドの `string` を enum 型に置換（**shared 変更につき単独 PR、全依存を同時更新**）。UI のドロップダウン配列は shared の const 配列から導出
2. openscenario: RawXml(unknown ベース) + アクセサヘルパー化、~265 suppressions 削除
3. property エディタ: kind で narrow する型付き updater ヘルパーを1箇所に追加し、99 casts を退役
4. OdrGeometry を判別共用体化（shared 単独 PR）
5. noUncheckedIndexedAccess を opendrive/openscenario で試験導入

### Phase 4: God ファイル分解 + パフォーマンス — 目安: 2〜3週間
- use-route-edit / use-trajectory-edit のセレクタ修正（最小工数で EditorLayout 再レンダー解消 — 先にやる）
- RoadNetworkEditorLayout: ツール別フック抽出 + ドメインロジックを opendrive-engine へ（テスト付き）
- ScenarioViewer: props を編集セッション別 config オブジェクトに集約（routeEdit/trajectoryEdit/signalPlace/roadEditing）
- エディタディスパッチを Record レジストリ化（3箇所 → 1箇所）
- route/trajectory 編集スタック: createDraftEditStore<T> ファクトリ + 共有 3D プリミティブに統合
- opendrive-engine undo: immer produceWithPatches 化（全文 clone 廃止）
- 3d-viewer の useMemo ジオメトリに dispose クリーンアップ追加（SplitPreviewLine が手本）

### Phase 5: テスト・CI ゲート強化（並行して随時、最終固め）
- CI: E2E ジョブ追加（mock backend の34ケース）+ トリガーを dev ブランチへ拡大 + auto-merge のゲートに E2E を含める
- 優先テスト追加: ①route-path/trajectory-curve/nurbs の純数学 ②trajectory-edit-store ③ElementTypeDetector/ParameterAwareInput ④templates の「decompose → validator → 往復」パラメタライズドテスト ⑤WASM ワーカープロトコル契約テスト
- server ルートテストの実データ書き込み修正（buildApp({projectsBasePath: tmpDir}) を使う）
- drei v10 アップグレード、packageManager フィールド、dist からテスト除外の統一

### 工数感とマイルストーン
| フェーズ | 規模 | 完了条件 |
|---------|------|---------|
| 0 正しさ | 数日 | A1-A10 修正 + 回帰テスト、Windows でゲート動作 |
| 1 削除 | ~1週 | 約8,000行削減、knip green、typecheck/build green |
| 2 統合 | 1〜2週 | C 表の重複が単一ソース化 |
| 3 型固定 | 1〜2週 | enum ドリフトがコンパイルエラーに、no-any error 化完了 |
| 4 分解 | 2〜3週 | 最大ファイル ~600行以下、props 集約、undo パッチ化 |
| 5 ゲート | 随時 | CI で E2E 実行、優先5領域にテスト |

Phase 0-1 は機能開発を止めずに即着手可能。Phase 2 以降は機能ロードマップ（別文書）の各項目と交互に進めることを推奨（例: trajectory プレビュー機能の前に route/trajectory スタック統合を済ませると二重実装を避けられる）。

---

## 付録: 検証メタデータ
- ワークフロー: 監査20領域 → 高重要度/削除候補のみ敵対的検証（refute 方針）→ 機能分析3系統。総計97エージェント・約544万トークン
- 検証で**棄却・補正された主な主張**: getSignalTexture等は使用中（削除不可）、buildRoutingOverrides は使用中、`pnpm format` は Windows でも動作、信号 shape 重複は3箇所でなく2箇所、normalizeAngle の境界規約は3種でなく2種 — 本文には補正後の事実のみ記載
- 生データ: `tmp/audit-digest.md`（セッションローカル、非追跡）
