/**
 * Slack API型定義（shared packageから一時的にコピー）
 */

export interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    name: string;
    id: string;
  };
  enterprise?: {
    name: string;
    id: string;
  };
  authed_user: {
    id: string;
    scope?: string;
    access_token?: string;
    token_type?: string;
  };
}

export interface SlackErrorResponse {
  ok: false;
  error: string;
}

export interface AuthState {
  state: string;
  timestamp: number;
}

export interface TokenExpiryInfo {
  expires_in_seconds?: number;
  expires_in_hours?: number;
  expires_in_days?: number;
  expiration_date?: string;
  expiration_date_local?: string;
  remaining_time?: string;
  is_permanent?: boolean;
}

// Slack API 関連の型定義
export interface SlackApiResponse<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
  [key: string]: unknown;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private?: boolean;
  is_archived?: boolean;
  is_member?: boolean;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  display_name?: string;
  profile?: {
    email?: string;
    image_24?: string;
    image_32?: string;
    image_48?: string;
    image_72?: string;
    image_192?: string;
    image_512?: string;
  };
}

export interface SlackMessage {
  channel: string;
  text: string;
  ts?: string;
  user?: string;
}

// HTTP リクエストのパラメータ型
export type HttpRequestData = Record<string, unknown>;
