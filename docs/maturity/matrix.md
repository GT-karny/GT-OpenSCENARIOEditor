# Capability Checklist + Matrix

Generated: 2026-02-28T08:34:16.828Z

## サマリー

| Domain | Total | Done | Partial | Gap | Blocked |
|---|---:|---:|---:|---:|---:|
| 3d | 8 | 0 | 4 | 4 | 0 |
| backend | 8 | 0 | 4 | 4 | 0 |
| core | 8 | 1 | 4 | 3 | 0 |
| devops | 8 | 0 | 3 | 5 | 0 |
| i18n | 8 | 0 | 1 | 7 | 0 |
| mcp | 8 | 0 | 6 | 2 | 0 |
| opendrive | 8 | 0 | 6 | 2 | 0 |
| qa | 8 | 0 | 4 | 4 | 0 |
| sim | 8 | 0 | 4 | 4 | 0 |
| templates | 8 | 0 | 2 | 6 | 0 |
| ux | 8 | 0 | 4 | 4 | 0 |

## チェックリスト

### 3d

- [ ] `3d.camera_focus_behavior` カメラフォーカス挙動 (L1/L2, gap)
- [ ] `3d.playback_ui_wiring` 3D再生UI連携 (L1/L3, gap)
- [ ] `3d.relative_route_geo_resolution` relative/route/geo位置解決 (L1/L3, gap)
- [ ] `3d.visual_asset_upgrade` 3Dアセット高度化（モデル/アニメ） (L1/L3, gap)
- [ ] `3d.entity_primitive_rendering` エンティティ基本描画 (L2/L3, partial)
- [ ] `3d.label_visibility_control` 道路/エンティティラベル制御 (L2/L2, partial)
- [ ] `3d.road_rendering_pipeline` 道路描画パイプライン整備 (L2/L3, partial)
- [ ] `3d.simulation_overlay_consistency` シミュレーションオーバーレイ整合 (L2/L3, partial)

### backend

- [ ] `backend.audit_logging` 監査ログ方針 (L0/L2, gap)
- [ ] `backend.authz_baseline` 認証/権限制御基盤 (L0/L3, gap)
- [ ] `backend.operational_limits` 運用上限値設定（rate/size） (L0/L2, gap)
- [ ] `backend.input_contract_validation` 入力契約バリデーション強化 (L1/L3, gap)
- [ ] `backend.file_api_stability` ファイルAPI安定性 (L2/L3, partial)
- [ ] `backend.scenario_api_stability` シナリオAPI安定性 (L2/L3, partial)
- [ ] `backend.simulation_api_stability` シミュレーションAPI安定性 (L2/L3, partial)
- [ ] `backend.ws_error_contract` WebSocketエラー契約統一 (L2/L3, partial)

### core

- [ ] `core.param_variable_modify_mapping` Parameter/Variable modifyマッピング整合 (L1/L3, gap)
- [ ] `core.schema_version_support` OpenSCENARIOバージョン互換管理 (L1/L2, gap)
- [ ] `core.unknown_element_tolerance` 未知要素の寛容パース (L1/L3, gap)
- [ ] `core.command_undo_redo_integrity` Undo/Redo整合性 (L2/L3, partial)
- [x] `core.id_stability_policy` 要素ID安定性ポリシー (L2/L2, done)
- [ ] `core.import_error_recovery` インポート失敗時の回復導線 (L2/L3, partial)
- [ ] `core.validator_rule_coverage` バリデーションルール網羅性 (L2/L3, partial)
- [ ] `core.xosc_roundtrip_consistency` XOSCラウンドトリップ整合性 (L2/L3, partial)

### devops

- [ ] `devops.ci_future_hook` CI連携拡張ポイント定義 (L1/L2, gap)
- [ ] `devops.daily_weekly_ops` 日次/週次運用サイクル (L1/L2, gap)
- [ ] `devops.domain_split_governance` ドメイン分割ガバナンス (L1/L2, gap)
- [ ] `devops.maturity_matrix_generation` Matrix自動生成運用 (L1/L2, partial)
- [ ] `devops.maturity_schema_validation` Capabilityスキーマ検証運用 (L1/L2, partial)
- [ ] `devops.owner_assignment_policy` Owner割当方針 (L1/L2, gap)
- [ ] `devops.review_workflow_definition` レビュー運用定義 (L1/L2, gap)
- [ ] `devops.target_date_enforcement` 期限設定運用 (L1/L2, partial)

### i18n

- [ ] `i18n.date_number_locale` 日付/数値ロケール表示 (L0/L2, gap)
- [ ] `i18n.translation_review_flow` 翻訳レビュー運用フロー (L0/L2, gap)
- [ ] `i18n.fallback_policy` 翻訳フォールバック方針 (L1/L2, gap)
- [ ] `i18n.hardcoded_text_elimination` ハードコード文言排除 (L1/L3, gap)
- [ ] `i18n.language_toggle_consistency` 言語切替一貫性 (L1/L2, gap)
- [ ] `i18n.pluralization_rules` 複数形・数量表現ルール (L1/L2, gap)
- [ ] `i18n.resource_coverage` 翻訳リソース網羅率 (L1/L3, gap)
- [ ] `i18n.test_localized_ui` ローカライズUIテスト (L2/L3, partial)

### mcp

- [ ] `mcp.safe_apply_flow` 提案→確認→適用フロー (L1/L3, gap)
- [ ] `mcp.user_guidance_surface` 利用者向け導線 (L1/L2, gap)
- [ ] `mcp.entity_tool_quality` エンティティ操作ツール品質 (L2/L3, partial)
- [ ] `mcp.prompt_resource_quality` プロンプト/リソース品質 (L2/L2, partial)
- [ ] `mcp.storyboard_tool_quality` Storyboard操作ツール品質 (L2/L3, partial)
- [ ] `mcp.tool_error_contract` ツールエラー契約統一 (L2/L3, partial)
- [ ] `mcp.tool_registration_coverage` MCPツール登録網羅性 (L2/L3, partial)
- [ ] `mcp.undo_redo_tool_quality` Undo/Redoツール品質 (L2/L3, partial)

### opendrive

- [ ] `opendrive.large_map_optimization` 大規模地図最適化 (L1/L3, gap)
- [ ] `opendrive.roadmark_semantics` RoadMark意味解釈整備 (L1/L2, gap)
- [ ] `opendrive.elevation_profile_support` 標高プロファイル対応 (L2/L3, partial)
- [ ] `opendrive.geometry_accuracy` 幾何計算精度 (L2/L3, partial)
- [ ] `opendrive.import_diagnostics` XODR読込診断メッセージ (L2/L2, partial)
- [ ] `opendrive.lane_boundary_consistency` 車線境界計算整合性 (L2/L3, partial)
- [ ] `opendrive.mesh_generation_quality` 道路メッシュ生成品質 (L2/L3, partial)
- [ ] `opendrive.xodr_parser_coverage` XODRパーサー網羅性 (L2/L3, partial)

### qa

- [ ] `qa.artifact_retention` 失敗時証跡保存（trace/video） (L0/L3, gap)
- [ ] `qa.playwright_full_regression` Playwrightフル回帰 (L0/L3, gap)
- [ ] `qa.playwright_smoke_pack` Playwrightスモークパック (L0/L3, gap)
- [ ] `qa.flaky_test_control` フレーキーテスト制御 (L1/L2, gap)
- [ ] `qa.contract_tests_maturity` 契約テスト整備 (L2/L3, partial)
- [ ] `qa.server_route_tests` サーバールートテスト整備 (L2/L3, partial)
- [ ] `qa.unit_coverage_core` コアユニットテスト維持 (L2/L3, partial)
- [ ] `qa.unit_coverage_viewer` 3Dユニットテスト維持 (L2/L3, partial)

### sim

- [ ] `sim.real_runtime_e2e` 実GT_Sim連携E2E (L0/L3, gap)
- [ ] `sim.gtsim_default_runtime` GT_Sim標準実行経路 (L1/L3, gap)
- [ ] `sim.playback_store_integrity` 再生ストア整合性 (L1/L3, gap)
- [ ] `sim.timeline_controls` タイムライン制御UI整備 (L1/L2, gap)
- [ ] `sim.error_surface_to_ui` シミュレーションエラー可視化 (L2/L3, partial)
- [ ] `sim.service_switching` Mock/GT_Simサービス切替 (L2/L3, partial)
- [ ] `sim.session_lifecycle` セッションライフサイクル管理 (L2/L3, partial)
- [ ] `sim.ws_frame_streaming` WebSocketフレーム配信整備 (L2/L3, partial)

### templates

- [ ] `templates.quality_rank` テンプレート品質ランク付け (L0/L2, gap)
- [ ] `templates.action_component_coverage` アクションコンポーネント網羅性 (L1/L3, gap)
- [ ] `templates.catalog_alignment` カタログ参照整合 (L1/L2, gap)
- [ ] `templates.localized_metadata` テンプレートメタデータ多言語化 (L1/L2, gap)
- [ ] `templates.preview_generation` テンプレート適用前プレビュー (L1/L2, gap)
- [ ] `templates.use_case_coverage` ユースケーステンプレート網羅性 (L1/L3, gap)
- [ ] `templates.apply_consistency` テンプレート適用整合 (L2/L3, partial)
- [ ] `templates.parameter_validation` テンプレートパラメータ妥当性 (L2/L3, partial)

### ux

- [ ] `ux.deep_property_editing` Event/Action/Triggerの詳細編集 (L1/L3, gap)
- [ ] `ux.layout_responsiveness` 統合レイアウトのレスポンシブ品質 (L1/L3, gap)
- [ ] `ux.shortcut_consistency` キーボードショートカット整合 (L1/L2, gap)
- [ ] `ux.template_discovery` テンプレート検索・フィルタ (L1/L2, gap)
- [ ] `ux.accessibility_baseline` アクセシビリティ基盤 (L2/L3, partial)
- [ ] `ux.error_recovery_flow` エラー時の回復フロー (L2/L3, partial)
- [ ] `ux.selection_sync_feedback` ノード/3D/一覧の選択同期可視化 (L2/L3, partial)
- [ ] `ux.validation_focus_navigation` バリデーションから該当要素への遷移 (L2/L3, partial)

## Matrix

