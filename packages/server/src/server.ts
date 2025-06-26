import { DEFAULT_CLIENT_PORT, DEFAULT_SERVER_PORT } from '@slack-time-punch/shared';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import path from 'path';
import { authRoutes } from './routes/auth';

// 環境変数の読み込み（ルートディレクトリの.envファイルを指定）
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class SlackOAuthApp {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || DEFAULT_SERVER_PORT.toString());
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    // CORS設定 - クライアントアプリケーション分離対応
    this.app.use(cors({
      origin: [
        `http://localhost:${DEFAULT_CLIENT_PORT}`, // クライアント開発サーバー
        'http://localhost:5174', // 代替ポート
        'http://localhost:3000'  // 本番用（将来のホスティング）
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

    // ルートページ
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // ヘルスチェック
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
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
      console.log(`📍 サーバーURL: http://localhost:${this.port}`);
      console.log(`🔑 Slack認証: http://localhost:${this.port}/auth/slack`);
      console.log(`👥 クライアントURL: http://localhost:${DEFAULT_CLIENT_PORT}`);
      console.log(`🔧 環境: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

// アプリケーションの起動
const app = new SlackOAuthApp();
app.start();
