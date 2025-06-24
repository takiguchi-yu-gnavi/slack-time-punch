import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import path from 'path';
import { authRoutes } from './routes/auth';

// 環境変数の読み込み
dotenv.config();

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
    // CORS設定
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // JSONボディパーサー
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // 静的ファイルの提供
    this.app.use(express.static(path.join(__dirname, '../public')));
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
      console.log(`🚀 Slack OAuth アプリが起動しました`);
      console.log(`📍 URL: http://localhost:${this.port}`);
      console.log(`🔑 Slack認証: http://localhost:${this.port}/auth/slack`);
      console.log(`🔧 環境: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

// アプリケーションの起動
const app = new SlackOAuthApp();
app.start();
