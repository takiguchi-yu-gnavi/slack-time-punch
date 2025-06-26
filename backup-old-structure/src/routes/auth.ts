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
    
    // 基本ユーザー情報取得
    const userInfo = await slackAuth.getUserInfo(token);
    
    if (!userInfo.ok) {
      return res.status(400).json({ 
        error: 'ユーザー情報取得に失敗しました', 
        slack_error: userInfo.error 
      });
    }

    // 詳細プロフィール情報取得
    const profileInfo = await slackAuth.getUserProfile(token);
    
    console.log('ユーザープロフィール取得:', {
      ok: profileInfo.ok,
      hasProfile: !!profileInfo.profile,
      profileKeys: profileInfo.profile ? Object.keys(profileInfo.profile) : []
    });

    const responseData: any = {
      success: true,
      user: {
        id: userInfo.user_id,
        name: userInfo.user,
        team_id: userInfo.team_id,
        team_name: userInfo.team
      }
    };

    // トークンの有効期限情報を追加
    if (userInfo.expires_in) {
      // Token Rotationが有効な場合：有効期限あり
      const expiresIn = userInfo.expires_in;
      const expirationDate = new Date(Date.now() + expiresIn * 1000);
      
      responseData.token_info = {
        expires_in_seconds: expiresIn,
        expires_in_hours: Math.round(expiresIn / 3600 * 100) / 100,
        expires_in_days: Math.round(expiresIn / 86400 * 100) / 100,
        expiration_date: expirationDate.toISOString(),
        expiration_date_local: expirationDate.toLocaleString('ja-JP'),
        remaining_time: `${Math.floor(expiresIn / 86400)}日 ${Math.floor((expiresIn % 86400) / 3600)}時間`,
        is_permanent: false
      };
      
      console.log('🕐 Token Rotationが有効：有効期限あり', {
        expires_in_seconds: expiresIn,
        expires_in_hours: Math.round(expiresIn / 3600 * 100) / 100,
        expiration_date: expirationDate.toLocaleString('ja-JP')
      });
    } else {
      // Token Rotationが無効な場合：永続的なトークン
      responseData.token_info = {
        is_permanent: true
      };
      
      console.log('♾️ Token Rotationが無効：永続的なトークン（有効期限なし）');
    }

    // プロフィール情報が取得できた場合は追加
    if (profileInfo.ok && profileInfo.profile) {
      responseData.user.profile = {
        display_name: profileInfo.profile.display_name || userInfo.user,
        real_name: profileInfo.profile.real_name || userInfo.user,
        image_24: profileInfo.profile.image_24,
        image_32: profileInfo.profile.image_32,
        image_48: profileInfo.profile.image_48,
        image_72: profileInfo.profile.image_72,
        image_192: profileInfo.profile.image_192,
        image_512: profileInfo.profile.image_512,
        image_original: profileInfo.profile.image_original
      };
    }

    res.json(responseData);

  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ 
      error: 'ユーザー情報取得に失敗しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
});

/**
 * 開発用：モックユーザー情報取得エンドポイント（トークン有効期限テスト用）
 * GET /auth/mock-user-info?type=permanent|expiring
 */
router.get('/mock-user-info', async (req: Request, res: Response) => {
  try {
    const { type = 'permanent' } = req.query;

    const baseUserData = {
      success: true,
      user: {
        id: 'U1234567890',
        name: 'test-user',
        team_id: 'T1234567890',
        team_name: 'テストチーム',
        profile: {
          display_name: 'テストユーザー',
          real_name: 'テスト 太郎',
          image_48: 'https://gravatar.com/avatar/placeholder?s=48&d=identicon',
          image_192: 'https://gravatar.com/avatar/placeholder?s=192&d=identicon'
        }
      }
    };

    if (type === 'expiring') {
      // Token Rotationが有効な場合のシミュレーション
      const expiresIn = 43200; // 12時間
      const expirationDate = new Date(Date.now() + expiresIn * 1000);
      
      (baseUserData as any).token_info = {
        expires_in_seconds: expiresIn,
        expires_in_hours: Math.round(expiresIn / 3600 * 100) / 100,
        expires_in_days: Math.round(expiresIn / 86400 * 100) / 100,
        expiration_date: expirationDate.toISOString(),
        expiration_date_local: expirationDate.toLocaleString('ja-JP'),
        remaining_time: `${Math.floor(expiresIn / 86400)}日 ${Math.floor((expiresIn % 86400) / 3600)}時間`,
        is_permanent: false
      };
      
      console.log('🧪 モック: Token Rotationが有効な場合をシミュレーション');
    } else {
      // 永続的なトークンの場合
      (baseUserData as any).token_info = {
        is_permanent: true
      };
      
      console.log('🧪 モック: 永続的なトークンをシミュレーション');
    }

    res.json(baseUserData);

  } catch (error) {
    console.error('モックユーザー情報取得エラー:', error);
    res.status(500).json({ 
      error: 'モックユーザー情報取得に失敗しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
});

/**
 * Token Rotation設定確認エンドポイント
 * GET /auth/token-rotation-status
 */
router.get('/token-rotation-status', (req: Request, res: Response) => {
  const tokenRotationInfo = {
    app_name: process.env.SLACK_APP_NAME || 'Slack出退勤打刻アプリ',
    token_rotation_info: {
      note: 'Token Rotationが有効な場合、auth.testのレスポンスにexpires_inが含まれます',
      how_to_check: '実際のSlack認証を行って/auth/user-infoエンドポイントでtoken_infoを確認してください',
      enable_token_rotation: {
        step1: 'https://api.slack.com/apps にアクセス',
        step2: 'アプリを選択 → OAuth & Permissions',
        step3: 'Token Rotation を有効にする',
        warning: '一度有効にすると無効化できません'
      },
      current_implementation: {
        supports_permanent_tokens: true,
        supports_expiring_tokens: true,
        auto_refresh: false,
        note: '12時間ごとの自動更新は未実装（Token Rotationを有効にする場合は実装が必要）'
      }
    }
  };

  res.json(tokenRotationInfo);
});

export { router as authRoutes };
