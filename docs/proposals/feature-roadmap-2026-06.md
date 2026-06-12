# 機能進化ロードマップ（2026-06）

> 実施: 2026-06-13 | 入力: ①プロジェクト自身のドキュメント分析（FEATURES.md / maturity matrix / proposals）②競合・市場調査（RoadRunner Scenario, CarMaker 14/15, Foretellix, CARLA 0.10, esmini エコシステム, OpenSCENARIO 2.x 動向）③実コードの UX 監査（コード上の証拠つき）
> 技術的負債側は [docs/development/tech-debt-audit-2026-06.md](../development/tech-debt-audit-2026-06.md) を参照

## 戦略サマリー

- **XML-first は正解**: OSC 2.x DSL の採用は2026年時点でもニッチ。OSC XML 1.3 が具体シナリオの共通言語であり続けており、~83% の XSD カバレッジは競争力がある
- **テーブルステークスの欠落**: 軌跡プレビュー、パラメータ分布（バリエーション生成）、XSD バリデーション、インタラクティブタイムライン — 競合が標準装備する4つが不在
- **構造的な差別化機会**: ブラウザ内 esmini WASM は「インストール不要のバッチ実行」「生成→検証→実行→修正の閉ループを持つ AI 統合」「ゼロインストール共有リンク」を可能にする。デスクトップ製品（CarMaker/RoadRunner）には構造的に真似できない
- **足元の事実**: WASM がシミュレーションの唯一のエンジンになったのに4機能すべて Partial。MCP サーバー（25ツール）は**起動中のエディタと未接続**（孤立した in-memory ストアを編集している）。AI 統合を看板に掲げるなら最優先のギャップ

---

## Track A: 基盤の信頼性（最優先・他のすべての前提）

| # | 機能 | 優先度 | 工数 | 根拠（コード上の証拠） |
|---|------|--------|------|------|
| A1 | **WASM シミュレーション完遂** — 失敗するシナリオの修正、store→viewer 配線完成、エラーの UI 表示、回帰テスト | must | L | 唯一のエンジンなのに FEATURES.md 4.1 全行 Partial。maturity の sim.playback_store_integrity が L1/L3 |
| A2 | **ファイルオープン/パースエラーの可視化** — AbortError（キャンセル）と実エラーの分離、toast 表示 | must | S | `use-file-operations.ts:284-309` が全例外を「キャンセル」として握り潰し。壊れた .xosc が無反応で終わる |
| A3 | **自動保存 + クラッシュ復旧** — IndexedDB への debounced スナップショット + 起動時復旧プロンプト | must | M | `editor-store.ts:174` の autoSave 設定は読み手ゼロの死コード。beforeunload ハンドラは apps/ 全域に不在 |
| A4 | **未保存ガード** — isDirty 連動の beforeunload + Electron クローズインターセプタ | must | S | isDirty は追跡済みなのにどこもブロックしない。タブ閉じで全損 |
| A5 | **帳簿の更新** — FEATURES.md / maturity matrix を実コードに同期、完了済み提案のアーカイブ | must | M | 軌跡可視化は「Not Started」だが `packages/3d-viewer/src/trajectory/` は実在。esmini 信号提案2件も実装済み。PM の判断材料が古い |
| A6 | **ドラッグ&ドロップ + 最近使ったファイル** | should | S | recentProjectIds ストアは実装済みで UI だけ無い（1.8）。安価な UX 改善 |

## Track B: オーサリング体験（競合とのテーブルステークス）

