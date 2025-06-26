import { getHostConfig } from '@slack-time-punch/shared';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import https from 'https';
import path from 'path';
import { authRoutes } from './routes/auth';

// 環境変数の読み込み（ルートディレクトリの.envファイルを指定）
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ホスト設定を取得
const hostConfig = getHostConfig();

// SSL/TLS設定の初期化とログ出力
const initializeSSLSettings = () => {
  console.log('🔒 SSL/TLS設定の初期化:', {
    NODE_ENV: process.env.NODE_ENV,
    DOCKER: process.env.DOCKER,
    NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
    ALLOW_SELF_SIGNED_CERTS: process.env.ALLOW_SELF_SIGNED_CERTS
  });

  // 開発環境でSSL証明書エラーを回避するためのaxios設定
  const shouldDisableSSLVerify = process.env.NODE_ENV !== 'production' || 
                                 process.env.DISABLE_SSL_VERIFY === 'true' ||
                                 process.env.DOCKER === 'true' ||
                                 process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';

  if (shouldDisableSSLVerify) {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      timeout: 30000
    });
    axios.defaults.httpsAgent = httpsAgent;
    console.log('🔧 SSL証明書検証を無効化しました');
  } else {
    console.log('🔒 SSL証明書検証は有効です');
  }
};

// SSL設定を初期化
initializeSSLSettings();

class SlackOAuthApp {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    // CORS設定 - クライアントアプリケーション分離対応
    this.app.use(cors({
      origin: [
        hostConfig.CLIENT_URL, // メインクライアント
        'http://localhost:5174', // 代替ポート
        hostConfig.SERVER_URL  // 本番用（将来のホスティング）
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // JSONボディパーサー
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // APIのみのサーバーなので静的ファイル提供は削除
    // this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private initializeRoutes(): void {
    // 認証関連のルート
    this.app.use('/auth', authRoutes);

    // ルートページ - クライアントアプリケーションにリダイレクト（クエリパラメータを引き継ぎ）
    this.app.get('/', (req, res) => {
      const clientUrl = hostConfig.CLIENT_URL;
      const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      const redirectUrl = `${clientUrl}${queryString}`;
      
      console.log(`🔗 クライアントにリダイレクト: ${redirectUrl}`);
      res.redirect(redirectUrl);
    });

    // ヘルスチェック
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        clientUrl: hostConfig.CLIENT_URL,
        serverUrl: hostConfig.SERVER_URL
      });
    });

    // 404ハンドラー
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'エンドポイントが見つかりません' });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Slack Time Punch API Server が起動しました`);
      console.log(`📍 サーバーURL: ${hostConfig.SERVER_URL}`);
      console.log(`🔑 Slack認証: ${hostConfig.SERVER_URL}/auth/slack`);
      console.log(`👥 クライアントURL: ${hostConfig.CLIENT_URL}`);
      console.log(`🔧 環境: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

// アプリケーションの起動
const app = new SlackOAuthApp();
app.start();
