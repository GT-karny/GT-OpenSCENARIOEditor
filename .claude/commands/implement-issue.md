# Issue 実装フロー

引数: `$ARGUMENTS` (GitHub Issue 番号、例: `3`)

以下の手順で Issue を実装してください。各ステップの完了を TodoWrite で追跡すること。

---

## Step 1: Issue の読み込みと理解

```bash
gh issue view $ARGUMENTS --repo GT-karny/GT-OpenSCENARIOEditor
```

- Issue のタイトル、説明、受け入れ基準、技術メモを読み取る
- 不明点がある場合は AskUserQuestion で確認する

## Step 2: 関連コードの調査

- Issue の技術メモに記載されたファイルパスを中心に調査
- Explore エージェントを使って関連ファイルを特定
- 既存の実装パターンを理解する（同じディレクトリの類似コンポーネントを参考にする）
- `packages/shared/src/types/` の型定義を確認
- 影響範囲を把握する

## Step 3: 実装計画の作成

- EnterPlanMode を使って実装計画を作成する
- 変更するファイルの一覧
- 新規作成するファイルの一覧
- 実装順序（依存関係を考慮）
- ユーザーの承認を得てから次に進む

## Step 4: Worktree 作成と実装

- `issue-{番号}-{短い説明}` の名前で worktree を作成（例: `issue-3-apex-node-theme`）
- CLAUDE.md のコーディング規約に従って実装する
- 重要ルール:
  - `@osce/shared` は変更しない（型契約）
  - TypeScript strict, ESLint clean
  - 既存パターンに合わせる
  - 過剰設計しない

## Step 5: テスト

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- すべてのチェックが通ることを確認
- 必要に応じてテストを追加（vitest）
- エラーがあれば修正してから次へ

## Step 6: コミットと PR 作成

- 変更をコミット（コミットメッセージは `feat:`, `fix:` 等のConventional Commits 形式）
- PR を作成:
  - タイトル: Issue のタイトルに準じる
  - 本文: 変更内容のサマリー、テスト計画、`Closes #番号`
  - ラベル: Issue と同じラベルを付与
- PR の URL をユーザーに報告

## Step 7: Codex レビュー対応

- PR 作成後、Codex の自動レビューが来るのを待つ
- レビューコメントを確認:

```bash
gh pr checks {PR番号} --repo GT-karny/GT-OpenSCENARIOEditor
gh api repos/GT-karny/GT-OpenSCENARIOEditor/pulls/{PR番号}/reviews
gh api repos/GT-karny/GT-OpenSCENARIOEditor/pulls/{PR番号}/comments
```

- レビュー指摘がある場合:
  - 各指摘を AskUserQuestion でユーザーに見せ、対応要否を確認
  - 必要な修正を実施
  - 再コミット・プッシュ
- レビュー指摘がない、または対応完了したら、ユーザーに最終報告

---

## 完了条件

- [ ] すべての受け入れ基準が満たされている
- [ ] lint / typecheck / test / build がすべて通る
- [ ] PR が作成され、レビュー対応が完了している
- [ ] Issue に `Closes #番号` がリンクされている