| # | 機能 | 優先度 | 工数 | 根拠 |
|---|------|--------|------|------|
| B1 | **3D 軌跡・経路プレビュー** — route / FollowTrajectoryAction（Polyline/Clothoid/Nurbs）/ 車線変更スプラインをプロパティ変更に追随するオーバーレイで描画 | must | M | RoadRunner Scenario の中核メタファー。FEATURES.md 3.21 で既に「優先度引き上げ」。進行中の route 編集作業の延長線上 |
| B2 | **バリデーション UX** — ①保存/エクスポート時の自動実行 ②エラー→要素クリックナビゲーション ③編集後の debounced 検証 | must | M | 6.1.4-6.1.6 すべて未着手。検証は手動ボタンのみで、不正シナリオを無警告で保存できる |
| B3 | **XSD バックドバリデーション** — 同梱 v1.3.1 XSD に対する検証層（現状はカスタムルール3モジュールのみ） | should | L | CLAUDE.md が XSD 厳守を掲げるのに XSD 検証が無い。B2 の ValidationResult 形式に合流させる |
| B4 | **タイムライン操作** — スクラブ、ズーム、イベントブロックのドラッグ/リサイズ → トリガー時刻へ undo 可能な書き戻し | should | M | 4.2.4-4.2.6 全部未着手。「ノード+タイムラインのハイブリッド」という看板の半分が静的表示 |
| B5 | **クリップボード強化** — エンティティの複製/コピー（参照 init action ごと）、複数選択コピペ、Ctrl+D、複数削除の単一 undo 化 | should | M | `use-clipboard.ts` はエンティティ非対応、`use-keyboard-shortcuts.ts` は selectedIds===1 を強制。scenario-engine に CompoundCommand 不在（opendrive-engine からポート） |
| B6 | **ショートカット一覧オーバーレイ + 拡張** — '?' で表示、単一レジストリ化、Space=再生等 | could | S | 現状7バインドのみ・発見手段なし |

依存: B4 は A1 に依存。B1 は負債側 Phase 4 の route/trajectory スタック統合を先に済ませると二重実装を回避できる。

## Track C: AI × シミュレーション（差別化の本丸）

| # | 機能 | 優先度 | 工数 | 根拠 |
|---|------|--------|------|------|
| C1 | **MCP ⇔ 実エディタ接続** — 稼働中の scenario store へツールコールを中継（WS チャネル or Electron 側エンドポイント）+ エージェント接続インジケータ | must | L | `mcp-server.ts:22` が孤立ストアを生成。AI 編集は UI に一切届かない。「AI 統合」を謳う上での最大ギャップ |
| C2 | **MCP safe-apply フロー** — 提案→差分プレビュー→確定の3段階 + undo 統合 + ツールエラー契約統一 | should | M | maturity の mcp.safe_apply_flow がギャップ。C1 の信頼性の前提 |
| C3 | **パラメータ分布対応** — Deterministic/Stochastic 全14型の型/パーサー/シリアライザ + 宣言済みパラメータへ分布を付与する UI + 具体バリアントのプレビュー | must | L | XSD A.20 全14型未実装。RoadRunner/Foretellix/scenariogeneration すべてが中核機能とする標準メカニズム |
| C4 | **ブラウザ内バッチ実行 + 合否マトリクス** — WASM ワーカープールで N バリアントを並列実行、衝突/最小TTC/完走の判定、ドリルダウン再生 | should | L | インストール不要のバッチ実行はデスクトップ競合が提供できない。依存: C3, A1 |
| C5 | **自然言語シナリオ生成（生成→検証→実行→修正ループ）** — チャットパネルが MCP ツールを駆動し、検証+ヘッドレス WASM 実行の結果をモデルに还流 | should | L | FEATURES.md 5.2 で計画済み。閉ループをクライアントサイドで回せるのは本プロダクトだけ。依存: C1, B2/B3 |

## Track D: エコシステム拡大

