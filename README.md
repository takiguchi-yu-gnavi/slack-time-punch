# Slack 出退勤打刻アプリ

TypeScriptで実装されたSlack連携出退勤打刻システムです。サーバー/クライアント分離構成で、将来的なTauriデスクトップアプリ化に対応しています。

## 🏗️ アーキテクチャ

### モノレポ構成（Server/Client分離）

```
packages/
├── shared/     # 共有型定義・ユーティリティ
├── lambda/     # AWS Lambda関数
├── cdk/        # AWS CDK構成
├── client/     # React.js フロントエンド (Vite)
└── tauri/      # Tauriデスクトップアプリケーション
```

- **完全分離**: サーバーとクライアントが独立
- **型安全性**: 共有型定義で一貫性を保証
- **Tauri対応**: クライアントアプリのデスクトップ化準備完了
- **環境変数管理**: 完全なURLベースの設定で簡素化

## 🚀 機能

- **⏰ 出退勤打刻**: ワンクリックで出勤・退勤メッセージを投稿
- **⚙️ メッセージカスタマイズ**: 出退勤時のメッセージを自由に設定可能
- **🔐 OAuth 2.0認証**: Slackの公式OAuth 2.0フローを実装
- **📋 チャンネル選択**: 参加しているチャンネルから投稿先を選択
- **🛡️ セキュリティ**: CSRF攻撃対策のためのstateパラメータ検証
- **👤 ユーザープロフィール表示**: 認証後にSlackユーザー名・プロフィール画像を表示
- **⏳ トークン有効期限管理**: トークンの有効期限表示と期限切れ警告
- **🎨 モダンUI**: レスポンシブでユーザーフレンドリーなインターフェース（Vite + React）
- **📝 TypeScript**: 型安全性とコード品質の確保
- **🐳 Docker対応**: Dockerコンテナでの簡単デプロイ
- **🔧 環境変数管理**: 完全なURLベースの設定で開発・本番環境の切り替えが簡単

## 📋 前提条件

- Node.js (v18以上推奨)
- npm または yarn
- Slackアプリの作成とクライアント情報
- Docker（オプション：コンテナ実行時）

## 🛠️ セットアップ

### 1. Slackアプリの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
2. "Create New App" → "From scratch"を選択
3. アプリ名とワークスペースを指定
4. "OAuth & Permissions"セクションで以下を設定：
   - **Redirect URLs**: `http://localhost:3000/auth/slack/callback`
   - **Scopes**: 必要に応じて以下のスコープを追加
     - `commands`
     - `incoming-webhook`
     - `chat:write`

### 2. 環境変数の設定

`.env`ファイルを作成し、Slackアプリの情報を設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
# Slack OAuth App環境変数
SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/slack/callback
SLACK_SCOPES=channels:read,groups:read
SLACK_USER_SCOPES=identify,channels:read,groups:read,chat:write

# URL設定（開発環境）
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000

# クライアント側用（VITEプレフィックス必須）
VITE_SERVER_URL=http://localhost:3000
```

**環境変数の説明**:

- **完全URL設定**: `CLIENT_URL`、`SERVER_URL`、`VITE_SERVER_URL`で簡単設定
- **本番環境**: これらのURLを本番サーバーのURLに変更するだけ
- **Docker**: コンテナ実行時は自動的にDocker用設定が適用

### 3. 依存関係のインストール

```bash
npm install
```

### 4. アプリケーション起動

#### 🔥 開発モード（推奨）

```bash
# サーバー・クライアント同時起動
npm run dev
```

#### 🚀 個別起動

```bash
# サーバーのみ（API: http://localhost:3000）
npm run dev:server

# クライアントのみ（UI: http://localhost:5173）
npm run dev:client
```

#### 🐳 Docker実行

```bash
# Dockerサーバー起動
npm run docker:server:up

# ログ確認
npm run docker:server:logs

# 停止
npm run docker:server:down
```

#### 📦 本番ビルド

```bash
# 全体ビルド
npm run build

