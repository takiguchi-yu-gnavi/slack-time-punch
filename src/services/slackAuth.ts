import axios from 'axios';
import { SlackErrorResponse, SlackOAuthResponse } from '../types/slack';

export class SlackAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly defaultScopes: string;
  private readonly defaultUserScopes: string;

  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID || '';
    this.clientSecret = process.env.SLACK_CLIENT_SECRET || '';
    this.redirectUri = process.env.REDIRECT_URI || '';
    this.defaultScopes = process.env.SLACK_SCOPES || 'commands,incoming-webhook,chat:write';
    this.defaultUserScopes = process.env.SLACK_USER_SCOPES || 'channels:read,chat:write,identify';

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
    const requestedScopes = scopes || this.defaultScopes;
    const requestedUserScopes = userScopes || this.defaultUserScopes;
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: requestedScopes,
      user_scope: requestedUserScopes,
      redirect_uri: this.redirectUri,
      state: state,
      response_type: 'code'
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
      const response = await axios.post('https://slack.com/api/oauth.v2.access', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const data = response.data as SlackOAuthResponse | SlackErrorResponse;
      
      if (!data.ok) {
        throw new Error(`Slack OAuth error: ${(data as SlackErrorResponse).error}`);
      }

      return data as SlackOAuthResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP request failed: ${error.message}`);
      }
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
  async callSlackAPI(
    token: string,
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any
  ): Promise<any> {
    try {
      console.log(`Slack API Call: ${method} ${endpoint}`, { data, tokenLength: token?.length });
      
      const config = {
        method,
        url: `https://slack.com/api/${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': method === 'POST' ? 'application/json' : 'application/x-www-form-urlencoded'
        },
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? data : undefined
      };

      const response = await axios(config);
      console.log(`Slack API Response: ${endpoint}`, { 
        ok: response.data.ok, 
        error: response.data.error,
        dataKeys: Object.keys(response.data || {})
      });
      
      return response.data;
    } catch (error) {
      console.error(`Slack API Error for ${endpoint}:`, error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
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
  async getChannels(userToken: string): Promise<any> {
    try {
      // Slack Web APIでは、GETリクエストでパラメータをURLSearchParamsで送信
      const params = new URLSearchParams({
        types: 'public_channel,private_channel',
        exclude_archived: 'true',
        limit: '1000'
      });

      const response = await axios.get(`https://slack.com/api/users.conversations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('チャンネル取得API直接呼び出し結果:', {
        ok: response.data.ok,
        error: response.data.error,
        channelCount: response.data.channels?.length
      });

      return response.data;
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
  async postMessageAsUser(userToken: string, channelId: string, text: string): Promise<any> {
    return this.callSlackAPI(userToken, 'chat.postMessage', 'POST', {
      channel: channelId,
      text: text,
      as_user: true
    });
  }

  /**
   * ユーザー情報を取得
   * @param userToken ユーザーアクセストークン
   * @returns ユーザー情報
   */
  async getUserInfo(userToken: string): Promise<any> {
    return this.callSlackAPI(userToken, 'auth.test', 'GET');
  }
}
