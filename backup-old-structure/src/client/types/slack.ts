// Slack関連の型定義

export interface SlackTokenInfo {
  userToken: string
  botToken: string
  teamId: string
  userId: string
}

export interface SlackChannel {
  id: string
  name: string
  is_member: boolean
  is_private?: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// API Response types
export interface ChannelsApiResponse {
  success: boolean
  channels: SlackChannel[]
  error?: string
}

export interface PostMessageApiResponse {
  success?: boolean
  error?: string
}

export interface SlackUserInfo {
  id: string
  name: string
  team_id: string
  team_name: string
}

export interface UserInfoApiResponse {
  success: boolean
  user: SlackUserInfo
  error?: string
}