| ID | Domain | Capability | Meaning | Purpose | Required | Current | Effective | Status | Implementation | Tests | E2E | Ops | Gaps | Owner | Target |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `3d.road_rendering_pipeline` | 3d | 道路描画パイプライン整備 | OpenDRIVEの道路構造を、3Dビューで破綻なく一貫表示するための基盤機能。 | 3D描画の観点で「道路描画パイプライン整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/3d-viewer/src/road/RoadNetwork.tsx` | `packages/3d-viewer/src/__tests__/utils/lane-type-colors.test.ts` | - | - | - 道路描画パイプライン整備は運用上の不足が残っている | viewer-team | 2026-03-12 |
| `3d.entity_primitive_rendering` | 3d | エンティティ基本描画 | 車両・歩行者・障害物などのシナリオ主体を、最低限識別可能な形で3D空間に表示する機能。 | 3D描画の観点で「エンティティ基本描画」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/3d-viewer/src/entities/EntityGroup.tsx` | `packages/3d-viewer/src/__tests__/utils/entity-geometry.test.ts` | - | - | - エンティティ基本描画は運用上の不足が残っている | viewer-team | 2026-03-15 |
| `3d.relative_route_geo_resolution` | 3d | relative/route/geo位置解決 | relative/route/geo形式の位置定義を実座標へ解決し、シナリオ上の意図した配置を3Dで再現する機能。 | 3D描画の観点で「relative/route/geo位置解決」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/3d-viewer/src/utils/position-resolver.ts` | `packages/3d-viewer/src/__tests__/utils/position-resolver.test.ts` | - | - | - relative/route/geoの解決が未対応 | viewer-team | 2026-03-10 |
| `3d.playback_ui_wiring` | 3d | 3D再生UI連携 | シミュレーション再生状態（時刻・フレーム・再生制御）を3D表示と同期させる接続機能。 | 3D描画の観点で「3D再生UI連携」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/3d-viewer/src/components/ScenarioViewer.tsx` | - | - | - | - シミュレーションフレーム配線が未接続箇所あり | viewer-team | 2026-03-11 |
| `3d.camera_focus_behavior` | 3d | カメラフォーカス挙動 | 選択対象へ素早く視点を移し、編集・確認対象を見失わない操作性を担保する機能。 | 3D描画の観点で「カメラフォーカス挙動」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/3d-viewer/src/scene/CameraController.tsx` | - | - | - | - カメラフォーカス挙動は運用上の不足が残っている | viewer-team | 2026-03-18 |
| `3d.label_visibility_control` | 3d | 道路/エンティティラベル制御 | 道路ID・車線ID・エンティティ名などの補助情報を、必要に応じて表示/非表示し認知負荷を調整する機能。 | 3D描画の観点で「道路/エンティティラベル制御」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L2 | L2 | partial | `packages/3d-viewer/src/road/RoadLabels.tsx` | `packages/3d-viewer/src/__tests__/store/viewer-store.test.ts` | - | - | - 道路/エンティティラベル制御は運用上の不足が残っている | viewer-team | 2026-03-20 |
| `3d.simulation_overlay_consistency` | 3d | シミュレーションオーバーレイ整合 | シミュレーション中の動的状態を、編集時の静的状態と矛盾なく重ねて表示する整合機能。 | 3D描画の観点で「シミュレーションオーバーレイ整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/3d-viewer/src/scenario/SimulationOverlay.tsx` | `packages/3d-viewer/src/__tests__/scenario/entity-positions.test.ts` | - | - | - シミュレーションオーバーレイ整合は運用上の不足が残っている | viewer-team | 2026-03-22 |
| `3d.visual_asset_upgrade` | 3d | 3Dアセット高度化（モデル/アニメ） | プリミティブ表示を実用的なモデル/アニメーションへ拡張し、シナリオ理解と妥当性判断の精度を上げる機能。 | 3D描画の観点で「3Dアセット高度化（モデル/アニメ）」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/3d-viewer/src/entities/VehicleEntity.tsx` | - | - | - | - プリミティブ中心表現からの拡張が必要 | viewer-team | 2026-03-30 |
| `backend.file_api_stability` | backend | ファイルAPI安定性 | XOSC/XODRの読込・保存・検証APIを破壊せず運用し、編集ワークフローの土台を安定させる機能。 | バックエンドAPIの観点で「ファイルAPI安定性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/routes/file-routes.ts` | `apps/server/src/__tests__/routes/file-routes.test.ts` | - | - | - ファイルAPI安定性は運用上の不足が残っている | backend-team | 2026-03-08 |
| `backend.scenario_api_stability` | backend | シナリオAPI安定性 | シナリオのimport/export APIでデータ欠落や契約逸脱を防ぎ、編集結果を安全に受け渡す機能。 | バックエンドAPIの観点で「シナリオAPI安定性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/routes/scenario-routes.ts` | `apps/server/src/__tests__/routes/scenario-routes.test.ts` | - | - | - シナリオAPI安定性は運用上の不足が残っている | backend-team | 2026-03-08 |
| `backend.simulation_api_stability` | backend | シミュレーションAPI安定性 | シミュレーション開始・停止・状態取得APIを安定提供し、実行制御を確実に行うための機能。 | バックエンドAPIの観点で「シミュレーションAPI安定性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/routes/simulation-routes.ts` | `apps/server/src/__tests__/routes/simulation-routes.test.ts` | - | - | - シミュレーションAPI安定性は運用上の不足が残っている | backend-team | 2026-03-09 |
| `backend.input_contract_validation` | backend | 入力契約バリデーション強化 | API入力を契約どおりに検査し、不正リクエストが内部処理へ侵入するのを防ぐ防波堤機能。 | バックエンドAPIの観点で「入力契約バリデーション強化」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `apps/server/src/utils/errors.ts` | - | - | - | - 入力契約バリデーション強化は運用上の不足が残っている | backend-team | 2026-03-20 |
| `backend.authz_baseline` | backend | 認証/権限制御基盤 | 利用者・権限に応じて操作可能範囲を制御し、誤操作や不正操作による影響を限定する機能。 | バックエンドAPIの観点で「認証/権限制御基盤」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L0 | L0 | gap | `apps/server/src/app.ts` | - | - | - | - 認証と認可の仕組みが未整備 | backend-team | 2026-04-09 |
| `backend.audit_logging` | backend | 監査ログ方針 | 誰がいつ何を実行したかを追跡可能にし、障害調査と説明責任を成立させる機能。 | バックエンドAPIの観点で「監査ログ方針」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L0 | L0 | gap | `apps/server/src/app.ts` | - | - | - | - 監査ログ方針は運用上の不足が残っている | backend-team | 2026-04-01 |
| `backend.ws_error_contract` | backend | WebSocketエラー契約統一 | WebSocket通信時のエラー形式を統一し、クライアント側で一貫した復旧処理を可能にする機能。 | バックエンドAPIの観点で「WebSocketエラー契約統一」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/websocket/ws-handler.ts` | `apps/server/src/__tests__/websocket/ws-handler.test.ts` | - | - | - WebSocketエラー契約統一は運用上の不足が残っている | backend-team | 2026-03-14 |
| `backend.operational_limits` | backend | 運用上限値設定（rate/size） | レート・ペイロードサイズ等の上限を明確化し、過負荷や悪用によるサービス劣化を防ぐ機能。 | バックエンドAPIの観点で「運用上限値設定（rate/size）」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L0 | L0 | gap | `apps/server/src/app.ts` | - | - | - | - 運用上限値設定（rate/size）は運用上の不足が残っている | backend-team | 2026-03-28 |
| `core.xosc_roundtrip_consistency` | core | XOSCラウンドトリップ整合性 | XOSCの parse→serialize→parse を往復してもシナリオ意味が変質しないことを保証する機能。 | OpenSCENARIO編集コアの観点で「XOSCラウンドトリップ整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/openscenario/src/parser/xosc-parser.ts` | `packages/openscenario/src/__tests__/round-trip/round-trip.test.ts` | - | - | - 一部アクションで双方向整合が不十分 | core-team | 2026-03-10 |
| `core.param_variable_modify_mapping` | core | Parameter/Variable modifyマッピング整合 | ParameterAction/VariableAction の modify ルールが入出力で一致し、変換時の意味ずれを防ぐ機能。 | OpenSCENARIO編集コアの観点で「Parameter/Variable modifyマッピング整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/openscenario/src/serializer/build-actions.ts` | `packages/openscenario/src/__tests__/round-trip/round-trip.test.ts` | - | - | - modify rule名の表現揺れを解消する必要がある | core-team | 2026-03-12 |
| `core.unknown_element_tolerance` | core | 未知要素の寛容パース | 未知要素を扱う際に即時停止を避け、取り込み継続と警告提示を両立する耐障害機能。 | OpenSCENARIO編集コアの観点で「未知要素の寛容パース」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/openscenario/src/parser/parse-actions.ts` | - | - | - | - 未知要素で即時エラーになるケースがある | core-team | 2026-03-18 |
| `core.validator_rule_coverage` | core | バリデーションルール網羅性 | 構造・参照・値の妥当性を検証し、シナリオ品質を編集段階で担保する検証機能。 | OpenSCENARIO編集コアの観点で「バリデーションルール網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/openscenario/src/validator/xosc-validator.ts` | `packages/openscenario/src/__tests__/validator/xosc-validator.test.ts` | - | - | - 仕様網羅の追加精査が必要 | core-team | 2026-03-20 |
| `core.schema_version_support` | core | OpenSCENARIOバージョン互換管理 | OpenSCENARIOバージョン差異を管理し、互換範囲外データの混入を抑止する互換管理機能。 | OpenSCENARIO編集コアの観点で「OpenSCENARIOバージョン互換管理」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/shared/src/types/scenario.ts` | - | - | - | - 互換ポリシーの明文化が不足 | core-team | 2026-03-24 |
| `core.import_error_recovery` | core | インポート失敗時の回復導線 | インポート失敗時に原因を提示し、再試行や代替操作へ戻せる回復導線を提供する機能。 | OpenSCENARIO編集コアの観点で「インポート失敗時の回復導線」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/hooks/use-file-operations.ts` | `apps/web/src/__tests__/hooks/use-file-operations.test.tsx` | - | - | - 失敗時の代替操作導線を拡張する必要がある | core-team | 2026-03-28 |
| `core.command_undo_redo_integrity` | core | Undo/Redo整合性 | 複数操作のUndo/Redoで状態遷移が破綻しないことを保証し、編集作業の可逆性を担保する機能。 | OpenSCENARIO編集コアの観点で「Undo/Redo整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/scenario-engine/src/store/scenario-store.ts` | `packages/scenario-engine/src/__tests__/command-history.test.ts` | - | - | - 複合編集ケースの回帰網羅を増やす必要がある | core-team | 2026-03-14 |
| `core.id_stability_policy` | core | 要素ID安定性ポリシー | 要素IDの一意性と安定参照を維持し、編集・同期・追跡の基盤を成立させる機能。 | OpenSCENARIO編集コアの観点で「要素ID安定性ポリシー」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L2 | L2 | done | `packages/scenario-engine/src/store/defaults.ts` | `packages/scenario-engine/src/__tests__/defaults.test.ts` | - | - | - ID再生成方針のドキュメント化が残っている | core-team | 2026-03-07 |
| `devops.maturity_schema_validation` | devops | Capabilityスキーマ検証運用 | Capability定義の形式崩れを自動検出し、運用データ品質を守る機能。 | 運用基盤の観点で「Capabilityスキーマ検証運用」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | partial | `scripts/maturity/validate-capabilities.mjs` | - | - | - | - Capabilityスキーマ検証運用は運用上の不足が残っている | devops-team | 2026-03-07 |
| `devops.maturity_matrix_generation` | devops | Matrix自動生成運用 | 定義データから可視化成果物を自動生成し、日次確認を定常化する機能。 | 運用基盤の観点で「Matrix自動生成運用」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | partial | `scripts/maturity/generate-matrix.mjs` | - | - | - | - Matrix自動生成運用は運用上の不足が残っている | devops-team | 2026-03-07 |
| `devops.domain_split_governance` | devops | ドメイン分割ガバナンス | ドメイン分割運用の責任境界を定義し、更新競合と属人化を防ぐ機能。 | 運用基盤の観点で「ドメイン分割ガバナンス」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `docs/maturity/GOVERNANCE.md` | - | - | - | - ドメイン分割ガバナンスは運用上の不足が残っている | devops-team | 2026-03-14 |
| `devops.review_workflow_definition` | devops | レビュー運用定義 | レビュー手順を標準化し、成熟度判定のぶれを抑える機能。 | 運用基盤の観点で「レビュー運用定義」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `docs/maturity/README.md` | - | - | - | - レビュー運用定義は運用上の不足が残っている | devops-team | 2026-03-16 |
| `devops.ci_future_hook` | devops | CI連携拡張ポイント定義 | 将来CI統合しやすい接続点を整備し、運用自動化へ移行可能にする機能。 | 運用基盤の観点で「CI連携拡張ポイント定義」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `docs/maturity/README.md` | - | - | - | - CI連携拡張ポイント定義は運用上の不足が残っている | devops-team | 2026-03-18 |
| `devops.owner_assignment_policy` | devops | Owner割当方針 | Owner割当基準を明確化し、未対応項目の放置を防ぐ機能。 | 運用基盤の観点で「Owner割当方針」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `docs/maturity/GOVERNANCE.md` | - | - | - | - Owner割当方針は運用上の不足が残っている | devops-team | 2026-03-19 |
| `devops.target_date_enforcement` | devops | 期限設定運用 | 期限未設定・期限超過を検出し、改善活動の停滞を可視化する機能。 | 運用基盤の観点で「期限設定運用」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | partial | `scripts/maturity/validate-capabilities.mjs` | - | - | - | - 期限設定運用は運用上の不足が残っている | devops-team | 2026-03-10 |
| `devops.daily_weekly_ops` | devops | 日次/週次運用サイクル | 日次/週次の確認サイクルを定義し、改善を継続的に回す運用機能。 | 運用基盤の観点で「日次/週次運用サイクル」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `docs/maturity/GOVERNANCE.md` | - | - | - | - 日次/週次運用サイクルは運用上の不足が残っている | devops-team | 2026-03-20 |
| `i18n.resource_coverage` | i18n | 翻訳リソース網羅率 | 翻訳キーを網羅し、言語切替時の未翻訳表示を最小化する機能。 | 国際化対応の観点で「翻訳リソース網羅率」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/i18n/src/locales` | - | - | - | - 未翻訳キー検出を強化する | i18n-team | 2026-03-16 |
| `i18n.hardcoded_text_elimination` | i18n | ハードコード文言排除 | UIのハードコード文言を排除し、翻訳不能箇所をなくす機能。 | 国際化対応の観点で「ハードコード文言排除」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `apps/web/src/components` | - | - | - | - ハードコード文言排除は運用上の不足が残っている | i18n-team | 2026-03-20 |
| `i18n.language_toggle_consistency` | i18n | 言語切替一貫性 | 言語切替時の表示崩れや文脈ズレを防ぎ、一貫した表示を保つ機能。 | 国際化対応の観点で「言語切替一貫性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `apps/web/src/components/toolbar/LanguageToggle.tsx` | - | - | - | - 言語切替一貫性は運用上の不足が残っている | i18n-team | 2026-03-18 |
| `i18n.pluralization_rules` | i18n | 複数形・数量表現ルール | 数量に応じた自然な文言変化を実装し、意味誤解を防ぐ機能。 | 国際化対応の観点で「複数形・数量表現ルール」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/i18n/src/config.ts` | - | - | - | - 複数形・数量表現ルールは運用上の不足が残っている | i18n-team | 2026-03-26 |
| `i18n.test_localized_ui` | i18n | ローカライズUIテスト | 多言語表示をテストで検証し、翻訳変更によるUI回帰を抑える機能。 | 国際化対応の観点で「ローカライズUIテスト」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/__tests__/components/ValidationPanel.test.tsx` | `apps/web/src/__tests__/components/ValidationPanel.test.tsx` | - | - | - ローカライズUIテストは運用上の不足が残っている | i18n-team | 2026-03-22 |
| `i18n.date_number_locale` | i18n | 日付/数値ロケール表示 | 日付・数値をロケール準拠で表示し、地域依存の読み違いを防ぐ機能。 | 国際化対応の観点で「日付/数値ロケール表示」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L0 | L0 | gap | `apps/web/src/lib` | - | - | - | - 日付/数値ロケール表示は運用上の不足が残っている | i18n-team | 2026-03-30 |
| `i18n.fallback_policy` | i18n | 翻訳フォールバック方針 | 翻訳欠落時のフォールバックを定義し、表示不能を回避する機能。 | 国際化対応の観点で「翻訳フォールバック方針」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/i18n/src/config.ts` | - | - | - | - 翻訳フォールバック方針は運用上の不足が残っている | i18n-team | 2026-03-25 |
| `i18n.translation_review_flow` | i18n | 翻訳レビュー運用フロー | 翻訳更新のレビュー手順を標準化し、品質ばらつきを抑える機能。 | 国際化対応の観点で「翻訳レビュー運用フロー」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L0 | L0 | gap | `docs/PHASE4_TRACK_M.md` | - | - | - | - 翻訳レビュー運用フローは運用上の不足が残っている | i18n-team | 2026-04-04 |
| `mcp.tool_registration_coverage` | mcp | MCPツール登録網羅性 | MCPで公開する操作ツールを網羅し、AI側から必要操作が欠けない状態を維持する機能。 | MCP連携の観点で「MCPツール登録網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/mcp-server/src/tools` | `packages/mcp-server/src/__tests__/integration.test.ts` | - | - | - MCPツール登録網羅性は運用上の不足が残っている | mcp-team | 2026-03-12 |
| `mcp.entity_tool_quality` | mcp | エンティティ操作ツール品質 | エンティティ操作ツールの入出力契約を安定化し、安全な編集自動化を支える機能。 | MCP連携の観点で「エンティティ操作ツール品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/mcp-server/src/tools/entity-tools.ts` | `packages/mcp-server/src/__tests__/entity-tools.test.ts` | - | - | - エンティティ操作ツール品質は運用上の不足が残っている | mcp-team | 2026-03-15 |
| `mcp.storyboard_tool_quality` | mcp | Storyboard操作ツール品質 | Storyboard操作を構造破壊なく実行できるようにし、意図した編集結果を担保する機能。 | MCP連携の観点で「Storyboard操作ツール品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/mcp-server/src/tools/storyboard-tools.ts` | `packages/mcp-server/src/__tests__/storyboard-tools.test.ts` | - | - | - Storyboard操作ツール品質は運用上の不足が残っている | mcp-team | 2026-03-15 |
| `mcp.undo_redo_tool_quality` | mcp | Undo/Redoツール品質 | AI経由操作でもUndo/Redo整合を保ち、試行的編集の安全性を確保する機能。 | MCP連携の観点で「Undo/Redoツール品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/mcp-server/src/tools/undo-redo-tools.ts` | `packages/mcp-server/src/__tests__/undo-redo-tools.test.ts` | - | - | - Undo/Redoツール品質は運用上の不足が残っている | mcp-team | 2026-03-14 |
| `mcp.safe_apply_flow` | mcp | 提案→確認→適用フロー | 提案→確認→適用の手順を挟み、誤適用による破壊的変更を防ぐガード機能。 | MCP連携の観点で「提案→確認→適用フロー」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/mcp-server/src/server` | - | - | - | - 安全確認フローを追加する必要がある | mcp-team | 2026-03-28 |
| `mcp.prompt_resource_quality` | mcp | プロンプト/リソース品質 | プロンプト/リソース定義を品質管理し、AI応答の再現性を高める機能。 | MCP連携の観点で「プロンプト/リソース品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L2 | L2 | partial | `packages/mcp-server/src/prompts` | `packages/mcp-server/src/__tests__/integration.test.ts` | - | - | - プロンプト/リソース品質は運用上の不足が残っている | mcp-team | 2026-03-18 |
| `mcp.tool_error_contract` | mcp | ツールエラー契約統一 | ツール失敗時のエラー形式を統一し、クライアント側の復旧処理を単純化する機能。 | MCP連携の観点で「ツールエラー契約統一」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/mcp-server/src/utils` | `packages/mcp-server/src/__tests__/integration.test.ts` | - | - | - ツールエラー契約統一は運用上の不足が残っている | mcp-team | 2026-03-20 |
| `mcp.user_guidance_surface` | mcp | 利用者向け導線 | 利用者にツールの前提と安全な使い方を提示し、誤用を減らす導線機能。 | MCP連携の観点で「利用者向け導線」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/mcp-server/src/server` | - | - | - | - 利用者向け導線は運用上の不足が残っている | mcp-team | 2026-03-30 |
| `opendrive.xodr_parser_coverage` | opendrive | XODRパーサー網羅性 | OpenDRIVE記述を漏れなく内部モデルへ取り込み、道路データ入力の信頼性を確保する機能。 | OpenDRIVE処理の観点で「XODRパーサー網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/opendrive/src/parser/xodr-parser.ts` | `packages/opendrive/src/__tests__/parser/xodr-parser.test.ts` | - | - | - 複雑道路データの境界ケース追加が必要 | opendrive-team | 2026-03-14 |
| `opendrive.geometry_accuracy` | opendrive | 幾何計算精度 | 道路中心線・曲率・接線などの幾何計算誤差を抑え、位置解決の基礎精度を担保する機能。 | OpenDRIVE処理の観点で「幾何計算精度」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/opendrive/src/geometry` | `packages/opendrive/src/__tests__/geometry/reference-line.test.ts` | - | - | - スパイラル連結部の誤差検証を拡張する | opendrive-team | 2026-03-18 |
| `opendrive.mesh_generation_quality` | opendrive | 道路メッシュ生成品質 | 道路形状を破綻なくメッシュ化し、3D表示時の欠け・ねじれ・段差を防ぐ機能。 | OpenDRIVE処理の観点で「道路メッシュ生成品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/opendrive/src/mesh/road-mesh-generator.ts` | `packages/opendrive/src/__tests__/mesh/road-mesh-generator.test.ts` | - | - | - 高密度道路でのパフォーマンス検証が不足 | opendrive-team | 2026-03-22 |
| `opendrive.lane_boundary_consistency` | opendrive | 車線境界計算整合性 | 車線境界計算を一貫させ、隣接車線との接続不整合を防止する機能。 | OpenDRIVE処理の観点で「車線境界計算整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/opendrive/src/geometry/lane-boundary.ts` | `packages/opendrive/src/__tests__/geometry/lane-boundary.test.ts` | - | - | - 車線境界計算整合性は運用上の不足が残っている | opendrive-team | 2026-03-20 |
| `opendrive.elevation_profile_support` | opendrive | 標高プロファイル対応 | 標高変化を正確に反映し、坂道や起伏のある道路を3D上で再現する機能。 | OpenDRIVE処理の観点で「標高プロファイル対応」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/opendrive/src/geometry/reference-line.ts` | `packages/opendrive/src/__tests__/integration/parse-and-mesh.test.ts` | - | - | - 標高プロファイル対応は運用上の不足が残っている | opendrive-team | 2026-03-24 |
| `opendrive.large_map_optimization` | opendrive | 大規模地図最適化 | 大規模地図でも描画遅延やメモリ過多を抑え、実用的な操作速度を維持する機能。 | OpenDRIVE処理の観点で「大規模地図最適化」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/opendrive/src/mesh/road-mesh-generator.ts` | - | - | - | - LOD・分割ロード戦略が未整備 | opendrive-team | 2026-03-30 |
| `opendrive.roadmark_semantics` | opendrive | RoadMark意味解釈整備 | 路面標示の種類・意味を保持して描画し、道路ルール理解に必要な情報を可視化する機能。 | OpenDRIVE処理の観点で「RoadMark意味解釈整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/opendrive/src/mesh/road-mark-mesh.ts` | - | - | - | - 線種ごとの意味表現が限定的 | opendrive-team | 2026-03-26 |
| `opendrive.import_diagnostics` | opendrive | XODR読込診断メッセージ | XODR読込失敗時に原因位置と内容を提示し、修正判断を早める診断機能。 | OpenDRIVE処理の観点で「XODR読込診断メッセージ」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L2 | L2 | partial | `apps/server/src/services/scenario-service.ts` | `apps/server/src/__tests__/services/scenario-service.test.ts` | - | - | - 警告分類の粒度改善が必要 | opendrive-team | 2026-03-16 |
| `qa.unit_coverage_core` | qa | コアユニットテスト維持 | コアロジックの単体回帰を継続監視し、基礎品質の劣化を早期検知する機能。 | テスト品質の観点で「コアユニットテスト維持」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/openscenario/src/__tests__` | `packages/openscenario/src/__tests__/round-trip/round-trip.test.ts` | - | - | - コアユニットテスト維持は運用上の不足が残っている | qa-team | 2026-03-10 |
| `qa.unit_coverage_viewer` | qa | 3Dユニットテスト維持 | 3D関連ロジックの単体回帰を継続検知し、描画品質劣化を防ぐ機能。 | テスト品質の観点で「3Dユニットテスト維持」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/3d-viewer/src/__tests__` | `packages/3d-viewer/src/__tests__/utils/position-resolver.test.ts` | - | - | - 3Dユニットテスト維持は運用上の不足が残っている | qa-team | 2026-03-10 |
| `qa.server_route_tests` | qa | サーバールートテスト整備 | サーバールートの契約をテストで固定し、API退行を防ぐ機能。 | テスト品質の観点で「サーバールートテスト整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/__tests__/routes` | `apps/server/src/__tests__/routes/file-routes.test.ts` | - | - | - サーバールートテスト整備は運用上の不足が残っている | qa-team | 2026-03-12 |
| `qa.playwright_smoke_pack` | qa | Playwrightスモークパック | 主要UI導線を短時間で検証し、PR段階で重大回帰を弾く機能。 | テスト品質の観点で「Playwrightスモークパック」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L0 | L0 | gap | `docs/PHASE4_TRACK_M.md` | - | - | - | - E2Eスイートを実体化する必要がある | qa-team | 2026-03-20 |
| `qa.playwright_full_regression` | qa | Playwrightフル回帰 | 広範囲シナリオを夜間検証し、統合不具合の蓄積を防ぐ機能。 | テスト品質の観点で「Playwrightフル回帰」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L0 | L0 | gap | `docs/PHASE4_TRACK_M.md` | - | - | - | - Playwrightフル回帰は運用上の不足が残っている | qa-team | 2026-04-01 |
| `qa.artifact_retention` | qa | 失敗時証跡保存（trace/video） | 失敗時証跡を保存し、再現調査と原因特定を高速化する機能。 | テスト品質の観点で「失敗時証跡保存（trace/video）」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L0 | L0 | gap | `docs/PHASE4_TRACK_M.md` | - | - | - | - 失敗時証跡保存（trace/video）は運用上の不足が残っている | qa-team | 2026-03-28 |
| `qa.contract_tests_maturity` | qa | 契約テスト整備 | 境界契約テストを整備し、実装変更時の互換破壊を抑止する機能。 | テスト品質の観点で「契約テスト整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/__tests__/routes/scenario-routes.test.ts` | `apps/server/src/__tests__/routes/scenario-routes.test.ts` | - | - | - 契約テスト整備は運用上の不足が残っている | qa-team | 2026-03-18 |
| `qa.flaky_test_control` | qa | フレーキーテスト制御 | 不安定テストを管理して信号品質を維持し、CI信頼性を保つ機能。 | テスト品質の観点で「フレーキーテスト制御」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `apps/web/src/__tests__` | - | - | - | - フレーキーテスト制御は運用上の不足が残っている | qa-team | 2026-03-24 |
| `sim.service_switching` | sim | Mock/GT_Simサービス切替 | Mockと実GT_Simを切替可能にし、開発検証と実運用検証を両立させる機能。 | シミュレーション連携の観点で「Mock/GT_Simサービス切替」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/app.ts` | `apps/server/src/__tests__/services/mock-esmini-service.test.ts` | - | - | - Mock/GT_Simサービス切替は運用上の不足が残っている | sim-team | 2026-03-09 |
| `sim.gtsim_default_runtime` | sim | GT_Sim標準実行経路 | 実GT_Simを標準実行経路として扱い、本番相当の検証を常時可能にする機能。 | シミュレーション連携の観点で「GT_Sim標準実行経路」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `apps/server/src/app.ts` | - | - | - | - 既定経路がMock運用のまま | sim-team | 2026-03-10 |
| `sim.ws_frame_streaming` | sim | WebSocketフレーム配信整備 | フレームデータを遅延・欠落を抑えて配信し、再生系との同期を保つ機能。 | シミュレーション連携の観点で「WebSocketフレーム配信整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/websocket/ws-handler.ts` | `apps/server/src/__tests__/websocket/ws-handler.test.ts` | - | - | - WebSocketフレーム配信整備は運用上の不足が残っている | sim-team | 2026-03-14 |
| `sim.playback_store_integrity` | sim | 再生ストア整合性 | 再生状態管理を一貫化し、再生・停止・シーク時の不整合を防ぐ機能。 | シミュレーション連携の観点で「再生ストア整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `apps/web/src/stores/simulation-store.ts` | - | - | - | - 再生ストア整合性は運用上の不足が残っている | sim-team | 2026-03-18 |
| `sim.timeline_controls` | sim | タイムライン制御UI整備 | 再生速度・シーク・開始停止を直感的に操作できるUI制御機能。 | シミュレーション連携の観点で「タイムライン制御UI整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `apps/web/src/components/panels/SimulationTimeline.tsx` | - | - | - | - タイムライン制御UI整備は運用上の不足が残っている | sim-team | 2026-03-16 |
| `sim.error_surface_to_ui` | sim | シミュレーションエラー可視化 | 実行時エラーをUIへ正規化して通知し、原因把握と回復判断を支援する機能。 | シミュレーション連携の観点で「シミュレーションエラー可視化」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/hooks/use-websocket.ts` | `apps/web/src/__tests__/hooks/use-validation.test.tsx` | - | - | - シミュレーションエラー可視化は運用上の不足が残っている | sim-team | 2026-03-23 |
| `sim.session_lifecycle` | sim | セッションライフサイクル管理 | シミュレーションセッションの開始から終了までを安全に管理するライフサイクル機能。 | シミュレーション連携の観点で「セッションライフサイクル管理」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/server/src/services/simulation-service.ts` | `apps/server/src/__tests__/routes/simulation-routes.test.ts` | - | - | - セッションライフサイクル管理は運用上の不足が残っている | sim-team | 2026-03-20 |
| `sim.real_runtime_e2e` | sim | 実GT_Sim連携E2E | 実ランタイム経路をE2Eで継続検証し、統合回帰を早期検知する機能。 | シミュレーション連携の観点で「実GT_Sim連携E2E」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L0 | L0 | gap | `docs/PHASE4_TRACK_M.md` | - | - | - | - 実行系E2Eスイートが未実装 | sim-team | 2026-04-04 |
| `templates.use_case_coverage` | templates | ユースケーステンプレート網羅性 | 主要運転シナリオをテンプレート化し、初期作成の手間を大幅に削減する機能。 | テンプレート機能の観点で「ユースケーステンプレート網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/templates/src/use-cases` | - | - | - | - シナリオパターン網羅を拡張する | templates-team | 2026-03-24 |
| `templates.action_component_coverage` | templates | アクションコンポーネント網羅性 | Action部品を再利用可能に揃え、細粒度編集を効率化する機能。 | テンプレート機能の観点で「アクションコンポーネント網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `packages/templates/src/action-components` | - | - | - | - アクションコンポーネント網羅性は運用上の不足が残っている | templates-team | 2026-03-24 |
| `templates.parameter_validation` | templates | テンプレートパラメータ妥当性 | 入力パラメータの妥当性を検査し、不正テンプレート適用を事前に防ぐ機能。 | テンプレート機能の観点で「テンプレートパラメータ妥当性」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `packages/templates/src/helpers` | `apps/web/src/__tests__/components/TemplatePalettePanel.test.tsx` | - | - | - テンプレートパラメータ妥当性は運用上の不足が残っている | templates-team | 2026-03-18 |
| `templates.localized_metadata` | templates | テンプレートメタデータ多言語化 | テンプレート説明を多言語化し、言語差による選択ミスを減らす機能。 | テンプレート機能の観点で「テンプレートメタデータ多言語化」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/templates/src/metadata` | - | - | - | - テンプレートメタデータ多言語化は運用上の不足が残っている | templates-team | 2026-03-20 |
| `templates.preview_generation` | templates | テンプレート適用前プレビュー | 適用前に生成内容を確認できるようにし、期待外れ適用を防ぐ機能。 | テンプレート機能の観点で「テンプレート適用前プレビュー」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `apps/web/src/components/template/ParameterDialog.tsx` | - | - | - | - テンプレート適用前プレビューは運用上の不足が残っている | templates-team | 2026-03-26 |
| `templates.apply_consistency` | templates | テンプレート適用整合 | テンプレート適用結果を一貫化し、同条件で同結果を再現する機能。 | テンプレート機能の観点で「テンプレート適用整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/hooks/use-template-apply.ts` | `apps/web/src/__tests__/components/TemplatePalettePanel.test.tsx` | - | - | - テンプレート適用整合は運用上の不足が残っている | templates-team | 2026-03-14 |
| `templates.quality_rank` | templates | テンプレート品質ランク付け | テンプレート品質を可視化し、採用優先度を判断しやすくする機能。 | テンプレート機能の観点で「テンプレート品質ランク付け」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L0 | L0 | gap | `packages/templates/src/metadata` | - | - | - | - テンプレート品質ランク付けは運用上の不足が残っている | templates-team | 2026-04-03 |
| `templates.catalog_alignment` | templates | カタログ参照整合 | カタログ参照整合を維持し、実行時に参照切れが起きない状態を保つ機能。 | テンプレート機能の観点で「カタログ参照整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `packages/templates/src/helpers/actions.ts` | - | - | - | - カタログ参照整合は運用上の不足が残っている | templates-team | 2026-03-28 |
| `ux.layout_responsiveness` | ux | 統合レイアウトのレスポンシブ品質 | 画面サイズに応じて編集要素を破綻なく配置し、主要操作を常に継続可能にする機能。 | エディタUXの観点で「統合レイアウトのレスポンシブ品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `apps/web/src/components/layout/EditorLayout.tsx` | - | - | - | - 狭幅表示で操作密度が高い | web-team | 2026-03-21 |
| `ux.deep_property_editing` | ux | Event/Action/Triggerの詳細編集 | 主要要素の詳細属性をUIから直接編集できるようにし、XML手編集依存を減らす機能。 | エディタUXの観点で「Event/Action/Triggerの詳細編集」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L1 | L1 | gap | `apps/web/src/components/property/PropertyEditor.tsx` | - | - | - | - Entity以外は閲覧中心のため編集導線を拡張する | web-team | 2026-03-12 |
| `ux.template_discovery` | ux | テンプレート検索・フィルタ | 必要なテンプレートへ素早く到達できる探索導線を提供し、作業開始コストを下げる機能。 | エディタUXの観点で「テンプレート検索・フィルタ」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `apps/web/src/components/panels/TemplatePalettePanel.tsx` | - | - | - | - テンプレート検索・フィルタは運用上の不足が残っている | web-team | 2026-03-15 |
| `ux.validation_focus_navigation` | ux | バリデーションから該当要素への遷移 | 検証結果から該当要素へ即座に移動できるようにし、修正ループを短縮する機能。 | エディタUXの観点で「バリデーションから該当要素への遷移」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/components/validation/ValidationIssueList.tsx` | `apps/web/src/__tests__/components/ValidationPanel.test.tsx` | - | - | - バリデーションから該当要素への遷移は運用上の不足が残っている | web-team | 2026-03-18 |
| `ux.shortcut_consistency` | ux | キーボードショートカット整合 | ショートカット挙動を文脈横断で統一し、操作ミスと学習コストを抑える機能。 | エディタUXの観点で「キーボードショートカット整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L2 | L1 | L1 | gap | `apps/web/src/hooks/use-keyboard-shortcuts.ts` | - | - | - | - コンテキスト別の衝突解決が必要 | web-team | 2026-03-23 |
| `ux.error_recovery_flow` | ux | エラー時の回復フロー | 失敗時に復旧手順を提示し、ユーザーが編集状態を維持したまま回復できる機能。 | エディタUXの観点で「エラー時の回復フロー」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/components/ErrorBoundary.tsx` | `apps/web/src/__tests__/hooks/use-file-operations.test.tsx` | - | - | - エラー時の回復フローは運用上の不足が残っている | web-team | 2026-03-25 |
| `ux.selection_sync_feedback` | ux | ノード/3D/一覧の選択同期可視化 | 一覧・ノード・3D間で選択状態を同期し、現在対象の認知負荷を下げる機能。 | エディタUXの観点で「ノード/3D/一覧の選択同期可視化」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/stores/editor-store.ts` | `apps/web/src/__tests__/stores/editor-store.test.ts` | - | - | - ノード/3D/一覧の選択同期可視化は運用上の不足が残っている | web-team | 2026-03-17 |
| `ux.accessibility_baseline` | ux | アクセシビリティ基盤 | キーボード操作や視認性要件を満たし、多様な利用条件で編集可能にする基盤機能。 | エディタUXの観点で「アクセシビリティ基盤」を実運用レベルまで明確化し、状態を継続監視できるようにする。 | L3 | L2 | L2 | partial | `apps/web/src/components/ui` | `apps/web/src/__tests__/components/EntityListPanel.test.tsx` | - | - | - キーボード操作とariaの追加検証が必要 | web-team | 2026-03-29 |

