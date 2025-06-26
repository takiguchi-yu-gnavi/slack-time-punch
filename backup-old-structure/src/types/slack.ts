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
  is_permanent?: boolean; // Token Rotationが無効で永続的な場合はtrue
}

export interface UserInfoResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    team_id: string;
    team_name: string;
    profile?: {
      display_name: string;
      real_name: string;
      image_24?: string;
      image_32?: string;
      image_48?: string;
      image_72?: string;
      image_192?: string;
      image_512?: string;
      image_original?: string;
    };
  };
  token_info?: TokenExpiryInfo;
}
