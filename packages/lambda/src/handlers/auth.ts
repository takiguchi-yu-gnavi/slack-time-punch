import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { createResponse, handleError } from '../common';
import { SlackAuthService } from '../services/slackAuth';
import { StateManager } from '../utils/stateManager';

// StateManagerのインスタンス
const stateManager = new StateManager();

// Slack認証サービスのインスタンスを取得する関数
const getSlackAuthService = (): SlackAuthService => {
  return new SlackAuthService();
};

export const authHandler = {
  /**
   * OAuth認証開始エンドポイント
   * GET /api/auth/slack
   */
  slackAuth: (_event: APIGatewayProxyEvent, _context: Context): APIGatewayProxyResult => {
    try {
      console.log('🔐 Slack OAuth認証開始');

      // セキュリティ用のstateパラメータを生成
      const state = stateManager.generateState();

      // Slack認証サービスのインスタンスを取得
      const slackAuth = getSlackAuthService();

      // Slack OAuth認証URLを生成
      const authUrl = slackAuth.generateAuthUrl(state);

      console.log('🚀 Slack認証URLにリダイレクト:', authUrl);

      // 認証URLにリダイレクト
      return {
        statusCode: 302,
        headers: {
          Location: authUrl,
          'Access-Control-Allow-Origin': process.env.CLIENT_URL ?? '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: '',
      };
    } catch (error) {
      console.error('OAuth認証開始エラー:', error);
      return handleError(error, 'OAuth認証開始');
    }
  },

  /**
   * OAuth認証コールバックエンドポイント
   * GET /api/auth/slack/callback
   */
  slackCallback: async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
    try {
      console.log('📥 Slack OAuth コールバック受信');

      const { code, state, error } = event.queryStringParameters ?? {};

      // エラーチェック
      if (error) {
        console.error('Slack OAuth エラー:', error);
        return createResponse(400, { error: 'OAuth認証がキャンセルされました' });
      }

      // パラメータの検証
      if (!code || !state) {
        return createResponse(400, { error: '必要なパラメータが不足しています' });
      }

      // stateパラメータの検証（CSRF攻撃対策）
      if (!stateManager.validateState(state)) {
        return createResponse(400, { error: '無効なstateパラメータです' });
      }

      // Slack認証サービスのインスタンスを取得
      const slackAuth = getSlackAuthService();

      // 認証コードをアクセストークンに交換
      const tokenResponse = await slackAuth.exchangeCodeForToken(code);

      console.log('OAuth認証結果:', {
        hasUserToken: !!tokenResponse.authed_user.access_token,
        hasBotToken: !!tokenResponse.access_token,
        userTokenLength: tokenResponse.authed_user.access_token?.length ?? 0,
        scopes: tokenResponse.scope,
        userScopes: tokenResponse.authed_user.scope,
      });

      // 成功時、トークン情報をURLパラメータとして安全に渡す
      const redirectUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';

      // トークン情報をBase64エンコードして安全に渡す
      const tokenData = {
        userToken: tokenResponse.authed_user.access_token ?? '',
        botToken: tokenResponse.access_token ?? '',
        teamId: tokenResponse.team?.id ?? '',
        userId: tokenResponse.authed_user?.id ?? '',
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

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': process.env.CLIENT_URL ?? '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: successHtml,
      };
    } catch (error) {
      console.error('OAuth callback エラー:', error);
      return handleError(error, 'OAuth callback');
    }
  },

  /**
   * ログアウトエンドポイント
   * POST /api/auth/logout
   */
  logout: (_event: APIGatewayProxyEvent, _context: Context): APIGatewayProxyResult => {
    console.log('🚪 ログアウトリクエスト');

    // 現在のアプリではトークンの無効化は行わず、クライアント側でのトークン削除を指示
    // Slack OAuth v2では、トークンの取り消しは auth.revoke APIを使用しますが、
    // ここでは簡易的な実装として成功レスポンスを返します

    console.log('✅ ログアウト完了');

    return createResponse(200, {
      success: true,
      message: 'ログアウトしました',
      instruction: 'クライアント側でトークンを削除してください',
    });
  },

  /**
   * チャンネル一覧取得エンドポイント
   * GET /api/auth/channels?token=<user_token>
   */
  getChannels: async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
    try {
      console.log('📋 チャンネル一覧取得リクエスト');

      const { token } = event.queryStringParameters ?? {};

      console.log('チャンネル取得リクエスト:', {
        hasToken: !!token,
        tokenType: typeof token,
        tokenLength: typeof token === 'string' ? token.length : 0,
      });

      if (!token) {
        return createResponse(400, {
          error: 'ユーザートークンが必要です',
          message: 'クエリパラメータ "token" が不足しています',
        });
      }

      // Slack認証サービスのインスタンスを取得
      const slackAuth = getSlackAuthService();

      // チャンネル一覧を取得
      const channelsResponse = await slackAuth.getChannels(token);

      if (!channelsResponse.ok) {
        console.error('チャンネル取得エラー:', channelsResponse.error);
        return createResponse(401, {
          error: 'チャンネル取得に失敗しました',
          slackError: channelsResponse.error,
        });
      }

      // チャンネルデータの取得（レスポンス構造に応じて調整）
      const channelsData =
        (channelsResponse.channels as unknown[]) ?? (channelsResponse.data?.channels as unknown[]) ?? [];
      const channels = Array.isArray(channelsData) ? channelsData : [];

      console.log('✅ チャンネル一覧取得成功:', {
        channelCount: channels.length,
        channels: channels.map((ch: unknown) => {
          const channel = ch as Record<string, unknown>;
          return {
            id: channel.id,
            name: channel.name,
            is_private: channel.is_private,
          };
        }),
      });

      return createResponse(200, {
        success: true,
        channels: channels.map((channelData: unknown) => {
          const channel = channelData as Record<string, unknown>;
          return {
            id: (channel.id as string) ?? '',
            name: (channel.name as string) ?? '',
            is_channel: Boolean(channel.is_channel),
            is_group: Boolean(channel.is_group),
            is_private: Boolean(channel.is_private),
            is_archived: Boolean(channel.is_archived),
            is_member: Boolean(channel.is_member),
            num_members: Number(channel.num_members ?? 0),
            purpose: channel.purpose as Record<string, unknown>,
            topic: channel.topic as Record<string, unknown>,
          };
        }),
        count: channels.length,
      });
    } catch (error) {
      console.error('チャンネル一覧取得エラー:', error);
      return handleError(error, 'チャンネル一覧取得');
    }
  },

  /**
   * メッセージ投稿エンドポイント
   * POST /api/auth/post-message
   */
  postMessage: async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
    try {
      console.log('📤 メッセージ投稿リクエスト');

      // リクエストボディの解析
      let requestBody: Record<string, unknown>;
      try {
        requestBody = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : {};
      } catch {
        return createResponse(400, {
          error: 'Invalid JSON in request body',
          message: 'リクエストボディのJSONが無効です',
        });
      }

      const { userToken, channelId, message } = requestBody as {
        channelId: string;
        message: string;
        userToken: string;
      };

      console.log('メッセージ投稿リクエスト詳細:', {
        hasUserToken: !!userToken,
        hasChannelId: !!channelId,
        hasMessage: !!message,
      });

      // 必須パラメータの検証
      if (!userToken) {
        return createResponse(400, {
          error: 'ユーザートークンが必要です',
          message: 'リクエストボディに "token" または "userToken" が必要です',
        });
      }

      if (!channelId) {
        return createResponse(400, {
          error: 'チャンネルIDが必要です',
          message: 'リクエストボディに "channelId" が必要です',
        });
      }

      if (!message) {
        return createResponse(400, {
          error: 'メッセージが必要です',
          message: 'リクエストボディに "message" が必要です',
        });
      }

      // Slack認証サービスのインスタンスを取得
      const slackAuth = getSlackAuthService();
      const fullMessage = `${message}`;

      // メッセージをSlackに投稿
      const postResponse = await slackAuth.postMessageAsUser(userToken, channelId, fullMessage);

      if (!postResponse.ok) {
        console.error('メッセージ投稿エラー:', postResponse.error);
        return createResponse(400, {
          error: 'メッセージの投稿に失敗しました',
          slackError: postResponse.error,
        });
      }

      console.log('✅ メッセージ投稿成功:', {
        channelId,
        messageTs: postResponse.ts as string,
      });

      return createResponse(200, {
        success: true,
        message: 'メッセージを投稿しました',
        data: {
          channelId,
          messageTs: postResponse.ts as string,
          fullMessage,
        },
      });
    } catch (error) {
      console.error('メッセージ投稿エラー:', error);
      return handleError(error, 'メッセージ投稿');
    }
  },
};
