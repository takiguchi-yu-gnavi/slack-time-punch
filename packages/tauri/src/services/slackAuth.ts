import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { openUrl } from '@tauri-apps/plugin-opener';
import { load } from '@tauri-apps/plugin-store';

import { config } from '../config';
import type { SlackAuthToken } from '../types/auth';

/**
 * 認証用のストアキー
 */
const AUTH_STORE_KEY = 'slack_auth_token';

/**
 * Slack OAuth認証サービス
 * TODO: Tauri v2の正しいAPIを使用して実装する
 */
export class SlackAuthService {
  /**
   * Slack OAuth認証を開始する
   * Lambda関数の認証エンドポイントをブラウザで開く
   */
  startAuth = async (): Promise<void> => {
    try {
      const authUrl = config.LAMBDA_AUTH_URL;
      const redirectUri = 'slack-time-punch://auth/callback';

      // 認証URLにリダイレクトURIを含めて構築
      const fullAuthUrl = `${authUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;

      console.log('認証URLを開いています:', fullAuthUrl);

      // Tauri v2のオープナープラグインを使用してブラウザで開く
      await openUrl(fullAuthUrl);

      console.log('認証URLを開きました');
    } catch (error) {
      console.error('認証開始エラー:', error);
      throw new Error('認証の開始に失敗しました');
    }
  };

  /**
   * Deep Linkリスナーをセットアップする
   * 認証完了後のコールバックを受け取る
   */
  setupDeepLinkListener = async (
    onAuthResult: (success: boolean, token?: SlackAuthToken, error?: string) => void
  ): Promise<() => void> => {
    try {
      console.log('Deep Linkリスナーを設定中...');

      // Tauri v2のディープリンクプラグインを使用
      const unlisten = await onOpenUrl((urls: string[]) => {
        console.log('Deep Link受信:', urls);
        console.log('受信したURL数:', urls.length);

        for (const url of urls) {
          console.log('処理中のURL:', url);
          if (url.startsWith('slack-time-punch://auth/callback')) {
            console.log('認証コールバックURLを検出:', url);
            this.handleAuthCallback(url, onAuthResult);
            break;
          } else {
            console.log('認証コールバックではないURL:', url);
          }
        }
      });

      console.log('Deep Linkリスナーが設定されました');
      return unlisten;
    } catch (error) {
      console.error('Deep Linkリスナーのセットアップエラー:', error);
      onAuthResult(false, undefined, 'Deep Linkリスナーの設定に失敗しました');
      return () => {
        // 空の関数を返す（リスナーが設定されていない場合）
      };
    }
  };

  /**
   * 認証コールバックを処理する
   */
  private handleAuthCallback = (
    url: string,
    onAuthResult: (success: boolean, token?: SlackAuthToken, error?: string) => void
  ): void => {
    try {
      console.log('処理中のURL:', url);
      const urlObj = new URL(url);
      const searchParams = urlObj.searchParams;

      console.log('受信したパラメーター:', Object.fromEntries(searchParams.entries()));

      // エラーがある場合
      if (searchParams.has('error')) {
        const error = searchParams.get('error');
        console.error('認証エラー:', error);
        onAuthResult(false, undefined, `認証エラー: ${error}`);
        return;
      }

      // auth=successの場合の処理
      const authStatus = searchParams.get('auth');
      if (authStatus === 'success') {
        // tokenパラメーターからJSONを取得
        const tokenParam = searchParams.get('token');
        if (!tokenParam) {
          console.error('tokenパラメーターが見つかりません');
          onAuthResult(false, undefined, 'tokenパラメーターが見つかりません');
          return;
        }

        try {
          // Base64デコードしてJSONパースを試行
          const decodedToken = atob(tokenParam);
          const tokenData = JSON.parse(decodedToken) as Record<string, unknown>;

          console.log('デコードされたトークンデータ:', tokenData);

          // 型安全なアクセスのためのヘルパー関数
          const getString = (key: string): string => {
            const value = tokenData[key];
            return typeof value === 'string' ? value : '';
          };

          // トークンオブジェクトを作成
          const token: SlackAuthToken = {
            access_token: getString('userToken') || getString('access_token'),
            scope: getString('scope'),
            team_id: getString('teamId') || getString('team_id'),
            team_name: getString('teamName') || getString('team_name'),
            user_id: getString('userId') || getString('user_id'),
            user_name: getString('userName') || getString('user_name'),
          };

          console.log('🎉 認証成功！トークンを取得しました:', token);
          console.log('📞 onAuthResultコールバックを呼び出し中...');
          onAuthResult(true, token);
          console.log('✅ onAuthResultコールバック呼び出し完了');
          return;
        } catch (parseError) {
          console.error('❌ トークンのパース失敗:', parseError);
          console.log('📞 onAuthResultエラーコールバックを呼び出し中...');
          onAuthResult(false, undefined, 'トークンの解析に失敗しました');
          console.log('✅ onAuthResultエラーコールバック呼び出し完了');
          return;
        }
      }

      // 従来の形式での処理（フォールバック）
      const accessToken = searchParams.get('access_token');
      const scope = searchParams.get('scope');
      const teamId = searchParams.get('team_id');
      const teamName = searchParams.get('team_name');
      const userId = searchParams.get('user_id');
      const userName = searchParams.get('user_name');

      if (!accessToken) {
        console.error('❌ アクセストークンが見つかりません');
        console.log('📞 onAuthResultエラーコールバックを呼び出し中...');
        onAuthResult(false, undefined, 'アクセストークンが見つかりません');
        console.log('✅ onAuthResultエラーコールバック呼び出し完了');
        return;
      }

      // トークンオブジェクトを作成
      const token: SlackAuthToken = {
        access_token: accessToken,
        scope: scope ?? '',
        team_id: teamId ?? '',
        team_name: teamName ?? '',
        user_id: userId ?? '',
        user_name: userName ?? '',
      };

      console.log('🎉 フォールバック形式で認証成功！トークンを取得しました');
      console.log('📞 onAuthResultコールバックを呼び出し中...');
      onAuthResult(true, token);
      console.log('✅ onAuthResultコールバック呼び出し完了');
    } catch (error) {
      console.error('❌ 認証コールバック処理エラー:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      console.log('📞 onAuthResultエラーコールバックを呼び出し中...');
      onAuthResult(false, undefined, `認証コールバック処理エラー: ${message}`);
      console.log('✅ onAuthResultエラーコールバック呼び出し完了');
    }
  };

  /**
   * トークンをストアに保存する
   */
  saveToken = async (token: SlackAuthToken): Promise<void> => {
    try {
      // Tauri v2のストアプラグインを使用
      const store = await load('auth.json', { autoSave: true });
      await store.set(AUTH_STORE_KEY, token);
      await store.save();
      console.log('トークン保存完了（Tauriストア）');
    } catch (error) {
      console.error('トークン保存エラー:', error);
      throw new Error('トークンの保存に失敗しました');
    }
  };

  /**
   * 保存されたトークンを取得する
   */
  getToken = async (): Promise<SlackAuthToken | null> => {
    try {
      // Tauri v2のストアプラグインを使用
      const store = await load('auth.json', { autoSave: true });
      const token = await store.get<SlackAuthToken>(AUTH_STORE_KEY);
      return token ?? null;
    } catch (error) {
      console.error('トークン取得エラー:', error);
      return null;
    }
  };

  /**
   * トークンを削除する（ログアウト）
   */
  clearToken = async (): Promise<void> => {
    try {
      // Tauri v2のストアプラグインを使用
      const store = await load('auth.json', { autoSave: true });
      await store.delete(AUTH_STORE_KEY);
      await store.save();
      console.log('トークン削除完了（Tauriストア）');
    } catch (error) {
      console.error('トークン削除エラー:', error);
      throw new Error('トークンの削除に失敗しました');
    }
  };

  /**
   * トークンの有効性をチェックする
   */
  isTokenValid = (token: SlackAuthToken): boolean => {
    console.log('🔍 トークンの有効性をチェック中...', token);

    if (!token.access_token) {
      console.log('❌ アクセストークンが見つかりません');
      return false;
    }

    // 有効期限がある場合はチェック
    if (token.expires_at) {
      const now = Date.now() / 1000;
      const isValid = now < token.expires_at;
      console.log(`⏰ 有効期限チェック: now=${now}, expires_at=${token.expires_at}, valid=${isValid}`);
      return isValid;
    }

    console.log('✅ トークンは有効です（有効期限の設定なし）');
    return true;
  };

  /**
   * デバッグ用：Deep Linkコールバックを手動でテストする
   */
  testDeepLinkCallback = (
    url: string,
    onAuthResult: (success: boolean, token?: SlackAuthToken, error?: string) => void
  ): void => {
    console.log('🧪 デバッグ用Deep Linkテスト開始:', url);
    this.handleAuthCallback(url, onAuthResult);
  };
}

// シングルトンインスタンス
export const slackAuthService = new SlackAuthService();