## 受け入れ条件（Capability別）

### 3d.road_rendering_pipeline

道路描画パイプライン整備

- 機能の意味: OpenDRIVEの道路構造を、3Dビューで破綻なく一貫表示するための基盤機能。
- 目的: 3D描画の観点で「道路描画パイプライン整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/road/RoadNetwork.tsx。機能要件として道路描画パイプライン整備の実装・検証・可視化を含む。
- 完了定義: 道路描画パイプライン整備が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 道路描画パイプライン整備に関する仕様が実装と整合している<br>- 道路描画パイプライン整備の正常系と代表的な異常系が検証可能である<br>- 道路描画パイプライン整備の状態をMatrix上で追跡できる

### 3d.entity_primitive_rendering

エンティティ基本描画

- 機能の意味: 車両・歩行者・障害物などのシナリオ主体を、最低限識別可能な形で3D空間に表示する機能。
- 目的: 3D描画の観点で「エンティティ基本描画」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/entities/EntityGroup.tsx。機能要件としてエンティティ基本描画の実装・検証・可視化を含む。
- 完了定義: エンティティ基本描画が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- エンティティ基本描画に関する仕様が実装と整合している<br>- エンティティ基本描画の正常系と代表的な異常系が検証可能である<br>- エンティティ基本描画の状態をMatrix上で追跡できる

