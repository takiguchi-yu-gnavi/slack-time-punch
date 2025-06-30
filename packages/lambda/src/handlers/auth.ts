import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { createResponse, handleError } from '../common';
import { SlackAuthService } from '../services/slackAuth';
import { StateManager } from '../utils/stateManager';

// 型定義
interface UserResponseData {
  success: boolean;
  user: {
    id: string;
    name: string;
    team_id: string;
    team_name: string;
    display_name?: string;
    image_url?: string;
    profile?: Record<string, unknown>;
  };
  token_info?: {
    expires_in_seconds?: number;
    expires_in_hours?: number;
    expires_in_days?: number;
    expiration_date?: string;
    expiration_date_local?: string;
    remaining_time?: string;
    is_permanent: boolean;
  };
}

// StateManagerのインスタンス
const stateManager = new StateManager();

// Slack認証サービスのインスタンスを取得する関数
const getSlackAuthService = (): SlackAuthService => {
  return new SlackAuthService();
};

export const authHandler = {
  /**
   * OAuth認証開始エンドポイント
   * GET /auth/slack
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
   * GET /auth/slack/callback
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
   * ユーザー情報取得エンドポイント
   * GET /auth/user-info?token=<user_token>
   */
  getUserInfo: async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
    try {
      console.log('👤 ユーザー情報取得リクエスト');

      const { token } = event.queryStringParameters ?? {};

      if (!token) {
        return createResponse(400, {
          error: 'トークンが必要です',
          message: 'クエリパラメータ "token" が不足しています',
        });
      }

      // Slack認証サービスのインスタンスを取得
      const slackAuth = getSlackAuthService();

      // ユーザー情報を取得
      const [userInfoResponse, userProfileResponse] = await Promise.all([
        slackAuth.getUserInfo(token),
        slackAuth.getUserProfile(token).catch(() => null), // プロフィール取得失敗時はnull
      ]);

      if (!userInfoResponse.ok) {
        console.error('ユーザー情報取得エラー:', userInfoResponse.error);
        return createResponse(401, {
          error: 'トークンが無効です',
          slackError: userInfoResponse.error,
        });
      }

      // レスポンスデータの構築
      const userProfile = userProfileResponse?.profile as Record<string, unknown> | undefined;
      const responseData: UserResponseData = {
        success: true,
        user: {
          id: (userInfoResponse.user_id as string) ?? '',
          name: (userInfoResponse.user as string) ?? '',
          team_id: (userInfoResponse.team_id as string) ?? '',
          team_name: (userInfoResponse.team as string) ?? '',
        },
      };

      // オプショナルプロパティを条件付きで追加
      if (userProfile?.display_name) {
        responseData.user.display_name = userProfile.display_name as string;
      }
      if (userProfile?.image_512 ?? userProfile?.image_192) {
        responseData.user.image_url = (userProfile.image_512 as string) ?? (userProfile.image_192 as string);
      }
      if (userProfile) {
        responseData.user.profile = userProfile;
      }

      // トークン有効期限情報があれば追加
      if ('expires_in' in userInfoResponse && userInfoResponse.expires_in) {
        const expiresIn = userInfoResponse.expires_in as number;
        const expirationDate = new Date(Date.now() + expiresIn * 1000);

        responseData.token_info = {
          expires_in_seconds: expiresIn,
          expires_in_hours: Math.round((expiresIn / 3600) * 100) / 100,
          expires_in_days: Math.round((expiresIn / 86400) * 100) / 100,
          expiration_date: expirationDate.toISOString(),
          expiration_date_local: expirationDate.toLocaleString('ja-JP'),
          remaining_time: `${Math.floor(expiresIn / 86400)}日 ${Math.floor((expiresIn % 86400) / 3600)}時間`,
          is_permanent: false,
        };
      } else {
        responseData.token_info = {
          is_permanent: true,
        };
      }

      console.log('✅ ユーザー情報取得成功:', {
        userId: responseData.user.id,
        userName: responseData.user.name,
        teamId: responseData.user.team_id,
        hasPermanentToken: responseData.token_info?.is_permanent,
      });

      return createResponse(200, responseData as unknown as Record<string, unknown>);
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return handleError(error, 'ユーザー情報取得');
    }
  },

  /**
   * トークンリフレッシュエンドポイント
   * POST /auth/refresh
   */
  refreshToken: async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
    try {
      console.log('🔄 トークンリフレッシュリクエスト');

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

      const { token } = requestBody as { token?: string };

      if (!token) {
        return createResponse(400, {
          error: 'トークンが必要です',
          message: 'リクエストボディに "token" が必要です',
        });
      }

      console.log('トークンリフレッシュ詳細:', {
        hasToken: !!token,
        tokenLength: typeof token === 'string' ? token.length : 0,
      });

      // Slack認証サービスのインスタンスを取得
      const slackAuth = getSlackAuthService();

      // トークンの有効性を確認
      const userInfoResponse = await slackAuth.getUserInfo(token);

      if (!userInfoResponse.ok) {
        console.error('トークン検証エラー:', userInfoResponse.error);
        return createResponse(401, {
          error: 'トークンが無効です',
          message: '再認証が必要です',
          slackError: userInfoResponse.error,
        });
      }

      // Slack OAuth v2では自動的なリフレッシュトークンはありません
      // 現在のトークンが有効であれば、そのまま返します
      const responseData: Record<string, unknown> = {
        success: true,
        message: 'トークンは有効です',
        user: {
          id: (userInfoResponse.user_id as string) ?? '',
          name: (userInfoResponse.user as string) ?? '',
          team_id: (userInfoResponse.team_id as string) ?? '',
          team_name: (userInfoResponse.team as string) ?? '',
        },
      };

      // トークン有効期限情報があれば追加
      if ('expires_in' in userInfoResponse && userInfoResponse.expires_in) {
        const expiresIn = userInfoResponse.expires_in as number;
        const expirationDate = new Date(Date.now() + expiresIn * 1000);

        responseData.token_info = {
          expires_in_seconds: expiresIn,
          expires_in_hours: Math.round((expiresIn / 3600) * 100) / 100,
          expires_in_days: Math.round((expiresIn / 86400) * 100) / 100,
          expiration_date: expirationDate.toISOString(),
          expiration_date_local: expirationDate.toLocaleString('ja-JP'),
          remaining_time: `${Math.floor(expiresIn / 86400)}日 ${Math.floor((expiresIn % 86400) / 3600)}時間`,
          is_permanent: false,
        };
      } else {
        responseData.token_info = {
          is_permanent: true,
        };
      }

      console.log('✅ トークンリフレッシュ完了');

      return createResponse(200, responseData);
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
      return handleError(error, 'トークンリフレッシュ');
    }
  },

  /**
   * ログアウトエンドポイント
   * POST /auth/logout
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
   * GET /auth/channels?token=<user_token>
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
   * POST /auth/post-message
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
