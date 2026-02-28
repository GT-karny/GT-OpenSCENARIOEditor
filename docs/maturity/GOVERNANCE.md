# Capability Checklist ガバナンス

## スコープ

本ドキュメントは以下ドメインのCapability管理を対象とする。

- `core`, `opendrive`, `ux`, `3d`, `sim`, `backend`, `mcp`, `templates`, `i18n`, `qa`, `devops`

## 役割

- `Domain Owner`
  - 担当ドメインのCapability更新責任を持つ
  - 期限超過・証跡不足を週次で解消計画に反映する
- `Review Owner`
  - 定義品質（粒度・重複・受け入れ条件）をレビューする
- `Maintainer`
  - スキーマ・生成スクリプト・運用ルールを維持する

## レビューサイクル

### 日次（短時間）

- 新規/変更Capabilityの妥当性確認
- 期限切れ項目の抽出
- `effective_level` 補正が発生した項目の確認

### 週次（定例）

- ドメイン別の `gap/partial/done` 推移確認
- 期限再設定またはスコープ調整
- 重複Capability統合、不要項目廃止

## 受け入れ基準（DoD）

`status=done` とするには以下を満たすこと。

1. `required_level` 以上の `current_level`（補正後 `effective_level` で判定）
2. `evidence.impl` と `evidence.tests` が要件に応じて揃っている
3. `acceptance_criteria_ja` を満たす根拠が提示できる

## 命名規則

- `id`: `<domain>.<capability_key>`
  - 例: `core.unknown_element_tolerance`
- `capability_key`: 英小文字 + 数字 + `_` のみ
- 表示文言: 日本語（簡潔、検証可能表現）

## 品質ルール

- 1 capability は1つの機能要件に限定する
- 実装タスク単位へ分解しすぎない
- 運用要件（監視・通知・復旧）を別capabilityとして独立管理する

## 将来拡張（CI連携）

初回はローカル運用を優先し、次フェーズでCIへ移行する。

- PR: `maturity:validate` と `maturity:matrix` の実行必須
- Nightly: `matrix.json` を公開しトレンド計測