### 3d.relative_route_geo_resolution

relative/route/geo位置解決

- 機能の意味: relative/route/geo形式の位置定義を実座標へ解決し、シナリオ上の意図した配置を3Dで再現する機能。
- 目的: 3D描画の観点で「relative/route/geo位置解決」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/utils/position-resolver.ts。機能要件としてrelative/route/geo位置解決の実装・検証・可視化を含む。
- 完了定義: relative/route/geo位置解決が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- relative/route/geo位置解決に関する仕様が実装と整合している<br>- relative/route/geo位置解決の正常系と代表的な異常系が検証可能である<br>- relative/route/geo位置解決の状態をMatrix上で追跡できる

### 3d.playback_ui_wiring

3D再生UI連携

- 機能の意味: シミュレーション再生状態（時刻・フレーム・再生制御）を3D表示と同期させる接続機能。
- 目的: 3D描画の観点で「3D再生UI連携」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/components/ScenarioViewer.tsx。機能要件として3D再生UI連携の実装・検証・可視化を含む。
- 完了定義: 3D再生UI連携が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 3D再生UI連携に関する仕様が実装と整合している<br>- 3D再生UI連携の正常系と代表的な異常系が検証可能である<br>- 3D再生UI連携の状態をMatrix上で追跡できる

### 3d.camera_focus_behavior

カメラフォーカス挙動

- 機能の意味: 選択対象へ素早く視点を移し、編集・確認対象を見失わない操作性を担保する機能。
- 目的: 3D描画の観点で「カメラフォーカス挙動」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/scene/CameraController.tsx。機能要件としてカメラフォーカス挙動の実装・検証・可視化を含む。
- 完了定義: カメラフォーカス挙動が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- カメラフォーカス挙動に関する仕様が実装と整合している<br>- カメラフォーカス挙動の正常系と代表的な異常系が検証可能である<br>- カメラフォーカス挙動の状態をMatrix上で追跡できる

### 3d.label_visibility_control

道路/エンティティラベル制御

- 機能の意味: 道路ID・車線ID・エンティティ名などの補助情報を、必要に応じて表示/非表示し認知負荷を調整する機能。
- 目的: 3D描画の観点で「道路/エンティティラベル制御」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/road/RoadLabels.tsx。機能要件として道路/エンティティラベル制御の実装・検証・可視化を含む。
- 完了定義: 道路/エンティティラベル制御が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 道路/エンティティラベル制御に関する仕様が実装と整合している<br>- 道路/エンティティラベル制御の正常系と代表的な異常系が検証可能である<br>- 道路/エンティティラベル制御の状態をMatrix上で追跡できる

### 3d.simulation_overlay_consistency

シミュレーションオーバーレイ整合