# 個別ビルド
npm run build:server
npm run build:client

# 本番起動
npm run start:server
```

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境設定

```bash
cp .env.example .env
# .envファイルを編集してSlackアプリ情報を設定
```

### 3. アプリケーション起動

#### 開発モード（推奨）

```bash
# サーバー・クライアント同時起動
npm run dev
```

#### Docker実行

```bash
# Dockerサーバー起動
npm run docker:server:up
```

### 4. アクセス

- **フロントエンド**: http://localhost:5173
- **API サーバー**: http://localhost:3000
- **Slack認証**: http://localhost:3000/auth/slack

## 📡 API エンドポイント

### 認証関連

- **GET `/`**: メインページ（認証UI）
- **GET `/auth/slack`**: OAuth認証開始
- **GET `/auth/slack/callback`**: OAuth認証コールバック
- **GET `/auth/status`**: 認証状態確認
- **GET `/health`**: ヘルスチェック

### Slack API連携

- **GET `/auth/channels?token=<user_token>`**: チャンネル一覧取得
- **POST `/auth/post-message`**: 個人ユーザーとしてメッセージ投稿
- **GET `/auth/user-info?token=<user_token>`**: ユーザー情報・トークン有効期限取得
- **GET `/auth/token-rotation-status`**: Token Rotation設定状況確認

### トークン有効期限機能

このアプリは2種類のSlackトークンに対応しています：

#### 1. 永続的なトークン（デフォルト）

- **有効期限なし**: Token Rotationが無効な場合
- **表示**: 「♾️ 永続的なトークン」として表示
- **利点**: 実装がシンプル、更新処理不要

#### 2. 有効期限付きトークン（Token Rotation有効時）

- **有効期限**: 12時間（Token Rotation有効時）
- **表示**: 残り時間と有効期限日時を表示
- **警告**: 24時間以内、1時間以内で段階的に警告表示

**Token Rotationの有効化方法**:

1. [Slack API Apps](https://api.slack.com/apps) → 対象アプリ選択
2. OAuth & Permissions → Token Rotation を有効化
3. 注意: 一度有効にすると無効化できません

詳細は `SLACK_TOKEN_EXPIRATION.md` を参照してください。

### ✅ **有効期限なしトークンの継続利用**

**はい、有効期限なしのトークンは継続して使用できます。**

#### 永続利用の条件

- **デフォルト動作**: Token Rotationを有効にしない限り、Slackトークンは無期限
- **継続使用**: アプリの削除や手動取り消しまで有効
- **メンテナンスフリー**: 定期更新やrefresh token管理が不要

#### トークンが無効になる場合

1. **ユーザーがアプリを削除** (Slack設定で手動削除)
2. **ワークスペース管理者がアプリを削除**
3. **認証ユーザーのアカウント無効化**
4. **開発者が明示的に取り消し** (`auth.revoke` API)

#### 使い分けの指針

- **個人・小規模利用**: 有効期限なしトークンで十分
- **エンタープライズ**: セキュリティ要件に応じてToken Rotation検討
- **商用アプリ**: Token Rotationの採用を推奨

現在の設定状況は `/auth/token-rotation-status` で確認できます。

### OAuth フロー

1. **認証開始**: ユーザーが `/auth/slack` にアクセス
2. **Slack認証**: Slackの認証ページにリダイレクト
3. **コールバック**: 認証後 `/auth/slack/callback` に戻る
4. **トークン取得**: 認証コードをアクセストークンに交換

## 📱 使用方法

### 基本的な使い方

1. **認証**: 「Slackで認証する」ボタンをクリック
2. **チャンネル選択**: 出退勤メッセージを投稿したいチャンネルを選択
3. **打刻**: 「🟢 出勤」または「🔴 退勤」ボタンをクリック

### メッセージカスタマイズ

1. **設定画面**: 「⚙️ メッセージ設定」ボタンをクリック
2. **メッセージ編集**: 出勤・退勤メッセージを自由に変更
3. **保存**: 「設定を保存」ボタンで設定を保存
4. **リセット**: 「デフォルトに戻す」ボタンでデフォルトメッセージに復元

**デフォルトメッセージ**:

- 出勤: 「業務を開始します」
- 退勤: 「業務を終了します」

**カスタマイズ例**:

- 出勤: 「おはようございます！今日も頑張ります💪」
- 退勤: 「お疲れ様でした！本日の業務を終了します🏠」

設定はブラウザのローカルストレージに保存され、次回アクセス時も維持されます。

## 🔒 セキュリティ機能

- **State Parameter**: CSRF攻撃対策
- **HTTPS Redirect**: 本番環境でのセキュア通信
- **Token Management**: アクセストークンの安全な管理
- **Error Handling**: 適切なエラーハンドリング

## 🎨 使用技術

### Backend (Server)

- **Runtime**: Node.js, TypeScript
- **Framework**: Express.js
- **HTTP Client**: Axios
- **CORS**: cors
- **Environment**: dotenv
- **Development**: ts-node-dev

### Frontend (Client)

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI**: CSS Modules
- **Future Ready**: Tauri対応準備完了

### Shared

- **Types**: TypeScript型定義の共有
- **Utils**: 共通ユーティリティ関数
- **Constants**: API エンドポイント定数

### DevOps

- **Containerization**: Docker, Docker Compose
- **Development**: Concurrently（並行実行）
- **Monorepo**: npm workspaces

## 📚 プロジェクト構成

```
.
├── packages/
│   ├── shared/                    # 共有ライブラリ
│   │   ├── src/
│   │   │   ├── index.ts          # 共有関数・設定
│   │   │   └── types.ts          # 共有型定義
│   │   └── package.json
│   ├── server/                    # Express.js APIサーバー
│   │   ├── src/
│   │   │   ├── server.ts         # メインサーバーファイル
│   │   │   ├── routes/
│   │   │   │   └── auth.ts       # 認証ルート
│   │   │   ├── services/
│   │   │   │   └── slackAuth.ts  # Slack認証サービス
│   │   │   └── utils/
│   │   │       └── stateManager.ts # セキュリティ状態管理
│   │   └── package.json
│   └── client/                    # React.js フロントエンド
│       ├── src/
│       │   ├── main.tsx          # エントリーポイント
│       │   ├── App.tsx           # メインアプリ
│       │   ├── config/
│       │   │   └── index.ts      # 設定管理
│       │   ├── components/       # Reactコンポーネント
│       │   ├── hooks/            # カスタムフック
│       │   ├── styles/           # CSS Modules
│       │   └── types/            # フロントエンド型定義
│       ├── public/
│       ├── vite.config.ts        # Vite設定
│       └── package.json
├── docs/                          # ドキュメント
│   ├── ARCHITECTURE.md           # アーキテクチャ詳細
│   ├── DOCKER.md                 # Docker実行手順
│   ├── SLACK_SETUP.md            # Slack設定手順
│   ├── SLACK_TOKEN_EXPIRATION.md # トークン期限管理
│   └── TROUBLESHOOTING.md        # トラブルシューティング
├── .env                          # 環境変数（local）
├── .env.example                  # 環境変数テンプレート
├── docker-compose.server.yml     # Dockerサーバー設定
├── Dockerfile.server             # Dockerイメージ設定
└── package.json                  # ワークスペース設定
```

## 🔧 開発

### 利用可能なスクリプト

#### ワークスペース全体

- `npm run dev`: サーバー・クライアント同時起動（開発モード）
- `npm run build`: 全体ビルド
- `npm run clean`: 全体クリーンアップ
- `npm run debug`: デバッグモード（クライアントの起動を遅延）

#### サーバー関連

- `npm run dev:server`: サーバーのみ開発モード
- `npm run build:server`: サーバーのみビルド
- `npm run start:server`: サーバーのみ本番起動

#### クライアント関連

- `npm run dev:client`: クライアントのみ開発モード
- `npm run build:client`: クライアントのみビルド
- `npm run start:client`: クライアントのみプレビュー

#### Docker関連

- `npm run docker:server:build`: Dockerイメージビルド
- `npm run docker:server:up`: Dockerサーバー起動
- `npm run docker:server:down`: Dockerサーバー停止

#### コード品質管理

- `npm run lint`: 全パッケージのESLintチェック
- `npm run lint:fix`: 全パッケージのESLint自動修正
- `npm run format`: 全パッケージのPrettierフォーマット
- `npm run format:check`: 全パッケージのPrettierフォーマットチェック

**個別パッケージでの実行例:**

```bash
# CDKパッケージのリント
cd packages/cdk && npm run lint

