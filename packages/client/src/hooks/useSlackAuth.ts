import { AuthTokenInfo } from '@slack-time-punch/shared'
import { useCallback, useEffect, useState } from 'react'

// クライアント専用の型定義
export interface SlackUserProfile {
  id: string
  name: string
  team_id: string
  team_name: string
  profile?: {
    display_name: string
    real_name: string
    image_24?: string
    image_32?: string
    image_48?: string
    image_72?: string
    image_192?: string
    image_512?: string
    image_original?: string
  }
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface UseSlackAuthReturn {
  authState: AuthState
  tokenInfo: AuthTokenInfo | null
  userProfile: SlackUserProfile | null
  login: () => void
  logout: () => void
  setAuthError: (error: string | null) => void
  setAuthLoading: (loading: boolean) => void
}

export const useSlackAuth = (): UseSlackAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null
  })
  const [tokenInfo, setTokenInfo] = useState<AuthTokenInfo | null>(null)
  const [userProfile, setUserProfile] = useState<SlackUserProfile | null>(null)

  // ローカルストレージのテスト関数
  const testLocalStorage = useCallback(() => {
    try {
      console.log('ローカルストレージテスト開始...')
      const testKey = 'test-key'
      const testValue = 'test-value'
      
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      console.log('テスト保存・取得結果:', { testValue, retrieved, success: testValue === retrieved })
      localStorage.removeItem(testKey)
      
      return testValue === retrieved
    } catch (error) {
      console.error('ローカルストレージテストエラー:', error)
      return false
    }
  }, [])

  // 認証状態をチェック
  const checkAuthState = useCallback(() => {
    console.log('=== 認証状態チェック開始 ===')
    console.log('現在のURL:', window.location.href)
    console.log('ローカルストレージの全項目数:', localStorage.length)
    
    // ローカルストレージの全項目をログ出力
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        console.log(`ローカルストレージ[${key}]:`, localStorage.getItem(key))
      }
    }
    
    const storedTokenInfo = localStorage.getItem('slackTokenInfo')
    console.log('ターゲットキー "slackTokenInfo" の値:', storedTokenInfo)
    
    if (storedTokenInfo) {
      try {
        const parsedTokenInfo = JSON.parse(storedTokenInfo) as AuthTokenInfo
        console.log('解析されたトークン情報:', parsedTokenInfo)
        setTokenInfo(parsedTokenInfo)
        setAuthState(prev => ({ ...prev, isAuthenticated: true }))
        console.log('認証状態を更新しました')
      } catch (error) {
        console.error('トークン情報の解析に失敗:', error)
        localStorage.removeItem('slackTokenInfo')
      }
    } else {
      console.log('ローカルストレージにトークン情報が見つかりません')
    }
    console.log('=== 認証状態チェック終了 ===')
  }, [])

  // 初期化とURLパラメータチェック
  useEffect(() => {
    // 初回チェック
    console.log('🔍 ローカルストレージ動作テスト:', testLocalStorage())
    checkAuthState()

    // URLパラメータで認証成功を検知
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'success') {
      console.log('🎉 認証成功パラメータを検出しました。')
      
      // トークン情報をURLパラメータから取得
      const tokenParam = urlParams.get('token')
      if (tokenParam) {
        try {
          console.log('🔓 URLパラメータからトークン情報をデコード中...')
          
          // Base64urlデコード
          const decodedString = atob(tokenParam.replace(/-/g, '+').replace(/_/g, '/'))
          const tokenData = JSON.parse(decodedString) as AuthTokenInfo
          
          console.log('✅ トークン情報のデコード成功:', {
            hasUserToken: !!tokenData.userToken,
            hasBotToken: !!tokenData.botToken,
            userTokenLength: tokenData.userToken?.length || 0,
            teamId: tokenData.teamId,
            userId: tokenData.userId
          })
          
          // ローカルストレージに保存
          localStorage.setItem('slackTokenInfo', JSON.stringify(tokenData))
          console.log('💾 ローカルストレージに認証情報を保存しました')
          
          // 状態を更新
          setTokenInfo(tokenData)
          setAuthState(prev => ({ ...prev, isAuthenticated: true }))
          console.log('🔄 認証状態を更新しました')
          
        } catch (error) {
          console.error('❌ トークン情報のデコードに失敗:', error)
          setAuthState(prev => ({ 
            ...prev, 
            error: '認証情報の処理に失敗しました'
          }))
        }
      } else {
        console.log('⚠️ 認証成功パラメータはありますが、トークン情報がありません')
      }
      
      // URLパラメータをクリア
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // 最終チェック
      setTimeout(() => {
        console.log('認証処理後の最終チェック...')
        checkAuthState()
      }, 500)
    }

    // ウィンドウにフォーカスが戻った時にも再チェック（認証後のリダイレクト対応）
    const handleFocus = () => {
      console.log('ウィンドウにフォーカスが戻りました。認証状態を再チェックします。')
      checkAuthState()
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [testLocalStorage, checkAuthState])

  const login = useCallback(() => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    // OAuth認証は直接リダイレクトで行う
    window.location.href = 'http://localhost:3000/auth/slack'
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('slackTokenInfo')
    setTokenInfo(null)
    setUserProfile(null)
    setAuthState({ isAuthenticated: false, isLoading: false, error: null })
  }, [])

  // ユーザー情報を取得
  const fetchUserProfile = useCallback(async (userToken: string) => {
    try {
      console.log('🔍 ユーザープロフィール情報を取得中...')
      const response = await fetch(`http://localhost:3000/auth/user-info?token=${userToken}`)
      const data = await response.json()
      
      if (data.success && data.user) {
        console.log('✅ ユーザー情報取得成功:', {
          name: data.user.name,
          hasProfile: !!data.user.profile,
          hasImage: !!data.user.profile?.image_48
        })
        setUserProfile(data.user)
      } else {
        console.error('❌ ユーザー情報取得失敗:', data.error)
      }
    } catch (error) {
      console.error('❌ ユーザー情報取得エラー:', error)
    }
  }, [])

  // 認証完了時にユーザー情報も取得
  useEffect(() => {
    if (authState.isAuthenticated && tokenInfo?.userToken && !userProfile) {
      fetchUserProfile(tokenInfo.userToken)
    }
  }, [authState.isAuthenticated, tokenInfo?.userToken, userProfile, fetchUserProfile])

  const setAuthError = useCallback((error: string | null) => {
    setAuthState(prev => ({ ...prev, error }))
  }, [])

  const setAuthLoading = useCallback((loading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  return {
    authState,
    tokenInfo,
    userProfile,
    login,
    logout,
    setAuthError,
    setAuthLoading
  }
}
