# Maturity運用ガイド

## 目的

Capability Checklistを機能要件単位で管理し、実装・テスト・運用証跡の有無を日次で可視化する。

## ディレクトリ構成

- `docs/maturity/capabilities/*.json`
  - ドメイン分割のCapability定義（Source of Truth）
- `docs/maturity/schema/capability.schema.json`
  - 項目定義・制約の基準
- `docs/maturity/matrix.md`
  - 人間向けダッシュボード（生成物）
- `docs/maturity/matrix.json`
  - 機械可読ダッシュボード（生成物）
- `docs/maturity/GOVERNANCE.md`
  - 運用責務・レビュー手順
- `scripts/maturity/validate-capabilities.mjs`
  - 定義検証
- `scripts/maturity/generate-matrix.mjs`
  - Matrix生成

## 実行コマンド

```bash
pnpm maturity:validate
pnpm maturity:matrix
pnpm maturity:view
```

`pnpm maturity:view` 実行後に `http://localhost:4173/` へアクセスすると、  
`matrix.json` を読み込む簡易ビュワーを確認できる。

- 一覧テーブルの行をクリックすると、右側にCapability詳細（目的・対象範囲・完了定義・検証手順・証跡）が表示される。

## 定義ルール（必須）

- 1 capability = 1検証可能要件
- `id` は英語固定、表示項目は日本語（`title_ja`, `meaning_ja`, `acceptance_criteria_ja`, `gaps_ja`）
- `target_date` は全件必須
- `current_level >= L2` の場合は `evidence.impl` と `evidence.tests` が必須
- `evidence.impl` は全件で最低1件必須

## レベル定義

- `L0`: 未着手
- `L1`: 実装の着手はあるが検証証跡が不足
- `L2`: 実装 + テスト証跡あり
- `L3`: 統合/E2E相当まで検証済み
- `L4`: 運用監視で安定運用

## 生成時の補正ルール

- `current_level >= L2` でも `tests` が空の場合、`effective_level` は `L1` へ補正
- `status=done` でも証跡不足またはレベル不足の場合、`effective_status` は `partial` 表示

## 更新フロー

1. 対象ドメインのJSONを更新
2. `pnpm maturity:validate` を実行
3. `pnpm maturity:matrix` を実行
4. 必要に応じて `pnpm maturity:view` で表示を確認する
5. 生成差分（`matrix.md`, `matrix.json`）を確認してPRに含める
