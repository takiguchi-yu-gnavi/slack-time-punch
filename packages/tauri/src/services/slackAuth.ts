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

        for (const url of urls) {
          if (url.startsWith('slack-time-punch://auth/callback')) {
            this.handleAuthCallback(url, onAuthResult);
            break;
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
      const urlObj = new URL(url);
      const searchParams = urlObj.searchParams;

      // エラーがある場合
      if (searchParams.has('error')) {
        const error = searchParams.get('error');
        console.error('認証エラー:', error);
        onAuthResult(false, undefined, `認証エラー: ${error}`);
        return;
      }

      // トークンを取得
      const accessToken = searchParams.get('access_token');
      const scope = searchParams.get('scope');
      const teamId = searchParams.get('team_id');
      const teamName = searchParams.get('team_name');
      const userId = searchParams.get('user_id');
      const userName = searchParams.get('user_name');

      if (!accessToken) {
        console.error('アクセストークンが見つかりません');
        onAuthResult(false, undefined, 'アクセストークンが見つかりません');
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

      console.log('認証成功！トークンを取得しました');
      onAuthResult(true, token);
    } catch (error) {
      console.error('認証コールバック処理エラー:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      onAuthResult(false, undefined, `認証コールバック処理エラー: ${message}`);
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
    if (!token.access_token) {
      return false;
    }

    // 有効期限がある場合はチェック
    if (token.expires_at) {
      const now = Date.now() / 1000;
      return now < token.expires_at;
    }

    return true;
  };
}

// シングルトンインスタンス
export const slackAuthService = new SlackAuthService();
