// Slack関連の型定義（共有型をre-export）

export type {
    ApiResponse, // 後方互換性のためのエイリアス
    ChannelsResponse as ChannelsApiResponse, SlackChannel,
    AuthTokenInfo as SlackTokenInfo
} from '@slack-time-punch/shared'

// クライアント専用の型定義
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
