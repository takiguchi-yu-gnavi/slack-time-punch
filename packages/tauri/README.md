# Slack 出退勤打刻アプリ (Desktop)

Tauriを使用したSlackと連携する出退勤打刻のデスクトップアプリケーションです。

## 機能

- 🕘 **出勤打刻**: ワンクリックで出勤時間を記録
- 🏠 **退勤打刻**: 簡単操作で退勤時間を記録
- 📊 **履歴管理**: 出退勤履歴をSlackで確認
- 🖥️ **デスクトップアプリ**: ネイティブアプリで快適操作
- 🔐 **Slack認証**: Slack OAuth 2.0による安全な認証
- 📢 **チャンネル選択**: 投稿先チャンネルを自由に選択

## 技術スタック

- **Frontend**: React + TypeScript + Vite
- **Desktop**: Tauri (Rust)
- **スタイル**: CSS Modules
- **認証**: Slack OAuth 2.0
- **共通ライブラリ**: @slack-time-punch/shared

## セットアップ

### 前提条件

- Node.js (v18以上)
- Rust (最新安定版)
- macOS/Windows/Linux

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd slack-time-punch

# 依存関係のインストール
npm install

# Tauriアプリケーションディレクトリに移動
cd packages/tauri

# 追加の依存関係をインストール
npm install
```

### 開発サーバー起動

```bash
# 開発モードでアプリケーションを起動
npm run tauri:dev
```

### ビルド

```bash
# 本番用ビルド
npm run tauri:build
```

## ディレクトリ構成

```
packages/tauri/
├── src/                    # Reactアプリケーションソース
│   ├── components/         # Reactコンポーネント
│   │   ├── TauriSlackApp.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── UserProfile.tsx
│   │   ├── TokenExpiryInfo.tsx
│   │   ├── ChannelSelector.tsx
│   │   └── TimePunchButtons.tsx
│   ├── hooks/              # カスタムフック
│   │   ├── useCurrentTime.ts
│   │   ├── useSlackAuth.ts
│   │   ├── useSlackChannels.ts
│   │   └── useTimePunch.ts
│   ├── styles/             # CSS Modules
│   │   ├── index.css
│   │   ├── App.module.css
│   │   └── *.module.css
│   ├── types/              # 型定義
│   │   ├── index.ts
│   │   └── css.d.ts
│   ├── config/             # 設定
│   │   └── index.ts
│   ├── App.tsx             # メインコンポーネント
│   └── main.tsx            # エントリーポイント
├── src-tauri/              # Tauriバックエンド (Rust)
│   ├── src/
│   │   └── main.rs
│   ├── tauri.conf.json     # Tauri設定
│   └── Cargo.toml          # Rust依存関係
├── public/                 # 静的アセット
├── index.html              # HTMLテンプレート
├── package.json            # Node.js依存関係
├── tsconfig.json           # TypeScript設定
├── vite.config.ts          # Vite設定
└── README.md               # このファイル
```

## 使用方法

1. **アプリケーション起動**
   - デスクトップアプリケーションを起動

2. **Slack認証**
   - 「Slackで認証」ボタンをクリック
   - ブラウザでSlack認証を完了

3. **チャンネル選択**
   - 出退勤メッセージを投稿するチャンネルを選択

4. **出退勤打刻**
   - 「🟢 出勤」または「🔴 退勤」ボタンをクリック
   - 選択したSlackチャンネルにメッセージが投稿されます

## 環境変数

`.env`ファイルを作成して以下の環境変数を設定：

```env
VITE_SERVER_URL=http://localhost:3000
```

## スクリプト

- `npm run dev`: 開発用Viteサーバー起動
- `npm run build`: 本番用ビルド
- `npm run preview`: ビルド結果のプレビュー
- `npm run tauri:dev`: Tauri開発モード
- `npm run tauri:build`: Tauriアプリケーションビルド
- `npm run lint`: ESLintによるコード検査
- `npm run lint:fix`: ESLintエラーの自動修正
- `npm run format`: Prettierによるコード整形
- `npm run format:check`: コード整形のチェック

## 注意事項

- 初回起動時はSlackアプリケーションのセットアップが必要です
- インターネット接続が必要です
- Slack APIの利用制限に注意してください

## トラブルシューティング

### 認証エラー

- Slackアプリケーションの設定を確認
- ネットワーク接続を確認
- サーバーが起動しているか確認

### ビルドエラー

- Node.jsとRustのバージョンを確認
- 依存関係を再インストール: `rm -rf node_modules && npm install`

## ライセンス

MIT License
