import { useCallback, useState } from 'react';

import { config } from '../config';
import { httpClient } from '../utils/httpClient';

export interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
  is_private?: boolean;
}

interface ChannelsApiResponse {
  success: boolean;
  channels: SlackChannel[];
  error?: string;
}

interface UseSlackChannelsReturn {
  channels: SlackChannel[];
  selectedChannel: string;
  isLoading: boolean;
  error: string | null;
  fetchChannels: (userToken: string) => Promise<void>;
  setSelectedChannel: (channelId: string) => void;
  clearChannels: () => void;
}

export const useSlackChannels = (): UseSlackChannelsReturn => {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async (userToken: string) => {
    if (!userToken) {
      console.log('❌ userTokenが提供されていません');
      return;
    }

    console.log('📡 チャンネル取得開始...', {
      userToken: `${userToken.slice(0, 20)}...`,
      url: `${config.SERVER_URL}/auth/channels`,
    });

    setIsLoading(true);
    setError(null);

    try {
      const data = await httpClient.get<ChannelsApiResponse>(`${config.SERVER_URL}/auth/channels?token=${userToken}`);

      console.log('📡 チャンネルAPI レスポンス:', data);

      if (data.success && data.channels) {
        console.log('✅ チャンネル取得成功:', `${data.channels.length}件`);
        setChannels(data.channels);

        // デフォルトでgeneralチャンネルを選択
        const generalChannel = data.channels.find((ch: SlackChannel) => ch.name === 'x_tk');
        if (generalChannel) {
          console.log('🏠 デフォルトチャンネル選択:', generalChannel.name);
          setSelectedChannel(generalChannel.id);
        } else if (data.channels.length > 0 && data.channels[0]) {
          console.log('🏠 最初のチャンネルを選択:', data.channels[0].name);
          setSelectedChannel(data.channels[0].id);
        }
      } else {
        console.error('❌ チャンネル取得エラー:', data.error);
        setError('チャンネル一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('❌ チャンネル取得エラー:', error);
      if (error instanceof Error) {
        console.error('エラー詳細:', error.message);
      }
      setError('チャンネル一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChannels = useCallback(() => {
    setChannels([]);
    setSelectedChannel('');
    setError(null);
  }, []);

  return {
    channels,
    selectedChannel,
    isLoading,
    error,
    fetchChannels,
    setSelectedChannel,
    clearChannels,
  };
};
