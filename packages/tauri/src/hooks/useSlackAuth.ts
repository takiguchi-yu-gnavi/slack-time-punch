import type { SlackUserProfile, UserInfoApiResponse } from '@slack-time-punch/shared';
import { useCallback, useEffect, useState } from 'react';

import { config } from '../config';
import { slackAuthService } from '../services/slackAuth';
import type { AuthState, SlackAuthToken } from '../types/auth';
import { httpClient } from '../utils/httpClient';

// Tauri用の認証トークン情報
export interface AuthTokenInfo {
  userToken: string;
  botToken: string;
  teamId: string;
  userId: string;
}

interface UseSlackAuthReturn {
  authState: AuthState;
  tokenInfo: AuthTokenInfo | null;
  userProfile: SlackUserProfile | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthError: (error: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useSlackAuth = (): UseSlackAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAuthenticating: false,
    token: null,
    error: null,
  });
  const [tokenInfo, setTokenInfo] = useState<AuthTokenInfo | null>(null);
  const [userProfile, setUserProfile] = useState<SlackUserProfile | null>(null);

  /**
   * 初期化時に保存されたトークンをチェック
   */
  useEffect(() => {
    const checkStoredToken = async (): Promise<void> => {
      try {
        const token = await slackAuthService.getToken();
        if (token && slackAuthService.isTokenValid(token)) {
          setAuthState({
            isAuthenticated: true,
            isAuthenticating: false,
            token,
            error: null,
          });

          // TokenInfoを更新
          const tokenInfo: AuthTokenInfo = {
            userToken: token.access_token,
            botToken: token.access_token, // TODO: botトークンが別途必要な場合は調整
            teamId: token.team_id,
            userId: token.user_id,
          };
          setTokenInfo(tokenInfo);
        }
      } catch (error) {
        console.error('保存されたトークンの確認エラー:', error);
      }
    };

    void checkStoredToken();
  }, []);

  /**
   * Deep Linkイベントリスナーをセットアップ
   */
  useEffect(() => {
    const setupListener = async (): Promise<() => void> => {
      try {
        const unlisten = await slackAuthService.setupDeepLinkListener(
          (success: boolean, token?: SlackAuthToken, error?: string) => {
            if (success && token) {
              setAuthState({
                isAuthenticated: true,
                isAuthenticating: false,
                token,
                error: null,
              });

              // TokenInfoを更新
              const tokenInfo: AuthTokenInfo = {
                userToken: token.access_token,
                botToken: token.access_token, // TODO: botトークンが別途必要な場合は調整
                teamId: token.team_id,
                userId: token.user_id,
              };
              setTokenInfo(tokenInfo);
            } else {
              setAuthState({
                isAuthenticated: false,
                isAuthenticating: false,
                token: null,
                error: error ?? '認証に失敗しました',
              });
            }
          }
        );

        return unlisten;
      } catch (error) {
        console.error('Deep Linkリスナーのセットアップエラー:', error);
        return (): void => {
          // 空の関数を返す（リスナーが設定されていない場合）
        };
      }
    };

    const unlistenPromise = setupListener();

    return (): void => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // ユーザー情報を取得
  const fetchUserProfile = useCallback(async (userToken: string): Promise<void> => {
    try {
      const result = await httpClient.post<UserInfoApiResponse>(`${config.SERVER_URL}/auth/user-info`, { userToken });

      if (result.success && result.user) {
        setUserProfile(result.user);
      } else {
        throw new Error(result.error ?? 'ユーザー情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました',
      }));
    }
  }, []);

  // トークン情報が更新された時にユーザー情報を取得
  useEffect(() => {
    if (tokenInfo?.userToken && !userProfile) {
      void fetchUserProfile(tokenInfo.userToken);
    }
  }, [tokenInfo, userProfile, fetchUserProfile]);

  /**
   * 認証を開始する
   */
  const login = useCallback(async (): Promise<void> => {
    try {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticating: true,
        error: null,
      }));

      await slackAuthService.startAuth();

      // 認証URLが開かれた後、ユーザーがブラウザで認証を完了するまで待機
      // 実際の状態更新はDeep Linkコールバックで行われる
    } catch (error) {
      console.error('認証開始エラー:', error);
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        token: null,
        error: error instanceof Error ? error.message : '認証の開始に失敗しました',
      });
    }
  }, []);

  /**
   * ログアウトする
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await slackAuthService.clearToken();
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        token: null,
        error: null,
      });
      setTokenInfo(null);
      setUserProfile(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // ログアウトエラーは状態をリセットするが、エラーは設定しない
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        token: null,
        error: null,
      });
      setTokenInfo(null);
      setUserProfile(null);
    }
  }, []);

  const setAuthError = useCallback((error: string | null): void => {
    setAuthState((prev) => ({ ...prev, error }));
  }, []);

  const setAuthLoading = useCallback((loading: boolean): void => {
    setAuthState((prev) => ({ ...prev, isAuthenticating: loading }));
  }, []);

  return {
    authState,
    tokenInfo,
    userProfile,
    login,
    logout,
    setAuthError,
    setAuthLoading,
  };
};
