/**
 * Slack OAuth認証に関する型定義
 */

/**
 * Slack OAuth認証のトークン情報
 */
export interface SlackAuthToken {
  /** アクセストークン */
  access_token: string;
  /** チームID */
  team_id: string;
  /** チーム名 */
  team_name: string;
  /** ユーザーID */
  user_id: string;
  /** ユーザー名 */
  user_name: string;
  /** スコープ */
  scope: string;
  /** トークンの有効期限（UnixTime） */
  expires_at?: number;
}

/**
 * 認証状態の型定義
 */
export interface AuthState {
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** 認証中かどうか */
  isAuthenticating: boolean;
  /** トークン情報 */
  token: SlackAuthToken | null;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * Deep Linkで受け取るデータの型定義
 */
export interface DeepLinkAuthData {
  /** 認証成功フラグ */
  success: boolean;
  /** トークン情報（認証成功時） */
  token?: SlackAuthToken;
  /** エラーメッセージ（認証失敗時） */
  error?: string;
}