- 機能の意味: シミュレーション中の動的状態を、編集時の静的状態と矛盾なく重ねて表示する整合機能。
- 目的: 3D描画の観点で「シミュレーションオーバーレイ整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/scenario/SimulationOverlay.tsx。機能要件としてシミュレーションオーバーレイ整合の実装・検証・可視化を含む。
- 完了定義: シミュレーションオーバーレイ整合が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- シミュレーションオーバーレイ整合に関する仕様が実装と整合している<br>- シミュレーションオーバーレイ整合の正常系と代表的な異常系が検証可能である<br>- シミュレーションオーバーレイ整合の状態をMatrix上で追跡できる

### 3d.visual_asset_upgrade

3Dアセット高度化（モデル/アニメ）

- 機能の意味: プリミティブ表示を実用的なモデル/アニメーションへ拡張し、シナリオ理解と妥当性判断の精度を上げる機能。
- 目的: 3D描画の観点で「3Dアセット高度化（モデル/アニメ）」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/entities/VehicleEntity.tsx。機能要件として3Dアセット高度化（モデル/アニメ）の実装・検証・可視化を含む。
- 完了定義: 3Dアセット高度化（モデル/アニメ）が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 3Dアセット高度化（モデル/アニメ）に関する仕様が実装と整合している<br>- 3Dアセット高度化（モデル/アニメ）の正常系と代表的な異常系が検証可能である<br>- 3Dアセット高度化（モデル/アニメ）の状態をMatrix上で追跡できる

### backend.file_api_stability

ファイルAPI安定性

- 機能の意味: XOSC/XODRの読込・保存・検証APIを破壊せず運用し、編集ワークフローの土台を安定させる機能。
- 目的: バックエンドAPIの観点で「ファイルAPI安定性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/routes/file-routes.ts。機能要件としてファイルAPI安定性の実装・検証・可視化を含む。
- 完了定義: ファイルAPI安定性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- ファイルAPI安定性に関する仕様が実装と整合している<br>- ファイルAPI安定性の正常系と代表的な異常系が検証可能である<br>- ファイルAPI安定性の状態をMatrix上で追跡できる

### backend.scenario_api_stability

シナリオAPI安定性

- 機能の意味: シナリオのimport/export APIでデータ欠落や契約逸脱を防ぎ、編集結果を安全に受け渡す機能。
- 目的: バックエンドAPIの観点で「シナリオAPI安定性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/routes/scenario-routes.ts。機能要件としてシナリオAPI安定性の実装・検証・可視化を含む。
- 完了定義: シナリオAPI安定性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- シナリオAPI安定性に関する仕様が実装と整合している<br>- シナリオAPI安定性の正常系と代表的な異常系が検証可能である<br>- シナリオAPI安定性の状態をMatrix上で追跡できる

### backend.simulation_api_stability

シミュレーションAPI安定性

- 機能の意味: シミュレーション開始・停止・状態取得APIを安定提供し、実行制御を確実に行うための機能。
- 目的: バックエンドAPIの観点で「シミュレーションAPI安定性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/routes/simulation-routes.ts。機能要件としてシミュレーションAPI安定性の実装・検証・可視化を含む。
- 完了定義: シミュレーションAPI安定性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- シミュレーションAPI安定性に関する仕様が実装と整合している<br>- シミュレーションAPI安定性の正常系と代表的な異常系が検証可能である<br>- シミュレーションAPI安定性の状態をMatrix上で追跡できる

### backend.input_contract_validation

入力契約バリデーション強化

- 機能の意味: API入力を契約どおりに検査し、不正リクエストが内部処理へ侵入するのを防ぐ防波堤機能。
- 目的: バックエンドAPIの観点で「入力契約バリデーション強化」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/utils/errors.ts。機能要件として入力契約バリデーション強化の実装・検証・可視化を含む。
- 完了定義: 入力契約バリデーション強化が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 入力契約バリデーション強化に関する仕様が実装と整合している<br>- 入力契約バリデーション強化の正常系と代表的な異常系が検証可能である<br>- 入力契約バリデーション強化の状態をMatrix上で追跡できる

### backend.authz_baseline

認証/権限制御基盤

- 機能の意味: 利用者・権限に応じて操作可能範囲を制御し、誤操作や不正操作による影響を限定する機能。
- 目的: バックエンドAPIの観点で「認証/権限制御基盤」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/app.ts。機能要件として認証/権限制御基盤の実装・検証・可視化を含む。
- 完了定義: 認証/権限制御基盤が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 認証/権限制御基盤に関する仕様が実装と整合している<br>- 認証/権限制御基盤の正常系と代表的な異常系が検証可能である<br>- 認証/権限制御基盤の状態をMatrix上で追跡できる

### backend.audit_logging

監査ログ方針

- 機能の意味: 誰がいつ何を実行したかを追跡可能にし、障害調査と説明責任を成立させる機能。
- 目的: バックエンドAPIの観点で「監査ログ方針」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/app.ts。機能要件として監査ログ方針の実装・検証・可視化を含む。
- 完了定義: 監査ログ方針が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 監査ログ方針に関する仕様が実装と整合している<br>- 監査ログ方針の正常系と代表的な異常系が検証可能である<br>- 監査ログ方針の状態をMatrix上で追跡できる

### backend.ws_error_contract

WebSocketエラー契約統一

- 機能の意味: WebSocket通信時のエラー形式を統一し、クライアント側で一貫した復旧処理を可能にする機能。
- 目的: バックエンドAPIの観点で「WebSocketエラー契約統一」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/websocket/ws-handler.ts。機能要件としてWebSocketエラー契約統一の実装・検証・可視化を含む。
- 完了定義: WebSocketエラー契約統一が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- WebSocketエラー契約統一に関する仕様が実装と整合している<br>- WebSocketエラー契約統一の正常系と代表的な異常系が検証可能である<br>- WebSocketエラー契約統一の状態をMatrix上で追跡できる

### backend.operational_limits

運用上限値設定（rate/size）

- 機能の意味: レート・ペイロードサイズ等の上限を明確化し、過負荷や悪用によるサービス劣化を防ぐ機能。
- 目的: バックエンドAPIの観点で「運用上限値設定（rate/size）」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/app.ts。機能要件として運用上限値設定（rate/size）の実装・検証・可視化を含む。
- 完了定義: 運用上限値設定（rate/size）が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 運用上限値設定（rate/size）に関する仕様が実装と整合している<br>- 運用上限値設定（rate/size）の正常系と代表的な異常系が検証可能である<br>- 運用上限値設定（rate/size）の状態をMatrix上で追跡できる

### core.xosc_roundtrip_consistency

XOSCラウンドトリップ整合性

- 機能の意味: XOSCの parse→serialize→parse を往復してもシナリオ意味が変質しないことを保証する機能。
- 目的: OpenSCENARIO編集コアの観点で「XOSCラウンドトリップ整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/openscenario/src/parser/xosc-parser.ts。機能要件としてXOSCラウンドトリップ整合性の実装・検証・可視化を含む。
- 完了定義: XOSCラウンドトリップ整合性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- XOSCラウンドトリップ整合性に関する仕様が実装と整合している<br>- XOSCラウンドトリップ整合性の正常系と代表的な異常系が検証可能である<br>- XOSCラウンドトリップ整合性の状態をMatrix上で追跡できる

### core.param_variable_modify_mapping

Parameter/Variable modifyマッピング整合

- 機能の意味: ParameterAction/VariableAction の modify ルールが入出力で一致し、変換時の意味ずれを防ぐ機能。
- 目的: OpenSCENARIO編集コアの観点で「Parameter/Variable modifyマッピング整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/openscenario/src/serializer/build-actions.ts。機能要件としてParameter/Variable modifyマッピング整合の実装・検証・可視化を含む。
- 完了定義: Parameter/Variable modifyマッピング整合が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Parameter/Variable modifyマッピング整合に関する仕様が実装と整合している<br>- Parameter/Variable modifyマッピング整合の正常系と代表的な異常系が検証可能である<br>- Parameter/Variable modifyマッピング整合の状態をMatrix上で追跡できる

### core.unknown_element_tolerance

未知要素の寛容パース

- 機能の意味: 未知要素を扱う際に即時停止を避け、取り込み継続と警告提示を両立する耐障害機能。
- 目的: OpenSCENARIO編集コアの観点で「未知要素の寛容パース」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/openscenario/src/parser/parse-actions.ts。機能要件として未知要素の寛容パースの実装・検証・可視化を含む。
- 完了定義: 未知要素の寛容パースが required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 未知要素の寛容パースに関する仕様が実装と整合している<br>- 未知要素の寛容パースの正常系と代表的な異常系が検証可能である<br>- 未知要素の寛容パースの状態をMatrix上で追跡できる

### core.validator_rule_coverage

バリデーションルール網羅性

- 機能の意味: 構造・参照・値の妥当性を検証し、シナリオ品質を編集段階で担保する検証機能。
- 目的: OpenSCENARIO編集コアの観点で「バリデーションルール網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/openscenario/src/validator/xosc-validator.ts。機能要件としてバリデーションルール網羅性の実装・検証・可視化を含む。
- 完了定義: バリデーションルール網羅性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- バリデーションルール網羅性に関する仕様が実装と整合している<br>- バリデーションルール網羅性の正常系と代表的な異常系が検証可能である<br>- バリデーションルール網羅性の状態をMatrix上で追跡できる

### core.schema_version_support

OpenSCENARIOバージョン互換管理

- 機能の意味: OpenSCENARIOバージョン差異を管理し、互換範囲外データの混入を抑止する互換管理機能。
- 目的: OpenSCENARIO編集コアの観点で「OpenSCENARIOバージョン互換管理」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/shared/src/types/scenario.ts。機能要件としてOpenSCENARIOバージョン互換管理の実装・検証・可視化を含む。
- 完了定義: OpenSCENARIOバージョン互換管理が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- OpenSCENARIOバージョン互換管理に関する仕様が実装と整合している<br>- OpenSCENARIOバージョン互換管理の正常系と代表的な異常系が検証可能である<br>- OpenSCENARIOバージョン互換管理の状態をMatrix上で追跡できる

### core.import_error_recovery

インポート失敗時の回復導線

- 機能の意味: インポート失敗時に原因を提示し、再試行や代替操作へ戻せる回復導線を提供する機能。
- 目的: OpenSCENARIO編集コアの観点で「インポート失敗時の回復導線」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/hooks/use-file-operations.ts。機能要件としてインポート失敗時の回復導線の実装・検証・可視化を含む。
- 完了定義: インポート失敗時の回復導線が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- インポート失敗時の回復導線に関する仕様が実装と整合している<br>- インポート失敗時の回復導線の正常系と代表的な異常系が検証可能である<br>- インポート失敗時の回復導線の状態をMatrix上で追跡できる

### core.command_undo_redo_integrity

Undo/Redo整合性

- 機能の意味: 複数操作のUndo/Redoで状態遷移が破綻しないことを保証し、編集作業の可逆性を担保する機能。
- 目的: OpenSCENARIO編集コアの観点で「Undo/Redo整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/scenario-engine/src/store/scenario-store.ts。機能要件としてUndo/Redo整合性の実装・検証・可視化を含む。
- 完了定義: Undo/Redo整合性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Undo/Redo整合性に関する仕様が実装と整合している<br>- Undo/Redo整合性の正常系と代表的な異常系が検証可能である<br>- Undo/Redo整合性の状態をMatrix上で追跡できる

### core.id_stability_policy

要素ID安定性ポリシー

- 機能の意味: 要素IDの一意性と安定参照を維持し、編集・同期・追跡の基盤を成立させる機能。
- 目的: OpenSCENARIO編集コアの観点で「要素ID安定性ポリシー」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/scenario-engine/src/store/defaults.ts。機能要件として要素ID安定性ポリシーの実装・検証・可視化を含む。
- 完了定義: 要素ID安定性ポリシーが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 要素ID安定性ポリシーに関する仕様が実装と整合している<br>- 要素ID安定性ポリシーの正常系と代表的な異常系が検証可能である<br>- 要素ID安定性ポリシーの状態をMatrix上で追跡できる

### devops.maturity_schema_validation

Capabilityスキーマ検証運用

- 機能の意味: Capability定義の形式崩れを自動検出し、運用データ品質を守る機能。
- 目的: 運用基盤の観点で「Capabilityスキーマ検証運用」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は scripts/maturity/validate-capabilities.mjs。機能要件としてCapabilityスキーマ検証運用の実装・検証・可視化を含む。
- 完了定義: Capabilityスキーマ検証運用が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Capabilityスキーマ検証運用に関する仕様が実装と整合している<br>- Capabilityスキーマ検証運用の正常系と代表的な異常系が検証可能である<br>- Capabilityスキーマ検証運用の状態をMatrix上で追跡できる

### devops.maturity_matrix_generation

Matrix自動生成運用

- 機能の意味: 定義データから可視化成果物を自動生成し、日次確認を定常化する機能。
- 目的: 運用基盤の観点で「Matrix自動生成運用」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は scripts/maturity/generate-matrix.mjs。機能要件としてMatrix自動生成運用の実装・検証・可視化を含む。
- 完了定義: Matrix自動生成運用が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Matrix自動生成運用に関する仕様が実装と整合している<br>- Matrix自動生成運用の正常系と代表的な異常系が検証可能である<br>- Matrix自動生成運用の状態をMatrix上で追跡できる

