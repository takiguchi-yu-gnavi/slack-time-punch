import cors from 'cors';
import express, { Request, Response } from 'express';
import { SlackAuthService } from '../services/slackAuth';
import { stateManager } from '../utils/stateManager';

const router = express.Router();

// CORS設定（ルーター固有）
router.use(cors({
  origin: [
    'http://localhost:5173', // Vite開発サーバー
    'http://localhost:3000'  // 本番用
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Slack認証サービスのインスタンスを取得する関数
function getSlackAuthService(): SlackAuthService {
  return new SlackAuthService();
}

/**
 * OAuth認証開始エンドポイント
 * GET /auth/slack
 */
router.get('/slack', (req: Request, res: Response) => {
  try {
    // セキュリティ用のstateパラメータを生成
    const state = stateManager.generateState();
    
    // Slack認証サービスのインスタンスを取得
    const slackAuth = getSlackAuthService();
    
    // Slack OAuth認証URLを生成
    const authUrl = slackAuth.generateAuthUrl(state);
    
    // 認証URLにリダイレクト
    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth認証開始エラー:', error);
    res.status(500).json({ 
      error: 'OAuth認証の開始に失敗しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
});

/**
 * OAuth認証コールバックエンドポイント
 * GET /auth/slack/callback
 */
router.get('/slack/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    // エラーチェック
    if (error) {
      console.error('Slack OAuth エラー:', error);
      return res.status(400).json({ error: 'OAuth認証がキャンセルされました' });
    }

    // パラメータの検証
    if (!code || !state) {
      return res.status(400).json({ error: '必要なパラメータが不足しています' });
    }

    // stateパラメータの検証（CSRF攻撃対策）
    if (!stateManager.validateState(state as string)) {
      return res.status(400).json({ error: '無効なstateパラメータです' });
    }

    // Slack認証サービスのインスタンスを取得
    const slackAuth = getSlackAuthService();

    // 認証コードをアクセストークンに交換
    const tokenResponse = await slackAuth.exchangeCodeForToken(code as string);
    
    console.log('OAuth認証結果:', {
      hasUserToken: !!tokenResponse.authed_user.access_token,
      hasBotToken: !!tokenResponse.access_token,
      userTokenLength: tokenResponse.authed_user.access_token?.length || 0,
      scopes: tokenResponse.scope,
      userScopes: tokenResponse.authed_user.scope
    });
    
    // 成功時、トークン情報をURLパラメータとして安全に渡す
    const redirectUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173';
    
    // トークン情報をBase64エンコードして安全に渡す
    const tokenData = {
      userToken: tokenResponse.authed_user.access_token || '',
      botToken: tokenResponse.access_token || '',
      teamId: tokenResponse.team?.id || '',
      userId: tokenResponse.authed_user?.id || ''
    };
    
    // Base64エンコード（URLセーフ）
    const encodedTokenData = Buffer.from(JSON.stringify(tokenData)).toString('base64url');
    
    console.log('🔐 エンコードしたトークン情報の長さ:', encodedTokenData.length);
    
    const successHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>認証完了</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
        <script>
          console.log('🎉 Slack認証が完了しました');
          console.log('🚀 Reactアプリにリダイレクトします...');
          
          // Reactアプリにトークン情報付きでリダイレクト
          const redirectUrl = '${redirectUrl}?auth=success&token=${encodedTokenData}';
          console.log('リダイレクト先:', redirectUrl);
          
          // 短い遅延の後にリダイレクト（ユーザーに成功メッセージを表示するため）
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        </script>
    </head>
    <body>
        <div class="container">
          <div class="spinner"></div>
          <h2>🎉 認証完了！</h2>
          <p>Slackアプリにリダイレクトしています...</p>
        </div>
    </body>
    </html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(successHtml);

  } catch (error) {
    console.error('OAuth callback エラー:', error);
    res.status(500).json({ 
      error: 'OAuth認証の処理に失敗しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
});

/**
 * 認証状態確認エンドポイント
 * GET /auth/status
 */
router.get('/status', (req: Request, res: Response) => {
  // 実際のアプリでは、セッションやJWTトークンから認証状態を確認
  res.json({
    authenticated: false,
    message: '認証状態を確認するにはOAuth認証を完了してください'
  });
});

/**
 * チャンネル一覧取得エンドポイント
 * GET /auth/channels?token=<user_token>
 */
router.get('/channels', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    console.log('チャンネル取得リクエスト:', { 
      hasToken: !!token, 
      tokenType: typeof token,
      tokenLength: typeof token === 'string' ? token.length : 0
    });

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'ユーザートークンが必要です' });
    }

    const slackAuth = getSlackAuthService();
    const channels = await slackAuth.getChannels(token);

    console.log('Slack API レスポンス:', { 
      ok: channels.ok, 
      error: channels.error,
      channelCount: channels.channels?.length 
    });

    if (!channels.ok) {
      return res.status(400).json({ 
        error: 'チャンネル取得に失敗しました', 
        slack_error: channels.error,
        details: channels
      });
    }

    // チャンネルデータの詳細をログ出力
    if (channels.channels && channels.channels.length > 0) {
      console.log('最初のチャンネルの詳細:', {
        id: channels.channels[0].id,
        name: channels.channels[0].name,
        is_member: channels.channels[0].is_member,
        is_private: channels.channels[0].is_private,
        allKeys: Object.keys(channels.channels[0])
      });
    }

    const mappedChannels = channels.channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      is_private: channel.is_private,
      is_member: channel.is_member
    }));

    console.log('返すチャンネル数:', mappedChannels.length);
    console.log('マップ後のチャンネル例:', mappedChannels[0]);

    res.json({
      success: true,
      channels: mappedChannels
    });

  } catch (error) {
    console.error('チャンネル取得エラー:', error);
    res.status(500).json({ 
      error: 'チャンネル取得に失敗しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
});

/**
 * メッセージ投稿エンドポイント
 * POST /auth/post-message
 */
router.post('/post-message', async (req: Request, res: Response) => {
  try {
    const { token, channelId, message } = req.body;

    if (!token || !channelId || !message) {
      return res.status(400).json({ 
        error: 'ユーザートークン、チャンネルID、メッセージが必要です' 
      });
    }

    const slackAuth = getSlackAuthService();
    const result = await slackAuth.postMessageAsUser(token, channelId, message);

    if (!result.ok) {
      return res.status(400).json({ 
        error: 'メッセージ投稿に失敗しました', 
        slack_error: result.error 
      });
    }

    res.json({
      success: true,
      message: 'メッセージを投稿しました',
      timestamp: result.ts,
      channel: result.channel
    });

  } catch (error) {
    console.error('メッセージ投稿エラー:', error);
    res.status(500).json({ 
      error: 'メッセージ投稿に失敗しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
});

/**
 * ユーザー情報取得エンドポイント
 * GET /auth/user-info?token=<user_token>
 */
router.get('/user-info', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'ユーザートークンが必要です' });
    }

    const slackAuth = getSlackAuthService();
    const userInfo = await slackAuth.getUserInfo(token);

    if (!userInfo.ok) {
      return res.status(400).json({ 
        error: 'ユーザー情報取得に失敗しました', 
        slack_error: userInfo.error 
      });
    }

    res.json({
      success: true,
      user: {
        id: userInfo.user_id,
        name: userInfo.user,
        team_id: userInfo.team_id,
        team_name: userInfo.team
      }
    });

  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ 
      error: 'ユーザー情報取得に失敗しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
});

export { router as authRoutes };
