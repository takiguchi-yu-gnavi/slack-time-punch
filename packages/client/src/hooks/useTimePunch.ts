import { useCallback } from 'react';

import { config } from '../config';

interface PostMessageApiResponse {
  success?: boolean;
  error?: string;
}

interface UseTimePunchReturn {
  timePunch: (type: 'in' | 'out', userToken: string, channelId: string) => Promise<void>;
}

export const useTimePunch = (
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): UseTimePunchReturn => {
  const timePunch = useCallback(
    async (type: 'in' | 'out', userToken: string, channelId: string) => {
      if (!userToken || !channelId) {
        setError('認証情報またはチャンネルが選択されていません');
        return;
      }

      setLoading(true);
      setError(null);

      const message = type === 'in' ? '🟢 おはようございます。業務開始します。' : '🔴 お疲れさまです。業務終了します。';

      try {
        const response = await fetch(`${config.SERVER_URL}/auth/post-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userToken,
            channelId,
            message,
          }),
        });

        if (response.ok) {
          setLoading(false);
          console.log(`${type === 'in' ? '出勤' : '退勤'}打刻が完了しました`);
        } else {
          const errorData = (await response.json()) as PostMessageApiResponse;
          throw new Error(errorData.error ?? 'メッセージの投稿に失敗しました');
        }
      } catch (error) {
        setLoading(false);
        setError(error instanceof Error ? error.message : 'メッセージの投稿に失敗しました');
      }
    },
    [setLoading, setError]
  );

  return { timePunch };
};
