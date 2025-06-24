import cors from 'cors';
import express, { Request, Response } from 'express';
import { SlackAuthService } from '../services/slackAuth';
import { stateManager } from '../utils/stateManager';

const router = express.Router();

// CORS設定
router.use(cors());

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
    
    // 成功時、トークン情報を含むHTMLページを返す（実際のアプリではセッションに保存）
    const successHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>認証完了</title>
        <script>
          // トークン情報をローカルストレージに保存（実際のアプリではセッションを使用）
          localStorage.setItem('slackTokenInfo', JSON.stringify({
            userToken: '${tokenResponse.authed_user.access_token || ''}',
            botToken: '${tokenResponse.access_token}',
            teamId: '${tokenResponse.team.id}',
            userId: '${tokenResponse.authed_user.id}'
          }));
          // メインページにリダイレクト
          window.location.href = '/';
        </script>
    </head>
    <body>
        <p>認証処理中...</p>
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
