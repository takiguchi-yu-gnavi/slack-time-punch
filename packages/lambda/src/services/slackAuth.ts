import https from 'https';

import axios from 'axios';

import {
  HttpRequestData,
  SlackApiResponse,
  SlackChannel,
  SlackErrorResponse,
  SlackMessage,
  SlackOAuthResponse,
  SlackUser,
} from '../types/shared';

export class SlackAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly defaultScopes: string;
  private readonly defaultUserScopes: string;
  private readonly httpsAgent: https.Agent;

  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID ?? '';
    this.clientSecret = process.env.SLACK_CLIENT_SECRET ?? '';
    this.redirectUri = process.env.REDIRECT_URI ?? '';
    this.defaultScopes = process.env.SLACK_SCOPES ?? 'commands,incoming-webhook,chat:write';
    this.defaultUserScopes = process.env.SLACK_USER_SCOPES ?? 'channels:read,chat:write,identify';

    // SSL証明書検証の設定
    // ALLOW_SELF_SIGNED_CERTS環境変数またはDOCKER環境での証明書問題に対応
    const allowSelfSignedCerts =
      process.env.ALLOW_SELF_SIGNED_CERTS === 'true' ||
      process.env.DOCKER === 'true' ||
      process.env.NODE_ENV !== 'production';

    this.httpsAgent = new https.Agent({
      rejectUnauthorized: !allowSelfSignedCerts,
      // より詳細な設定でSlack APIとの通信を安定化
      keepAlive: true,
      timeout: 30000,
      maxSockets: 10,
    });

    console.log('🔒 HTTPS Agent設定:', {
      rejectUnauthorized: !allowSelfSignedCerts,
      NODE_ENV: process.env.NODE_ENV,
      DOCKER: process.env.DOCKER,
      ALLOW_SELF_SIGNED_CERTS: process.env.ALLOW_SELF_SIGNED_CERTS,
    });

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Slack OAuth credentials are not properly configured');
    }
  }

  /**
   * Slack OAuth認証用のURLを生成する
   * @param state セキュリティ用のランダムな文字列
   * @param scopes 要求するボットスコープ（省略時は環境変数から取得）
   * @param userScopes 要求するユーザースコープ（省略時は環境変数から取得）
   * @returns OAuth認証URL
   */
  generateAuthUrl(state: string, scopes?: string, userScopes?: string): string {
    const requestedScopes = scopes ?? this.defaultScopes;
    const requestedUserScopes = userScopes ?? this.defaultUserScopes;

    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: requestedScopes,
      user_scope: requestedUserScopes,
      redirect_uri: this.redirectUri,
      state,
      response_type: 'code',
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * 認証コードをアクセストークンに交換する
   * @param code OAuth認証で取得したコード
   * @returns Slack OAuth レスポンス
   */
  async exchangeCodeForToken(code: string): Promise<SlackOAuthResponse> {
    try {
      console.log('🔄 Slack OAuth token exchange開始:', {
        hasCode: !!code,
        codeLength: code?.length,
        httpsAgentRejectUnauthorized: this.httpsAgent.options.rejectUnauthorized,
      });

      const response = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent: this.httpsAgent,
          timeout: 30000, // 30秒のタイムアウト
        }
      );

      console.log('✅ Slack OAuth token exchange成功');

      const data = response.data as SlackOAuthResponse | SlackErrorResponse;

      if (!data.ok) {
        throw new Error(`Slack OAuth error: ${(data as SlackErrorResponse).error}`);
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            rejectUnauthorized: this.httpsAgent.options.rejectUnauthorized,
          },
          response: error.response
            ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data as Record<string, unknown>,
              }
            : null,
        };

        console.error('❌ Slack OAuth token exchange failed:', errorDetails);

        // 証明書関連のエラーの場合、より詳細な情報を提供
        if (
          error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
          error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
          error.message.includes('certificate')
        ) {
          throw new Error(
            `SSL Certificate error: ${error.message}. Consider setting ALLOW_SELF_SIGNED_CERTS=true or updating CA certificates.`
          );
        }

        throw new Error(`HTTP request failed: ${error.message}`);
      }
      console.error('❌ Unexpected error in OAuth token exchange:', error);
      throw error;
    }
  }

  /**
   * アクセストークンを使用してSlack APIを呼び出すためのヘルパー
   * @param token アクセストークン
   * @param endpoint APIエンドポイント
   * @param method HTTPメソッド
   * @param data リクエストデータ
   * @returns API レスポンス
   */
  async callSlackAPI<T = unknown>(
    token: string,
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: HttpRequestData
  ): Promise<SlackApiResponse<T>> {
    try {
      console.log(`Slack API Call: ${method} ${endpoint}`, { data, tokenLength: token?.length });

      const config = {
        method,
        url: `https://slack.com/api/${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': method === 'POST' ? 'application/json' : 'application/x-www-form-urlencoded',
        },
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        httpsAgent: this.httpsAgent,
      };

      const response = await axios(config);
      const responseData = response.data as SlackApiResponse<T>;
      console.log(`Slack API Response: ${endpoint}`, {
        ok: responseData.ok,
        error: responseData.error,
        dataKeys: Object.keys(responseData ?? {}),
      });

      // auth.testの場合は有効期限情報も表示
      if (endpoint === 'auth.test' && responseData.ok && 'expires_in' in responseData) {
        const expiresIn = responseData.expires_in as number;
        const expirationDate = new Date(Date.now() + expiresIn * 1000);
        console.log(`🕐 トークン有効期限情報:`, {
          expires_in_seconds: expiresIn,
          expires_in_hours: Math.round((expiresIn / 3600) * 100) / 100,
          expires_in_days: Math.round((expiresIn / 86400) * 100) / 100,
          expiration_date: expirationDate.toLocaleString('ja-JP'),
          remaining_time: `${Math.floor(expiresIn / 86400)}日 ${Math.floor((expiresIn % 86400) / 3600)}時間`,
        });
      }

      return responseData;
    } catch (error) {
      console.error(`Slack API Error for ${endpoint}:`, error);
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as { error?: string } | undefined;
        const errorMessage = responseData?.error ?? error.message;
        throw new Error(`Slack API call failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * ユーザーがアクセスできるチャンネル一覧を取得
   * @param userToken ユーザーアクセストークン
   * @returns チャンネル一覧
   */
  async getChannels(userToken: string): Promise<SlackApiResponse<{ channels: SlackChannel[] }>> {
    try {
      // Slack Web APIでは、GETリクエストでパラメータをURLSearchParamsで送信
      const params = new URLSearchParams({
        types: 'public_channel,private_channel',
        exclude_archived: 'true',
        limit: '1000',
      });

      const response = await axios.get(`https://slack.com/api/users.conversations?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent: this.httpsAgent,
      });

      const responseData = response.data as SlackApiResponse<{ channels: SlackChannel[] }> & {
        channels?: SlackChannel[];
      };
      console.log('チャンネル取得API直接呼び出し結果:', {
        ok: responseData.ok,
        error: responseData.error,
        channelCount: responseData.channels?.length ?? responseData.data?.channels?.length,
      });

      return responseData;
    } catch (error) {
      console.error('チャンネル取得API直接呼び出しエラー:', error);
      throw error;
    }
  }

  /**
   * 指定されたチャンネルにユーザーとしてメッセージを投稿
   * @param userToken ユーザーアクセストークン
   * @param channelId チャンネルID
   * @param text メッセージテキスト
   * @returns 投稿結果
   */
  async postMessageAsUser(userToken: string, channelId: string, text: string): Promise<SlackApiResponse<SlackMessage>> {
    return this.callSlackAPI(userToken, 'chat.postMessage', 'POST', {
      channel: channelId,
      text,
    });
  }

  /**
   * 指定されたチャンネルにボットとしてメッセージを投稿
   * @param botToken ボットアクセストークン
   * @param channelId チャンネルID
   * @param text メッセージテキスト
   * @returns 投稿結果
   */
  async postMessageAsBot(botToken: string, channelId: string, text: string): Promise<SlackApiResponse<SlackMessage>> {
    return this.callSlackAPI(botToken, 'chat.postMessage', 'POST', {
      channel: channelId,
      text,
    });
  }

  /**
   * 詳細なユーザープロフィール情報を取得
   * @param userToken ユーザーアクセストークン
   * @param userId ユーザーID（省略時は認証ユーザー自身）
   * @returns ユーザープロフィール情報
   */
  async getUserProfile(
    userToken: string,
    userId?: string
  ): Promise<SlackApiResponse<{ profile: SlackUser['profile'] }>> {
    if (userId) {
      return this.callSlackAPI(userToken, 'users.info', 'GET', { user: userId });
    } else {
      return this.callSlackAPI(userToken, 'users.profile.get', 'GET');
    }
  }
}
