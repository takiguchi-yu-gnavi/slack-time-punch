# 画面が開かない問題の解決方法

## 🔍 問題の特定

### 1. サーバー/クライアントの起動確認
```bash
# サーバーとクライアントが起動しているか確認
lsof -ti:3000  # サーバー (should return process ID)
lsof -ti:5173  # クライアント (should return process ID)
```

### 2. 正しいURLの確認
- **サーバー**: http://localhost:3000 (API)
- **クライアント**: http://localhost:5173 (UI)

クライアントがポート5173で起動できない場合、自動的に5174に切り替わります。

### 3. ブラウザで正しいURLにアクセス
```
http://localhost:5173  # 通常
http://localhost:5174  # ポート競合時
```

## 🛠️ 解決手順

### Step 1: プロセスのクリーンアップ
```bash
# 既存のプロセスを停止
pkill -f "ts-node-dev|vite"
```

### Step 2: 依存関係の確認
```bash
# 共有パッケージをビルド
cd packages/shared && npm run build

# 各パッケージの依存関係を確認
cd packages/server && npm install
cd packages/client && npm install
```

### Step 3: 個別起動でテスト
```bash
# サーバーのみ起動
npm run dev:server

# 別ターミナルでクライアントのみ起動  
npm run dev:client
```

### Step 4: 同時起動
```bash
# ルートディレクトリから
npm run dev
```

## 🐛 よくあるエラーと解決方法

### 1. 型定義エラー
**症状**: `Cannot find module '@slack-time-punch/shared'`
**解決**: 
```bash
cd packages/shared && npm run build
```

### 2. ポート競合
**症状**: `Port 5173 is in use`
**解決**: http://localhost:5174 にアクセス

### 3. CORS エラー
**症状**: `Access to fetch blocked by CORS policy`
**解決**: サーバーのCORS設定で適切なオリジンが許可されているか確認

### 4. モジュール解決エラー
**症状**: `Module not found`
**解決**: 
```bash
# 依存関係を再インストール
npm run install:all
```

## 🔧 デバッグコマンド

### ビルドテスト
```bash
npm run check:server  # サーバーのビルドテスト
npm run check:client  # クライアントのビルドテスト
```

### 段階的起動
```bash
npm run debug  # サーバー起動後にクライアントを起動
```

## 📋 確認チェックリスト

- [ ] サーバーが http://localhost:3000 で起動している
- [ ] クライアントが http://localhost:5173 または 5174 で起動している
- [ ] ブラウザで正しいクライアントURLにアクセスしている
- [ ] 開発者ツールでJavaScriptエラーがないか確認
- [ ] 型定義エラーがないか確認

## 🆘 それでも解決しない場合

1. **ログの確認**: 起動時のエラーメッセージを確認
2. **ブラウザの開発者ツール**: Consoleタブでエラーを確認
3. **キャッシュクリア**: ブラウザのキャッシュをクリア
4. **ポート変更**: 別のポートで起動を試す
