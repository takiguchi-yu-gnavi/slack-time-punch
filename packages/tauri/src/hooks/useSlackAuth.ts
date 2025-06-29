import type { SlackUserProfile, UserInfoApiResponse } from '@slack-time-punch/shared';
import { useCallback, useEffect, useState } from 'react';

import { config } from '../config';

// Tauri用の認証トークン情報
export interface AuthTokenInfo {
  userToken: string;
  botToken: string;
  teamId: string;
  userId: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseSlackAuthReturn {
  authState: AuthState;
  tokenInfo: AuthTokenInfo | null;
  userProfile: SlackUserProfile | null;
  login: () => void;
  logout: () => void;
  setAuthError: (error: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useSlackAuth = (): UseSlackAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  const [tokenInfo, setTokenInfo] = useState<AuthTokenInfo | null>(null);
  const [userProfile, setUserProfile] = useState<SlackUserProfile | null>(null);

  // 認証状態をチェック
  const checkAuthState = useCallback((): void => {
    console.log('認証状態チェック開始...');

    const storedTokenInfo = localStorage.getItem('slackTokenInfo');
    if (storedTokenInfo) {
      try {
        const parsedTokenInfo = JSON.parse(storedTokenInfo) as AuthTokenInfo;
        setTokenInfo(parsedTokenInfo);
        setAuthState((prev) => ({ ...prev, isAuthenticated: true }));
        console.log('認証状態を復元しました');
      } catch (error) {
        console.error('トークン情報の解析に失敗:', error);
        localStorage.removeItem('slackTokenInfo');
      }
    }
  }, []);

  // ユーザー情報を取得
  const fetchUserProfile = useCallback(async (userToken: string): Promise<void> => {
    try {
      const response = await fetch(`${config.SERVER_URL}/auth/user-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as UserInfoApiResponse;
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

  // 初期化
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // トークン情報が更新された時にユーザー情報を取得
  useEffect(() => {
    if (tokenInfo?.userToken && !userProfile) {
      void fetchUserProfile(tokenInfo.userToken);
    }
  }, [tokenInfo, userProfile, fetchUserProfile]);

  const login = useCallback((): void => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    // 現在は簡単化のため、手動でのテスト認証を提供
    // 実際の実装では、Tauriのディープリンクやローカルサーバーを使用
    const authUrl = `${config.SERVER_URL}/auth/slack`;
    console.log('認証URL:', authUrl);

    // テスト用のダミートークン（実際の実装では削除）
    setTimeout(() => {
      const dummyTokenInfo: AuthTokenInfo = {
        userToken: 'test-user-token',
        botToken: 'test-bot-token',
        teamId: 'test-team-id',
        userId: 'test-user-id',
      };

      localStorage.setItem('slackTokenInfo', JSON.stringify(dummyTokenInfo));
      setTokenInfo(dummyTokenInfo);
      setAuthState((prev) => ({ ...prev, isAuthenticated: true, isLoading: false }));
      console.log('テスト認証完了');
    }, 1000);
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem('slackTokenInfo');
    setTokenInfo(null);
    setUserProfile(null);
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    console.log('ログアウトしました');
  }, []);

  const setAuthError = useCallback((error: string | null): void => {
    setAuthState((prev) => ({ ...prev, error }));
  }, []);

  const setAuthLoading = useCallback((loading: boolean): void => {
    setAuthState((prev) => ({ ...prev, isLoading: loading }));
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
