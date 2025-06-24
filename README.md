# Slack 出退勤打刻アプリ

TypeScriptで実装されたSlack連携出退勤打刻システムです。このアプリケーションを使用して、Slackチャンネルに出退勤メッセージを簡単に投稿できます。

## 🚀 機能

- **⏰ 出退勤打刻**: ワンクリックで出勤・退勤メッセージを投稿
- **⚙️ メッセージカスタマイズ**: 出退勤時のメッセージを自由に設定可能
- **OAuth 2.0認証**: Slackの公式OAuth 2.0フローを実装
- **チャンネル選択**: 参加しているチャンネルから投稿先を選択
- **セキュリティ**: CSRF攻撃対策のためのstateパラメータ検証
- **モダンUI**: レスポンシブでユーザーフレンドリーなインターフェース
- **TypeScript**: 型安全性とコード品質の確保

## 📋 前提条件

- Node.js (v18以上推奨)
- npm または yarn
- Slackアプリの作成とクライアント情報

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

\`.env\`ファイルを編集：

```env
SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/slack/callback
PORT=3000
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. ビルドと実行

```bash
# 開発モード
npm run dev

# 本番ビルド
npm run build
npm start
```

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
- **GET `/auth/user-info?token=<user_token>`**: ユーザー情報取得

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

- **Backend**: TypeScript, Express.js, Node.js
- **HTTP Client**: Axios
- **Environment**: dotenv
- **Development**: ts-node-dev

## 📚 主要ファイル構成

```
src/
├── server.ts              # メインサーバーファイル
├── routes/
│   └── auth.ts           # 認証ルート
├── services/
│   └── slackAuth.ts      # Slack認証サービス
├── utils/
│   └── stateManager.ts   # セキュリティ状態管理
└── types/
    └── slack.ts          # Slack型定義

public/
└── index.html            # フロントエンドUI
```

## 🔧 開発

### スクリプト

- `npm run dev`: 開発モード（ホットリロード）
- `npm run build`: TypeScriptビルド
- `npm start`: 本番モード起動
- `npm run clean`: ビルドファイル削除

### 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| SLACK_CLIENT_ID | SlackアプリのClient ID | - |
| SLACK_CLIENT_SECRET | SlackアプリのClient Secret | - |
| REDIRECT_URI | OAuth認証後のリダイレクトURL | http://localhost:3000/auth/slack/callback |
| SLACK_SCOPES | Slackで要求するボットスコープ（カンマ区切り） | commands,incoming-webhook,chat:write |
| SLACK_USER_SCOPES | Slackで要求するユーザースコープ（カンマ区切り） | channels:read,chat:write,identify |
| PORT | サーバーポート | 3000 |
| NODE_ENV | 実行環境 | development |

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

問題が発生した場合は、以下をご確認ください：

1. Slackアプリの設定が正しいか
2. 環境変数が正しく設定されているか
3. リダイレクトURLが一致しているか
4. 必要なスコープが設定されているか

より詳細なヘルプについては、[Slack API Documentation](https://api.slack.com/authentication/oauth-v2)を参照してください。
