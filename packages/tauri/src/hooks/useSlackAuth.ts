import type { SlackUserProfile, UserInfoApiResponse } from '@slack-time-punch/shared';
import { useCallback, useEffect, useState } from 'react';

import { config } from '../config';
import { slackAuthService } from '../services/slackAuth';
import type { AuthState, SlackAuthToken } from '../types/auth';
import { logToRust } from '../utils/debug';
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
        console.log('🔍 保存されたトークンを確認中...');
        void logToRust('🔍 [useSlackAuth] 保存されたトークンを確認中...');

        const token = await slackAuthService.getToken();
        console.log('🔍 取得したトークン:', token);

        if (token && slackAuthService.isTokenValid(token)) {
          console.log('✅ 有効なトークンが見つかりました');
          void logToRust('✅ [useSlackAuth] 有効なトークンが見つかりました');

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
          console.log('🔑 初期化時にトークン情報を設定しました:', tokenInfo);
          void logToRust(`🔑 [useSlackAuth] 初期化時にトークン情報を設定: teamId=${tokenInfo.teamId}`);
        } else {
          console.log('❌ 有効なトークンが見つかりませんでした');
          void logToRust('❌ [useSlackAuth] 有効なトークンが見つかりませんでした');

          if (token) {
            console.log('📅 トークンの有効性チェック結果:', slackAuthService.isTokenValid(token));
          }
        }
      } catch (error) {
        console.error('保存されたトークンの確認エラー:', error);
        void logToRust(`❌ [useSlackAuth] 保存されたトークンの確認エラー: ${String(error)}`);
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
            console.log('🔗 Deep Linkコールバック受信:', { success, token, error });

            if (success && token) {
              console.log('✅ 認証成功 - 状態を更新中...');

              // まずトークンをストアに保存
              void (async (): Promise<void> => {
                try {
                  await slackAuthService.saveToken(token);
                  console.log('💾 トークンをストアに保存しました');
                } catch (error) {
                  console.error('❌ トークン保存エラー:', error);
                }
              })();

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
              console.log('🔑 トークン情報を更新しました:', tokenInfo);
            } else {
              console.log('❌ 認証失敗 - エラー状態を設定中...');
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
      console.log('👤 ユーザー情報取得開始...', {
        userToken: `${userToken.slice(0, 20)}...`,
        url: `${config.SERVER_URL}/auth/user-info`,
      });

      const result = await httpClient.post<UserInfoApiResponse>(`${config.SERVER_URL}/auth/user-info`, { userToken });

      console.log('👤 ユーザー情報API レスポンス:', result);

      if (result.success && result.user) {
        console.log('✅ ユーザー情報取得成功:', result.user);
        setUserProfile(result.user);
      } else {
        console.error('❌ ユーザー情報取得失敗:', result.error);
        throw new Error(result.error ?? 'ユーザー情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('❌ ユーザー情報取得エラー:', error);
      if (error instanceof Error) {
        console.error('エラー詳細:', error.message);
        console.error('エラースタック:', error.stack);
      }
      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました',
      }));
    }
  }, []);

  // トークン情報が更新された時にユーザー情報を取得
  useEffect(() => {
    console.log('🔄 トークン情報useEffect実行:', {
      hasTokenInfo: !!tokenInfo,
      userToken: tokenInfo?.userToken ? `${tokenInfo.userToken.slice(0, 20)}...` : 'none',
      hasUserProfile: !!userProfile,
    });

    if (tokenInfo?.userToken && !userProfile) {
      console.log('📞 ユーザー情報取得を開始します...');
      void fetchUserProfile(tokenInfo.userToken);
    } else if (!tokenInfo?.userToken) {
      console.log('⚠️ トークンが見つかりません');
    } else if (userProfile) {
      console.log('ℹ️ ユーザー情報は既に取得済みです');
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