### devops.domain_split_governance

ドメイン分割ガバナンス

- 機能の意味: ドメイン分割運用の責任境界を定義し、更新競合と属人化を防ぐ機能。
- 目的: 運用基盤の観点で「ドメイン分割ガバナンス」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/maturity/GOVERNANCE.md。機能要件としてドメイン分割ガバナンスの実装・検証・可視化を含む。
- 完了定義: ドメイン分割ガバナンスが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- ドメイン分割ガバナンスに関する仕様が実装と整合している<br>- ドメイン分割ガバナンスの正常系と代表的な異常系が検証可能である<br>- ドメイン分割ガバナンスの状態をMatrix上で追跡できる

### devops.review_workflow_definition

レビュー運用定義

- 機能の意味: レビュー手順を標準化し、成熟度判定のぶれを抑える機能。
- 目的: 運用基盤の観点で「レビュー運用定義」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/maturity/README.md。機能要件としてレビュー運用定義の実装・検証・可視化を含む。
- 完了定義: レビュー運用定義が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- レビュー運用定義に関する仕様が実装と整合している<br>- レビュー運用定義の正常系と代表的な異常系が検証可能である<br>- レビュー運用定義の状態をMatrix上で追跡できる

### devops.ci_future_hook

CI連携拡張ポイント定義

- 機能の意味: 将来CI統合しやすい接続点を整備し、運用自動化へ移行可能にする機能。
- 目的: 運用基盤の観点で「CI連携拡張ポイント定義」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/maturity/README.md。機能要件としてCI連携拡張ポイント定義の実装・検証・可視化を含む。
- 完了定義: CI連携拡張ポイント定義が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- CI連携拡張ポイント定義に関する仕様が実装と整合している<br>- CI連携拡張ポイント定義の正常系と代表的な異常系が検証可能である<br>- CI連携拡張ポイント定義の状態をMatrix上で追跡できる

### devops.owner_assignment_policy

Owner割当方針

- 機能の意味: Owner割当基準を明確化し、未対応項目の放置を防ぐ機能。
- 目的: 運用基盤の観点で「Owner割当方針」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/maturity/GOVERNANCE.md。機能要件としてOwner割当方針の実装・検証・可視化を含む。
- 完了定義: Owner割当方針が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Owner割当方針に関する仕様が実装と整合している<br>- Owner割当方針の正常系と代表的な異常系が検証可能である<br>- Owner割当方針の状態をMatrix上で追跡できる

### devops.target_date_enforcement

期限設定運用

- 機能の意味: 期限未設定・期限超過を検出し、改善活動の停滞を可視化する機能。
- 目的: 運用基盤の観点で「期限設定運用」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は scripts/maturity/validate-capabilities.mjs。機能要件として期限設定運用の実装・検証・可視化を含む。
- 完了定義: 期限設定運用が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 期限設定運用に関する仕様が実装と整合している<br>- 期限設定運用の正常系と代表的な異常系が検証可能である<br>- 期限設定運用の状態をMatrix上で追跡できる

### devops.daily_weekly_ops

日次/週次運用サイクル

- 機能の意味: 日次/週次の確認サイクルを定義し、改善を継続的に回す運用機能。
- 目的: 運用基盤の観点で「日次/週次運用サイクル」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/maturity/GOVERNANCE.md。機能要件として日次/週次運用サイクルの実装・検証・可視化を含む。
- 完了定義: 日次/週次運用サイクルが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 日次/週次運用サイクルに関する仕様が実装と整合している<br>- 日次/週次運用サイクルの正常系と代表的な異常系が検証可能である<br>- 日次/週次運用サイクルの状態をMatrix上で追跡できる

### i18n.resource_coverage

翻訳リソース網羅率

- 機能の意味: 翻訳キーを網羅し、言語切替時の未翻訳表示を最小化する機能。
- 目的: 国際化対応の観点で「翻訳リソース網羅率」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/i18n/src/locales。機能要件として翻訳リソース網羅率の実装・検証・可視化を含む。
- 完了定義: 翻訳リソース網羅率が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 翻訳リソース網羅率に関する仕様が実装と整合している<br>- 翻訳リソース網羅率の正常系と代表的な異常系が検証可能である<br>- 翻訳リソース網羅率の状態をMatrix上で追跡できる

### i18n.hardcoded_text_elimination

ハードコード文言排除

- 機能の意味: UIのハードコード文言を排除し、翻訳不能箇所をなくす機能。
- 目的: 国際化対応の観点で「ハードコード文言排除」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components。機能要件としてハードコード文言排除の実装・検証・可視化を含む。
- 完了定義: ハードコード文言排除が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- ハードコード文言排除に関する仕様が実装と整合している<br>- ハードコード文言排除の正常系と代表的な異常系が検証可能である<br>- ハードコード文言排除の状態をMatrix上で追跡できる

### i18n.language_toggle_consistency

言語切替一貫性

- 機能の意味: 言語切替時の表示崩れや文脈ズレを防ぎ、一貫した表示を保つ機能。
- 目的: 国際化対応の観点で「言語切替一貫性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/toolbar/LanguageToggle.tsx。機能要件として言語切替一貫性の実装・検証・可視化を含む。
- 完了定義: 言語切替一貫性が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 言語切替一貫性に関する仕様が実装と整合している<br>- 言語切替一貫性の正常系と代表的な異常系が検証可能である<br>- 言語切替一貫性の状態をMatrix上で追跡できる

### i18n.pluralization_rules

複数形・数量表現ルール

- 機能の意味: 数量に応じた自然な文言変化を実装し、意味誤解を防ぐ機能。
- 目的: 国際化対応の観点で「複数形・数量表現ルール」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/i18n/src/config.ts。機能要件として複数形・数量表現ルールの実装・検証・可視化を含む。
- 完了定義: 複数形・数量表現ルールが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 複数形・数量表現ルールに関する仕様が実装と整合している<br>- 複数形・数量表現ルールの正常系と代表的な異常系が検証可能である<br>- 複数形・数量表現ルールの状態をMatrix上で追跡できる

### i18n.test_localized_ui

ローカライズUIテスト

- 機能の意味: 多言語表示をテストで検証し、翻訳変更によるUI回帰を抑える機能。
- 目的: 国際化対応の観点で「ローカライズUIテスト」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/__tests__/components/ValidationPanel.test.tsx。機能要件としてローカライズUIテストの実装・検証・可視化を含む。
- 完了定義: ローカライズUIテストが required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- ローカライズUIテストに関する仕様が実装と整合している<br>- ローカライズUIテストの正常系と代表的な異常系が検証可能である<br>- ローカライズUIテストの状態をMatrix上で追跡できる

### i18n.date_number_locale

日付/数値ロケール表示

- 機能の意味: 日付・数値をロケール準拠で表示し、地域依存の読み違いを防ぐ機能。
- 目的: 国際化対応の観点で「日付/数値ロケール表示」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/lib。機能要件として日付/数値ロケール表示の実装・検証・可視化を含む。
- 完了定義: 日付/数値ロケール表示が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 日付/数値ロケール表示に関する仕様が実装と整合している<br>- 日付/数値ロケール表示の正常系と代表的な異常系が検証可能である<br>- 日付/数値ロケール表示の状態をMatrix上で追跡できる

### i18n.fallback_policy

翻訳フォールバック方針

- 機能の意味: 翻訳欠落時のフォールバックを定義し、表示不能を回避する機能。
- 目的: 国際化対応の観点で「翻訳フォールバック方針」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/i18n/src/config.ts。機能要件として翻訳フォールバック方針の実装・検証・可視化を含む。
- 完了定義: 翻訳フォールバック方針が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 翻訳フォールバック方針に関する仕様が実装と整合している<br>- 翻訳フォールバック方針の正常系と代表的な異常系が検証可能である<br>- 翻訳フォールバック方針の状態をMatrix上で追跡できる

### i18n.translation_review_flow

翻訳レビュー運用フロー

- 機能の意味: 翻訳更新のレビュー手順を標準化し、品質ばらつきを抑える機能。
- 目的: 国際化対応の観点で「翻訳レビュー運用フロー」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/PHASE4_TRACK_M.md。機能要件として翻訳レビュー運用フローの実装・検証・可視化を含む。
- 完了定義: 翻訳レビュー運用フローが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 翻訳レビュー運用フローに関する仕様が実装と整合している<br>- 翻訳レビュー運用フローの正常系と代表的な異常系が検証可能である<br>- 翻訳レビュー運用フローの状態をMatrix上で追跡できる

### mcp.tool_registration_coverage

MCPツール登録網羅性

- 機能の意味: MCPで公開する操作ツールを網羅し、AI側から必要操作が欠けない状態を維持する機能。
- 目的: MCP連携の観点で「MCPツール登録網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/tools。機能要件としてMCPツール登録網羅性の実装・検証・可視化を含む。
- 完了定義: MCPツール登録網羅性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- MCPツール登録網羅性に関する仕様が実装と整合している<br>- MCPツール登録網羅性の正常系と代表的な異常系が検証可能である<br>- MCPツール登録網羅性の状態をMatrix上で追跡できる

### mcp.entity_tool_quality

エンティティ操作ツール品質

- 機能の意味: エンティティ操作ツールの入出力契約を安定化し、安全な編集自動化を支える機能。
- 目的: MCP連携の観点で「エンティティ操作ツール品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/tools/entity-tools.ts。機能要件としてエンティティ操作ツール品質の実装・検証・可視化を含む。
- 完了定義: エンティティ操作ツール品質が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- エンティティ操作ツール品質に関する仕様が実装と整合している<br>- エンティティ操作ツール品質の正常系と代表的な異常系が検証可能である<br>- エンティティ操作ツール品質の状態をMatrix上で追跡できる

### mcp.storyboard_tool_quality

Storyboard操作ツール品質

- 機能の意味: Storyboard操作を構造破壊なく実行できるようにし、意図した編集結果を担保する機能。
- 目的: MCP連携の観点で「Storyboard操作ツール品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/tools/storyboard-tools.ts。機能要件としてStoryboard操作ツール品質の実装・検証・可視化を含む。
- 完了定義: Storyboard操作ツール品質が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Storyboard操作ツール品質に関する仕様が実装と整合している<br>- Storyboard操作ツール品質の正常系と代表的な異常系が検証可能である<br>- Storyboard操作ツール品質の状態をMatrix上で追跡できる

### mcp.undo_redo_tool_quality

Undo/Redoツール品質

- 機能の意味: AI経由操作でもUndo/Redo整合を保ち、試行的編集の安全性を確保する機能。
- 目的: MCP連携の観点で「Undo/Redoツール品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/tools/undo-redo-tools.ts。機能要件としてUndo/Redoツール品質の実装・検証・可視化を含む。
- 完了定義: Undo/Redoツール品質が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Undo/Redoツール品質に関する仕様が実装と整合している<br>- Undo/Redoツール品質の正常系と代表的な異常系が検証可能である<br>- Undo/Redoツール品質の状態をMatrix上で追跡できる

### mcp.safe_apply_flow

提案→確認→適用フロー

- 機能の意味: 提案→確認→適用の手順を挟み、誤適用による破壊的変更を防ぐガード機能。
- 目的: MCP連携の観点で「提案→確認→適用フロー」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/server。機能要件として提案→確認→適用フローの実装・検証・可視化を含む。
- 完了定義: 提案→確認→適用フローが required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 提案→確認→適用フローに関する仕様が実装と整合している<br>- 提案→確認→適用フローの正常系と代表的な異常系が検証可能である<br>- 提案→確認→適用フローの状態をMatrix上で追跡できる

### mcp.prompt_resource_quality

プロンプト/リソース品質

- 機能の意味: プロンプト/リソース定義を品質管理し、AI応答の再現性を高める機能。
- 目的: MCP連携の観点で「プロンプト/リソース品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/prompts。機能要件としてプロンプト/リソース品質の実装・検証・可視化を含む。
- 完了定義: プロンプト/リソース品質が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- プロンプト/リソース品質に関する仕様が実装と整合している<br>- プロンプト/リソース品質の正常系と代表的な異常系が検証可能である<br>- プロンプト/リソース品質の状態をMatrix上で追跡できる

### mcp.tool_error_contract

ツールエラー契約統一

- 機能の意味: ツール失敗時のエラー形式を統一し、クライアント側の復旧処理を単純化する機能。
- 目的: MCP連携の観点で「ツールエラー契約統一」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/utils。機能要件としてツールエラー契約統一の実装・検証・可視化を含む。
- 完了定義: ツールエラー契約統一が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- ツールエラー契約統一に関する仕様が実装と整合している<br>- ツールエラー契約統一の正常系と代表的な異常系が検証可能である<br>- ツールエラー契約統一の状態をMatrix上で追跡できる

### mcp.user_guidance_surface

利用者向け導線