# Tauriパッケージのフォーマット
cd packages/tauri && npm run format
```

> 📖 詳細は [LINTING_AND_FORMATTING.md](./LINTING_AND_FORMATTING.md) を参照してください。

### 環境変数詳細

| 変数名              | 説明                                            | デフォルト                                    | 必須 |
| ------------------- | ----------------------------------------------- | --------------------------------------------- | ---- |
| **Slack OAuth設定** |
| SLACK_CLIENT_ID     | SlackアプリのClient ID                          | -                                             | ✅   |
| SLACK_CLIENT_SECRET | SlackアプリのClient Secret                      | -                                             | ✅   |
| REDIRECT_URI        | OAuth認証後のリダイレクトURL                    | http://localhost:3000/auth/slack/callback     | ✅   |
| SLACK_SCOPES        | Slackで要求するボットスコープ（カンマ区切り）   | channels:read,groups:read                     | ✅   |
| SLACK_USER_SCOPES   | Slackで要求するユーザースコープ（カンマ区切り） | identify,channels:read,groups:read,chat:write | ✅   |
| **URL設定**         |
| CLIENT_URL          | クライアントアプリのベースURL                   | http://localhost:5173                         | -    |
| SERVER_URL          | サーバーAPIのベースURL                          | http://localhost:3000                         | -    |
| VITE_SERVER_URL     | クライアント側でサーバーにアクセスするURL       | http://localhost:3000                         | -    |
| **実行環境**        |
| NODE_ENV            | 実行環境                                        | development                                   | -    |
| PORT                | サーバーポート（Docker用）                      | 3000                                          | -    |

**URL設定の特徴**:

- **完全URL**: ホスト・ポートを個別設定する必要がない
- **環境切り替え**: 開発・本番でURLを変更するだけ
- **Docker対応**: コンテナ実行時は自動的に適切な設定が適用

## ⚠️ 注意事項

1. **本番環境では必ずHTTPS**を使用してください
2. **Client Secret**は絶対に公開しないでください
3. **適切なスコープ**のみを要求してください
4. **アクセストークン**は安全に保存してください

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトはISCライセンスの下で公開されています。

## 🆘 サポート

問題が発生した場合は、以下のドキュメントをご確認ください：

### 📖 ドキュメント

- **`docs/SLACK_SETUP.md`**: Slackアプリの詳細な設定手順
- **`docs/DOCKER.md`**: Docker実行の詳細手順
- **`docs/TROUBLESHOOTING.md`**: 一般的な問題と解決方法
- **`docs/ARCHITECTURE.md`**: システムアーキテクチャの詳細
- **`docs/SLACK_TOKEN_EXPIRATION.md`**: トークン有効期限管理の詳細

### ✅ 基本チェックリスト

1. **Slackアプリの設定が正しいか**
2. **環境変数が正しく設定されているか**（`.env`ファイル）
3. **リダイレクトURLが一致しているか**
4. **必要なスコープが設定されているか**
5. **サーバーとクライアントが両方起動しているか**

### 🔍 デバッグ方法

```bash
# ヘルスチェック
curl http://localhost:3000/health

# サーバーログ確認（Docker）
npm run docker:server:logs

# 個別起動でエラー確認
npm run dev:server  # 別ターミナルで
npm run dev:client  # 別ターミナルで
```

### 🌐 外部リソース

- [Slack API Documentation](https://api.slack.com/authentication/oauth-v2)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