| # | 機能 | 優先度 | 工数 | 根拠 |
|---|------|--------|------|------|
| D1 | **LHT（左側通行）対応** — proposal の残作業リスト実行（ヘッダー切替 UI、メッシュ/レーンマーキング、junction ペアリング、テーパー方向、3D 矢印、テスト） | must | L | docs/proposals/lht-support.md が「次のメジャー機能」と明記。前提の junction ツールと trafficRule 基盤は着地済み。日本市場に直結 |
| D2 | **Traffic アクションの型付け** — Source/Sink/Swarm/Stop + TrafficDefinition のモデル/パーサー/エディタ | should | M | 現状 untyped key-value の素通し。CarMaker 14 が周辺交通を強調、esmini は Swarm を実行可能 |
| D3 | **シナリオライブラリ（テンプレート後継）** — ALKS（UN R157）/cut-in/歩行者横断のキュレーション済みシナリオ+xodr をワンクリックロードするギャラリー | should | M | テンプレートは廃止済みだが README は宣伝中。OSC-ALKS-scenarios 等ライセンス互換の OSS 素材が存在 |
| D4 | **ゼロインストール共有リンク** — シナリオ（+xodr）を圧縮 URL フラグメント化し、ホスト版エディタで閲覧/シミュレーション再生 | could | M | ブラウザベース OSS の構造的優位。odrviewer.io が実証した普及ダイナミクス |
| D5 | **シミュレーション結果エクスポート** — エンティティ別軌跡 CSV + MediaRecorder による WebM キャプチャ | could | M | RoadRunner R2025b が CSV エクスポート追加。報告・バグレポートの定番需要 |
| D6 | **OpenDRIVE 1.8/1.9 互換監査** — スキーマ差分監査 + 非対応構造の graceful 処理 + バージョン警告 | could | M | OpenDRIVE 1.9.0 が 2026-05 リリース。RoadRunner/CarMaker 出力は 1.8+ へ移行中 |
| D7 | **XSD 残課題の完遂** — TimeOfDayCondition、TrajectoryPosition、未対応 catalog 2種 → カバレッジ 90% 超 | could | M | A.12/A.14 の最後の欠落。D2 と合わせると Global Actions も概ね完成 |
| D8 | **i18n 強化** — ハードコード文字列一掃、未翻訳キー検出 CI、E2E アサーション | could | M | maturity 最弱ドメイン（8 中 7 ギャップ）。負債側 Phase 1 の i18n キー整理と同時実施が効率的 |
| D9 | **オンボーディングツアー + 初回テンプレート体験** | could | M | tour/onboarding 系のコードはゼロ。新規ユーザーが1分で cut-in 実行に到達する導線。依存: D3 |
| D10 | **ローカルバージョンスナップショット** — 保存毎のローリング履歴 + 復元パネル（将来のマルチユーザー同期の布石） | could | M | undo 履歴はファイルロードで消える。それより古い事故への安全網が無い |

---

## 推奨実行順序（フェーズ案）

リファクタリング・ロードマップ（負債側 Phase 0-5）と交互に進める前提。

```
フェーズ1「信頼できる土台」          フェーズ2「快適なオーサリング」
  負債 Phase 0-1（バグ修正+削除）       負債 Phase 2-3（統合+型固定）
  A1 WASM 完遂                          B1 軌跡プレビュー
  A2-A4 エラー可視化/自動保存/ガード     B2 バリデーション UX
  A5 帳簿更新, A6 ファイル UX            B4 タイムライン操作
                                        B5 クリップボード強化

フェーズ3「AI とバリエーション」      フェーズ4「市場拡大」
  負債 Phase 4（God 分解）              D1 LHT（日本市場）
  C1-C2 MCP 実接続 + safe-apply         D2 Traffic アクション
  C3 パラメータ分布                     D3 シナリオライブラリ
  C4 バッチ実行マトリクス               D4-D10 から選択
  C5 NL 生成ループ                      B3 XSD バリデーション完成
```

判断ポイント:
- **C1（MCP 実接続）だけはフェーズ1に前倒しする価値あり** — 「AI 統合」が現状看板倒れであり、接続さえできれば既存25ツールが即座に生きる
- D1（LHT）はフェーズ2以降のどこに置いても独立して進められる（opendrive 系パッケージに閉じる・worktree 並行可）
- C3→C4→C5 は依存チェーン。C3 着手前に負債 Phase 3（shared の enum/型整備）を済ませると手戻りが無い