- 機能の意味: 利用者にツールの前提と安全な使い方を提示し、誤用を減らす導線機能。
- 目的: MCP連携の観点で「利用者向け導線」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/mcp-server/src/server。機能要件として利用者向け導線の実装・検証・可視化を含む。
- 完了定義: 利用者向け導線が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 利用者向け導線に関する仕様が実装と整合している<br>- 利用者向け導線の正常系と代表的な異常系が検証可能である<br>- 利用者向け導線の状態をMatrix上で追跡できる

### opendrive.xodr_parser_coverage

XODRパーサー網羅性

- 機能の意味: OpenDRIVE記述を漏れなく内部モデルへ取り込み、道路データ入力の信頼性を確保する機能。
- 目的: OpenDRIVE処理の観点で「XODRパーサー網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/opendrive/src/parser/xodr-parser.ts。機能要件としてXODRパーサー網羅性の実装・検証・可視化を含む。
- 完了定義: XODRパーサー網羅性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- XODRパーサー網羅性に関する仕様が実装と整合している<br>- XODRパーサー網羅性の正常系と代表的な異常系が検証可能である<br>- XODRパーサー網羅性の状態をMatrix上で追跡できる

### opendrive.geometry_accuracy

幾何計算精度

- 機能の意味: 道路中心線・曲率・接線などの幾何計算誤差を抑え、位置解決の基礎精度を担保する機能。
- 目的: OpenDRIVE処理の観点で「幾何計算精度」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/opendrive/src/geometry。機能要件として幾何計算精度の実装・検証・可視化を含む。
- 完了定義: 幾何計算精度が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 幾何計算精度に関する仕様が実装と整合している<br>- 幾何計算精度の正常系と代表的な異常系が検証可能である<br>- 幾何計算精度の状態をMatrix上で追跡できる

### opendrive.mesh_generation_quality

道路メッシュ生成品質

- 機能の意味: 道路形状を破綻なくメッシュ化し、3D表示時の欠け・ねじれ・段差を防ぐ機能。
- 目的: OpenDRIVE処理の観点で「道路メッシュ生成品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/opendrive/src/mesh/road-mesh-generator.ts。機能要件として道路メッシュ生成品質の実装・検証・可視化を含む。
- 完了定義: 道路メッシュ生成品質が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 道路メッシュ生成品質に関する仕様が実装と整合している<br>- 道路メッシュ生成品質の正常系と代表的な異常系が検証可能である<br>- 道路メッシュ生成品質の状態をMatrix上で追跡できる

### opendrive.lane_boundary_consistency

車線境界計算整合性

- 機能の意味: 車線境界計算を一貫させ、隣接車線との接続不整合を防止する機能。
- 目的: OpenDRIVE処理の観点で「車線境界計算整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/opendrive/src/geometry/lane-boundary.ts。機能要件として車線境界計算整合性の実装・検証・可視化を含む。
- 完了定義: 車線境界計算整合性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 車線境界計算整合性に関する仕様が実装と整合している<br>- 車線境界計算整合性の正常系と代表的な異常系が検証可能である<br>- 車線境界計算整合性の状態をMatrix上で追跡できる

### opendrive.elevation_profile_support

標高プロファイル対応

- 機能の意味: 標高変化を正確に反映し、坂道や起伏のある道路を3D上で再現する機能。
- 目的: OpenDRIVE処理の観点で「標高プロファイル対応」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/opendrive/src/geometry/reference-line.ts。機能要件として標高プロファイル対応の実装・検証・可視化を含む。
- 完了定義: 標高プロファイル対応が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 標高プロファイル対応に関する仕様が実装と整合している<br>- 標高プロファイル対応の正常系と代表的な異常系が検証可能である<br>- 標高プロファイル対応の状態をMatrix上で追跡できる

### opendrive.large_map_optimization

大規模地図最適化

- 機能の意味: 大規模地図でも描画遅延やメモリ過多を抑え、実用的な操作速度を維持する機能。
- 目的: OpenDRIVE処理の観点で「大規模地図最適化」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/opendrive/src/mesh/road-mesh-generator.ts。機能要件として大規模地図最適化の実装・検証・可視化を含む。
- 完了定義: 大規模地図最適化が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 大規模地図最適化に関する仕様が実装と整合している<br>- 大規模地図最適化の正常系と代表的な異常系が検証可能である<br>- 大規模地図最適化の状態をMatrix上で追跡できる

### opendrive.roadmark_semantics

RoadMark意味解釈整備

- 機能の意味: 路面標示の種類・意味を保持して描画し、道路ルール理解に必要な情報を可視化する機能。
- 目的: OpenDRIVE処理の観点で「RoadMark意味解釈整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/opendrive/src/mesh/road-mark-mesh.ts。機能要件としてRoadMark意味解釈整備の実装・検証・可視化を含む。
- 完了定義: RoadMark意味解釈整備が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- RoadMark意味解釈整備に関する仕様が実装と整合している<br>- RoadMark意味解釈整備の正常系と代表的な異常系が検証可能である<br>- RoadMark意味解釈整備の状態をMatrix上で追跡できる

### opendrive.import_diagnostics

XODR読込診断メッセージ

- 機能の意味: XODR読込失敗時に原因位置と内容を提示し、修正判断を早める診断機能。
- 目的: OpenDRIVE処理の観点で「XODR読込診断メッセージ」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/services/scenario-service.ts。機能要件としてXODR読込診断メッセージの実装・検証・可視化を含む。
- 完了定義: XODR読込診断メッセージが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- XODR読込診断メッセージに関する仕様が実装と整合している<br>- XODR読込診断メッセージの正常系と代表的な異常系が検証可能である<br>- XODR読込診断メッセージの状態をMatrix上で追跡できる

### qa.unit_coverage_core

コアユニットテスト維持

- 機能の意味: コアロジックの単体回帰を継続監視し、基礎品質の劣化を早期検知する機能。
- 目的: テスト品質の観点で「コアユニットテスト維持」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/openscenario/src/__tests__。機能要件としてコアユニットテスト維持の実装・検証・可視化を含む。
- 完了定義: コアユニットテスト維持が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- コアユニットテスト維持に関する仕様が実装と整合している<br>- コアユニットテスト維持の正常系と代表的な異常系が検証可能である<br>- コアユニットテスト維持の状態をMatrix上で追跡できる

### qa.unit_coverage_viewer

3Dユニットテスト維持

- 機能の意味: 3D関連ロジックの単体回帰を継続検知し、描画品質劣化を防ぐ機能。
- 目的: テスト品質の観点で「3Dユニットテスト維持」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/3d-viewer/src/__tests__。機能要件として3Dユニットテスト維持の実装・検証・可視化を含む。
- 完了定義: 3Dユニットテスト維持が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 3Dユニットテスト維持に関する仕様が実装と整合している<br>- 3Dユニットテスト維持の正常系と代表的な異常系が検証可能である<br>- 3Dユニットテスト維持の状態をMatrix上で追跡できる

### qa.server_route_tests

サーバールートテスト整備

- 機能の意味: サーバールートの契約をテストで固定し、API退行を防ぐ機能。
- 目的: テスト品質の観点で「サーバールートテスト整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/__tests__/routes。機能要件としてサーバールートテスト整備の実装・検証・可視化を含む。
- 完了定義: サーバールートテスト整備が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- サーバールートテスト整備に関する仕様が実装と整合している<br>- サーバールートテスト整備の正常系と代表的な異常系が検証可能である<br>- サーバールートテスト整備の状態をMatrix上で追跡できる

### qa.playwright_smoke_pack

Playwrightスモークパック

- 機能の意味: 主要UI導線を短時間で検証し、PR段階で重大回帰を弾く機能。
- 目的: テスト品質の観点で「Playwrightスモークパック」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/PHASE4_TRACK_M.md。機能要件としてPlaywrightスモークパックの実装・検証・可視化を含む。
- 完了定義: Playwrightスモークパックが required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Playwrightスモークパックに関する仕様が実装と整合している<br>- Playwrightスモークパックの正常系と代表的な異常系が検証可能である<br>- Playwrightスモークパックの状態をMatrix上で追跡できる

### qa.playwright_full_regression

Playwrightフル回帰

- 機能の意味: 広範囲シナリオを夜間検証し、統合不具合の蓄積を防ぐ機能。
- 目的: テスト品質の観点で「Playwrightフル回帰」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/PHASE4_TRACK_M.md。機能要件としてPlaywrightフル回帰の実装・検証・可視化を含む。
- 完了定義: Playwrightフル回帰が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Playwrightフル回帰に関する仕様が実装と整合している<br>- Playwrightフル回帰の正常系と代表的な異常系が検証可能である<br>- Playwrightフル回帰の状態をMatrix上で追跡できる

### qa.artifact_retention

失敗時証跡保存（trace/video）

- 機能の意味: 失敗時証跡を保存し、再現調査と原因特定を高速化する機能。
- 目的: テスト品質の観点で「失敗時証跡保存（trace/video）」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/PHASE4_TRACK_M.md。機能要件として失敗時証跡保存（trace/video）の実装・検証・可視化を含む。
- 完了定義: 失敗時証跡保存（trace/video）が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 失敗時証跡保存（trace/video）に関する仕様が実装と整合している<br>- 失敗時証跡保存（trace/video）の正常系と代表的な異常系が検証可能である<br>- 失敗時証跡保存（trace/video）の状態をMatrix上で追跡できる

### qa.contract_tests_maturity

契約テスト整備

- 機能の意味: 境界契約テストを整備し、実装変更時の互換破壊を抑止する機能。
- 目的: テスト品質の観点で「契約テスト整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/__tests__/routes/scenario-routes.test.ts。機能要件として契約テスト整備の実装・検証・可視化を含む。
- 完了定義: 契約テスト整備が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 契約テスト整備に関する仕様が実装と整合している<br>- 契約テスト整備の正常系と代表的な異常系が検証可能である<br>- 契約テスト整備の状態をMatrix上で追跡できる

### qa.flaky_test_control

フレーキーテスト制御

- 機能の意味: 不安定テストを管理して信号品質を維持し、CI信頼性を保つ機能。
- 目的: テスト品質の観点で「フレーキーテスト制御」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/__tests__。機能要件としてフレーキーテスト制御の実装・検証・可視化を含む。
- 完了定義: フレーキーテスト制御が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- フレーキーテスト制御に関する仕様が実装と整合している<br>- フレーキーテスト制御の正常系と代表的な異常系が検証可能である<br>- フレーキーテスト制御の状態をMatrix上で追跡できる

### sim.service_switching

Mock/GT_Simサービス切替

- 機能の意味: Mockと実GT_Simを切替可能にし、開発検証と実運用検証を両立させる機能。
- 目的: シミュレーション連携の観点で「Mock/GT_Simサービス切替」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/app.ts。機能要件としてMock/GT_Simサービス切替の実装・検証・可視化を含む。
- 完了定義: Mock/GT_Simサービス切替が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Mock/GT_Simサービス切替に関する仕様が実装と整合している<br>- Mock/GT_Simサービス切替の正常系と代表的な異常系が検証可能である<br>- Mock/GT_Simサービス切替の状態をMatrix上で追跡できる

### sim.gtsim_default_runtime

GT_Sim標準実行経路

- 機能の意味: 実GT_Simを標準実行経路として扱い、本番相当の検証を常時可能にする機能。
- 目的: シミュレーション連携の観点で「GT_Sim標準実行経路」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/app.ts。機能要件としてGT_Sim標準実行経路の実装・検証・可視化を含む。
- 完了定義: GT_Sim標準実行経路が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- GT_Sim標準実行経路に関する仕様が実装と整合している<br>- GT_Sim標準実行経路の正常系と代表的な異常系が検証可能である<br>- GT_Sim標準実行経路の状態をMatrix上で追跡できる

### sim.ws_frame_streaming

WebSocketフレーム配信整備

- 機能の意味: フレームデータを遅延・欠落を抑えて配信し、再生系との同期を保つ機能。
- 目的: シミュレーション連携の観点で「WebSocketフレーム配信整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/websocket/ws-handler.ts。機能要件としてWebSocketフレーム配信整備の実装・検証・可視化を含む。
- 完了定義: WebSocketフレーム配信整備が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- WebSocketフレーム配信整備に関する仕様が実装と整合している<br>- WebSocketフレーム配信整備の正常系と代表的な異常系が検証可能である<br>- WebSocketフレーム配信整備の状態をMatrix上で追跡できる

### sim.playback_store_integrity

再生ストア整合性

- 機能の意味: 再生状態管理を一貫化し、再生・停止・シーク時の不整合を防ぐ機能。
- 目的: シミュレーション連携の観点で「再生ストア整合性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/stores/simulation-store.ts。機能要件として再生ストア整合性の実装・検証・可視化を含む。
- 完了定義: 再生ストア整合性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 再生ストア整合性に関する仕様が実装と整合している<br>- 再生ストア整合性の正常系と代表的な異常系が検証可能である<br>- 再生ストア整合性の状態をMatrix上で追跡できる

### sim.timeline_controls

タイムライン制御UI整備

