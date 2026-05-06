---
visibility: internal
---
# garoon-mcp-server — Garoon MCP サーバー（Cybozu 公式の利用）

## これは何？

Cybozu 公式の **Garoon MCP（Model Context Protocol）サーバー** `@garoon/mcp-server` v1.2.0 を
ローカルクローンし、dotfiles harness から Claude Code が Garoon（社内グループウェア）を
操作できるようにするためのリポジトリ。

主に Garoon REST API を MCP Tools / Resources / Prompts として公開し、
Schedule（スケジュール）・Workflow・E-mail・Messages・Space・Bulletin Board・MultiReport・
Portal・Cabinet・Presence indicators 等にアクセスできる。

**注意**: 本リポジトリは Cybozu 公式の clone（forked）であり、自分で書いたコードではない。
`docs/specs/` は Cybozu 由来の仕様ではなく、**自分の運用に固有な部分（環境変数・接続情報・dotfiles 連携）** を記録する。

## なぜあるの？

- Garoon は社内の主要グループウェアで、メール・スケジュール・掲示板・ワークフローを集約
- Claude Code から Garoon の予定取得・メール検索・掲示板読取を MCP で行えれば、業務統合が一気に進む
- 自前で Garoon API クライアントを書くより、Cybozu 公式 MCP サーバーを使う方が保守コストが圧倒的に低い
- 日次ブリーフィング・経営会議準備で「Garoon に何が来てるか」を Claude Code から横断検索したい
- sansan-garoon-sync（Playwright で Garoon 投稿）は書込み主体だが、本 MCP は読取主体で役割分担

## どう動いてるの？

```
Claude Code session
        │
        ▼  (MCP stdio)
garoon-mcp-server (Node.js / Docker / mise)
        │
        ▼  (HTTPS, X-Cybozu-Authorization Basic auth)
Garoon REST API (GAROON_BASE_URL)
        │
        ▼
Garoon インスタンス（社内）
```

- **Stack**: Node.js + TypeScript + pnpm + Vitest + Docker
- **MCP コンポーネント**:
  - **Tools** (`src/tools/`) — Active operations（取得・更新・送信等）
  - **Resources** (`src/resources/`) — 読取専用データ
  - **Prompts** (`src/prompts/`) — テンプレート化されたプロンプト
- **Auth**:
  - Basic Authentication（`X-Cybozu-Authorization` ヘッダ）
  - 必要に応じてサイト全体 Basic 認証も対応（`GAROON_BASIC_AUTH_*`）
  - クライアント証明書（PFX）対応（`GAROON_PFX_FILE_*`）
  - HTTPS proxy 対応（`https_proxy` / `http_proxy`）

## 壊れたらどうする？

| 症状 | 対応 |
|------|------|
| MCP に接続できない | `pnpm install` → `pnpm build` → `pnpm start` でローカル起動。`.env.local` の Garoon 接続情報を確認 |
| 401 / 403 エラー | `GAROON_USERNAME` / `GAROON_PASSWORD` が正しいか、対象 Garoon に有効なアカウントか確認 |
| Cybozu 公式が新バージョンリリース | `git remote -v` で upstream 確認、`git pull upstream main` で同期。自分のカスタマイズがあれば conflict 解消 |
| Docker で動かない | `scripts/build-docker.sh` で再ビルド、env 変数を `-e` で渡しているか確認 |
| 特定 Garoon インスタンスで動かない | プロキシ・PFX クライアント証明書設定が必要かを社内ネットワークチームに確認 |

**Rollback**: `git checkout v1.2.0`（Cybozu 公式タグに戻す）。

## 止めたらどうなる？

- **即時影響**: Claude Code から Garoon 読取ができなくなる → 手動で Garoon Web を開いて確認
- **中期影響**: ブリーフィング・経営会議準備で Garoon 情報の取込手間が増える
- **退職時影響**: 後任が必要なら同じく Cybozu 公式から clone すれば再構築可能（自前実装ではないため）

## 必要なアカウント・権限

| Resource | 設定 |
|----------|------|
| Garoon URL | `GAROON_BASE_URL`（社内インスタンス URL） |
| Garoon User | `GAROON_USERNAME` / `GAROON_PASSWORD` |
| Basic Auth (任意) | `GAROON_BASIC_AUTH_USERNAME` / `GAROON_BASIC_AUTH_PASSWORD` |
| PFX 証明書 (任意) | `GAROON_PFX_FILE_PATH` / `GAROON_PFX_FILE_PASSWORD` |
| Proxy (任意) | `https_proxy` / `http_proxy` |
| `GAROON_PUBLIC_ONLY` | 公開情報のみに制限（任意） |

`.env.local` または Docker `-e` 経由。**機密情報は git に含めない**。1Password か macOS Keychain 推奨。

## 関連する人・部署

| 関係者 | 関与 |
|--------|------|
| Cybozu（公式 upstream） | コードの維持。バグ報告は GitHub に |
| 情シス | Garoon インスタンス管理者、Basic 認証・proxy 設定の relay |
| DX推進統括（志柿） | 自分のセッション運用に組み込む owner |

## 技術メモ（わかる人向け）

- **Repository**: Cybozu 公式 `https://github.com/garoon/garoon-mcp-server`
- **License**: Apache-2.0
- **Build & Run**:
  - `pnpm install` / `pnpm build`
  - `pnpm dev`（MCP Inspector でデバッグ）
  - `pnpm start`（MCP server 起動）
  - `pnpm test` / `pnpm test:coverage` / `pnpm test:watch`
  - Docker: `scripts/build-docker.sh` でイメージビルド、`.vscode/mcp.json` 経由で起動
- **Files (主要)**:
  - `src/index.ts` — MCP server 初期化＋全コンポーネント登録
  - `src/client.ts` — Garoon API HTTP クライアント
  - `src/*/register.ts` — feature 登録 + error handling wrapper
  - `src/schemas/` — Zod schemas（schedule events / users）
- **REST API only**: SOAP API（legacy）は使用しない
- **テスト戦略**: Vitest, `vi.mock()` でクライアント mock
- **dotfiles 連携**: `~/dotfiles/claude-config/` 側で MCP として登録（`.vscode/mcp.json` または `~/.claude/mcp_servers/`）
- **upstream 同期**: 自分のカスタマイズがある場合は branch 分けて管理。基本的には公式版そのまま使う方針
- **次の運用課題**: Garoon バージョン依存の API 互換性、proxy 環境での挙動確認、社内 PFX 証明書の更新サイクル
