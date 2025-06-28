# Server/Client分離完了とTauri準備

## 🎉 分離完了

### 📁 新しいディレクトリ構造

```
slack-time-punch/
├── packages/
│   ├── shared/           # 共有型定義・ユーティリティ
│   │   ├── src/
│   │   │   ├── types.ts  # Slack API型定義
│   │   │   └── index.ts  # エクスポート
│   │   └── package.json
│   ├── server/           # Express.js APIサーバー
│   │   ├── src/
│   │   │   ├── routes/   # API ルート
│   │   │   ├── services/ # Slack認証サービス
│   │   │   ├── utils/    # ユーティリティ
│   │   │   └── server.ts # サーバーメイン
│   │   └── package.json
│   └── client/           # React.js フロントエンド (Tauri-ready)
│       ├── src/
│       │   ├── components/ # Reactコンポーネント
│       │   ├── hooks/      # カスタムフック
│       │   ├── styles/     # CSS Modules
│       │   └── main.tsx    # エントリーポイント
│       ├── public/
│       ├── vite.config.ts
│       └── package.json
├── package.json          # ワークスペース管理
└── README.md
```

### 🚀 起動方法

#### 両方同時起動
```bash
npm run dev
```

#### 個別起動
```bash
# サーバーのみ
npm run dev:server

# クライアントのみ  
npm run dev:client
```

### 🔗 通信設定

- **サーバー**: http://localhost:3000 (API)
- **クライアント**: http://localhost:5173 (UI)
- **CORS**: クライアント→サーバー通信を許可

## 🖥️ Tauri準備

### 次のステップ

1. **Tauri CLIインストール**
   ```bash
   cd packages/client
   npm install --save-dev @tauri-apps/cli
   ```

2. **Tauri初期化**
   ```bash
   npm run tauri init
   ```

3. **設定調整**
   - `tauri.conf.json`でクライアントアプリをデスクトップアプリ化
   - サーバーは外部APIまたはTauriコマンドとして統合

### Tauriでの選択肢

#### オプション1: 外部APIサーバー
- サーバーは別プロセスで実行
- HTTP通信でクライアント↔サーバー連携
- 現在の構成をそのまま使用

#### オプション2: Tauriコマンド統合
- サーバーロジックをTauriコマンドに移植
- Rust/Node.jsアドオンとして統合
- より統合されたデスクトップアプリ

### 推奨アプローチ

**段階的移行**:
1. まず現在の構成でTauriアプリ化（オプション1）
2. 動作確認後、必要に応じてTauriコマンド統合（オプション2）

この分離により、Tauriへの移行がスムーズに行えるようになりました。