- 機能の意味: 再生速度・シーク・開始停止を直感的に操作できるUI制御機能。
- 目的: シミュレーション連携の観点で「タイムライン制御UI整備」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/panels/SimulationTimeline.tsx。機能要件としてタイムライン制御UI整備の実装・検証・可視化を含む。
- 完了定義: タイムライン制御UI整備が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- タイムライン制御UI整備に関する仕様が実装と整合している<br>- タイムライン制御UI整備の正常系と代表的な異常系が検証可能である<br>- タイムライン制御UI整備の状態をMatrix上で追跡できる

### sim.error_surface_to_ui

シミュレーションエラー可視化

- 機能の意味: 実行時エラーをUIへ正規化して通知し、原因把握と回復判断を支援する機能。
- 目的: シミュレーション連携の観点で「シミュレーションエラー可視化」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/hooks/use-websocket.ts。機能要件としてシミュレーションエラー可視化の実装・検証・可視化を含む。
- 完了定義: シミュレーションエラー可視化が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- シミュレーションエラー可視化に関する仕様が実装と整合している<br>- シミュレーションエラー可視化の正常系と代表的な異常系が検証可能である<br>- シミュレーションエラー可視化の状態をMatrix上で追跡できる

### sim.session_lifecycle

セッションライフサイクル管理

- 機能の意味: シミュレーションセッションの開始から終了までを安全に管理するライフサイクル機能。
- 目的: シミュレーション連携の観点で「セッションライフサイクル管理」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/server/src/services/simulation-service.ts。機能要件としてセッションライフサイクル管理の実装・検証・可視化を含む。
- 完了定義: セッションライフサイクル管理が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- セッションライフサイクル管理に関する仕様が実装と整合している<br>- セッションライフサイクル管理の正常系と代表的な異常系が検証可能である<br>- セッションライフサイクル管理の状態をMatrix上で追跡できる

### sim.real_runtime_e2e

実GT_Sim連携E2E

- 機能の意味: 実ランタイム経路をE2Eで継続検証し、統合回帰を早期検知する機能。
- 目的: シミュレーション連携の観点で「実GT_Sim連携E2E」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は docs/PHASE4_TRACK_M.md。機能要件として実GT_Sim連携E2Eの実装・検証・可視化を含む。
- 完了定義: 実GT_Sim連携E2Eが required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 実GT_Sim連携E2Eに関する仕様が実装と整合している<br>- 実GT_Sim連携E2Eの正常系と代表的な異常系が検証可能である<br>- 実GT_Sim連携E2Eの状態をMatrix上で追跡できる

### templates.use_case_coverage

ユースケーステンプレート網羅性

- 機能の意味: 主要運転シナリオをテンプレート化し、初期作成の手間を大幅に削減する機能。
- 目的: テンプレート機能の観点で「ユースケーステンプレート網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/templates/src/use-cases。機能要件としてユースケーステンプレート網羅性の実装・検証・可視化を含む。
- 完了定義: ユースケーステンプレート網羅性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- ユースケーステンプレート網羅性に関する仕様が実装と整合している<br>- ユースケーステンプレート網羅性の正常系と代表的な異常系が検証可能である<br>- ユースケーステンプレート網羅性の状態をMatrix上で追跡できる

### templates.action_component_coverage

アクションコンポーネント網羅性

- 機能の意味: Action部品を再利用可能に揃え、細粒度編集を効率化する機能。
- 目的: テンプレート機能の観点で「アクションコンポーネント網羅性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/templates/src/action-components。機能要件としてアクションコンポーネント網羅性の実装・検証・可視化を含む。
- 完了定義: アクションコンポーネント網羅性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- アクションコンポーネント網羅性に関する仕様が実装と整合している<br>- アクションコンポーネント網羅性の正常系と代表的な異常系が検証可能である<br>- アクションコンポーネント網羅性の状態をMatrix上で追跡できる

### templates.parameter_validation

テンプレートパラメータ妥当性

- 機能の意味: 入力パラメータの妥当性を検査し、不正テンプレート適用を事前に防ぐ機能。
- 目的: テンプレート機能の観点で「テンプレートパラメータ妥当性」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/templates/src/helpers。機能要件としてテンプレートパラメータ妥当性の実装・検証・可視化を含む。
- 完了定義: テンプレートパラメータ妥当性が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- テンプレートパラメータ妥当性に関する仕様が実装と整合している<br>- テンプレートパラメータ妥当性の正常系と代表的な異常系が検証可能である<br>- テンプレートパラメータ妥当性の状態をMatrix上で追跡できる

### templates.localized_metadata

テンプレートメタデータ多言語化

- 機能の意味: テンプレート説明を多言語化し、言語差による選択ミスを減らす機能。
- 目的: テンプレート機能の観点で「テンプレートメタデータ多言語化」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/templates/src/metadata。機能要件としてテンプレートメタデータ多言語化の実装・検証・可視化を含む。
- 完了定義: テンプレートメタデータ多言語化が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- テンプレートメタデータ多言語化に関する仕様が実装と整合している<br>- テンプレートメタデータ多言語化の正常系と代表的な異常系が検証可能である<br>- テンプレートメタデータ多言語化の状態をMatrix上で追跡できる

### templates.preview_generation

テンプレート適用前プレビュー

- 機能の意味: 適用前に生成内容を確認できるようにし、期待外れ適用を防ぐ機能。
- 目的: テンプレート機能の観点で「テンプレート適用前プレビュー」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/template/ParameterDialog.tsx。機能要件としてテンプレート適用前プレビューの実装・検証・可視化を含む。
- 完了定義: テンプレート適用前プレビューが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- テンプレート適用前プレビューに関する仕様が実装と整合している<br>- テンプレート適用前プレビューの正常系と代表的な異常系が検証可能である<br>- テンプレート適用前プレビューの状態をMatrix上で追跡できる

### templates.apply_consistency

テンプレート適用整合

- 機能の意味: テンプレート適用結果を一貫化し、同条件で同結果を再現する機能。
- 目的: テンプレート機能の観点で「テンプレート適用整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/hooks/use-template-apply.ts。機能要件としてテンプレート適用整合の実装・検証・可視化を含む。
- 完了定義: テンプレート適用整合が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- テンプレート適用整合に関する仕様が実装と整合している<br>- テンプレート適用整合の正常系と代表的な異常系が検証可能である<br>- テンプレート適用整合の状態をMatrix上で追跡できる

### templates.quality_rank

テンプレート品質ランク付け

- 機能の意味: テンプレート品質を可視化し、採用優先度を判断しやすくする機能。
- 目的: テンプレート機能の観点で「テンプレート品質ランク付け」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/templates/src/metadata。機能要件としてテンプレート品質ランク付けの実装・検証・可視化を含む。
- 完了定義: テンプレート品質ランク付けが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- テンプレート品質ランク付けに関する仕様が実装と整合している<br>- テンプレート品質ランク付けの正常系と代表的な異常系が検証可能である<br>- テンプレート品質ランク付けの状態をMatrix上で追跡できる

### templates.catalog_alignment

カタログ参照整合

- 機能の意味: カタログ参照整合を維持し、実行時に参照切れが起きない状態を保つ機能。
- 目的: テンプレート機能の観点で「カタログ参照整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は packages/templates/src/helpers/actions.ts。機能要件としてカタログ参照整合の実装・検証・可視化を含む。
- 完了定義: カタログ参照整合が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- カタログ参照整合に関する仕様が実装と整合している<br>- カタログ参照整合の正常系と代表的な異常系が検証可能である<br>- カタログ参照整合の状態をMatrix上で追跡できる

### ux.layout_responsiveness

統合レイアウトのレスポンシブ品質

- 機能の意味: 画面サイズに応じて編集要素を破綻なく配置し、主要操作を常に継続可能にする機能。
- 目的: エディタUXの観点で「統合レイアウトのレスポンシブ品質」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/layout/EditorLayout.tsx。機能要件として統合レイアウトのレスポンシブ品質の実装・検証・可視化を含む。
- 完了定義: 統合レイアウトのレスポンシブ品質が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- 統合レイアウトのレスポンシブ品質に関する仕様が実装と整合している<br>- 統合レイアウトのレスポンシブ品質の正常系と代表的な異常系が検証可能である<br>- 統合レイアウトのレスポンシブ品質の状態をMatrix上で追跡できる

### ux.deep_property_editing

Event/Action/Triggerの詳細編集

- 機能の意味: 主要要素の詳細属性をUIから直接編集できるようにし、XML手編集依存を減らす機能。
- 目的: エディタUXの観点で「Event/Action/Triggerの詳細編集」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/property/PropertyEditor.tsx。機能要件としてEvent/Action/Triggerの詳細編集の実装・検証・可視化を含む。
- 完了定義: Event/Action/Triggerの詳細編集が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- Event/Action/Triggerの詳細編集に関する仕様が実装と整合している<br>- Event/Action/Triggerの詳細編集の正常系と代表的な異常系が検証可能である<br>- Event/Action/Triggerの詳細編集の状態をMatrix上で追跡できる

### ux.template_discovery

テンプレート検索・フィルタ

- 機能の意味: 必要なテンプレートへ素早く到達できる探索導線を提供し、作業開始コストを下げる機能。
- 目的: エディタUXの観点で「テンプレート検索・フィルタ」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/panels/TemplatePalettePanel.tsx。機能要件としてテンプレート検索・フィルタの実装・検証・可視化を含む。
- 完了定義: テンプレート検索・フィルタが required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- テンプレート検索・フィルタに関する仕様が実装と整合している<br>- テンプレート検索・フィルタの正常系と代表的な異常系が検証可能である<br>- テンプレート検索・フィルタの状態をMatrix上で追跡できる

### ux.validation_focus_navigation

バリデーションから該当要素への遷移

- 機能の意味: 検証結果から該当要素へ即座に移動できるようにし、修正ループを短縮する機能。
- 目的: エディタUXの観点で「バリデーションから該当要素への遷移」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/validation/ValidationIssueList.tsx。機能要件としてバリデーションから該当要素への遷移の実装・検証・可視化を含む。
- 完了定義: バリデーションから該当要素への遷移が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- バリデーションから該当要素への遷移に関する仕様が実装と整合している<br>- バリデーションから該当要素への遷移の正常系と代表的な異常系が検証可能である<br>- バリデーションから該当要素への遷移の状態をMatrix上で追跡できる

### ux.shortcut_consistency

キーボードショートカット整合

- 機能の意味: ショートカット挙動を文脈横断で統一し、操作ミスと学習コストを抑える機能。
- 目的: エディタUXの観点で「キーボードショートカット整合」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/hooks/use-keyboard-shortcuts.ts。機能要件としてキーボードショートカット整合の実装・検証・可視化を含む。
- 完了定義: キーボードショートカット整合が required_level=L2 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- キーボードショートカット整合に関する仕様が実装と整合している<br>- キーボードショートカット整合の正常系と代表的な異常系が検証可能である<br>- キーボードショートカット整合の状態をMatrix上で追跡できる

### ux.error_recovery_flow

エラー時の回復フロー

- 機能の意味: 失敗時に復旧手順を提示し、ユーザーが編集状態を維持したまま回復できる機能。
- 目的: エディタUXの観点で「エラー時の回復フロー」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/ErrorBoundary.tsx。機能要件としてエラー時の回復フローの実装・検証・可視化を含む。
- 完了定義: エラー時の回復フローが required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- エラー時の回復フローに関する仕様が実装と整合している<br>- エラー時の回復フローの正常系と代表的な異常系が検証可能である<br>- エラー時の回復フローの状態をMatrix上で追跡できる

### ux.selection_sync_feedback

ノード/3D/一覧の選択同期可視化

- 機能の意味: 一覧・ノード・3D間で選択状態を同期し、現在対象の認知負荷を下げる機能。
- 目的: エディタUXの観点で「ノード/3D/一覧の選択同期可視化」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/stores/editor-store.ts。機能要件としてノード/3D/一覧の選択同期可視化の実装・検証・可視化を含む。
- 完了定義: ノード/3D/一覧の選択同期可視化が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- ノード/3D/一覧の選択同期可視化に関する仕様が実装と整合している<br>- ノード/3D/一覧の選択同期可視化の正常系と代表的な異常系が検証可能である<br>- ノード/3D/一覧の選択同期可視化の状態をMatrix上で追跡できる

### ux.accessibility_baseline

アクセシビリティ基盤

- 機能の意味: キーボード操作や視認性要件を満たし、多様な利用条件で編集可能にする基盤機能。
- 目的: エディタUXの観点で「アクセシビリティ基盤」を実運用レベルまで明確化し、状態を継続監視できるようにする。
- 対象範囲: 主対象は apps/web/src/components/ui。機能要件としてアクセシビリティ基盤の実装・検証・可視化を含む。
- 完了定義: アクセシビリティ基盤が required_level=L3 を満たし、証跡と受け入れ条件がMatrixで追跡可能な状態。

検証手順:
- 実装証跡（evidence.impl）の最新性を確認する。<br>- テスト証跡（evidence.tests/e2e）で要件達成を確認する。<br>- matrixビュー上で effective_level と status が期待値であることを確認する。

受け入れ条件:
- アクセシビリティ基盤に関する仕様が実装と整合している<br>- アクセシビリティ基盤の正常系と代表的な異常系が検証可能である<br>- アクセシビリティ基盤の状態をMatrix上で追跡できる

