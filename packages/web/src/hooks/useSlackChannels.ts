import { useCallback, useState } from 'react';

import { config } from '../config';

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
    if (!userToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.SERVER_URL}/auth/channels?token=${userToken}`);
      const data = (await response.json()) as ChannelsApiResponse;

      if (data.success && data.channels) {
        console.log('チャンネル取得成功:', `${data.channels.length}件`);
        setChannels(data.channels);

        // デフォルトでgeneralチャンネルを選択
        const generalChannel = data.channels.find((ch: SlackChannel) => ch.name === 'org_restaurant_service_dev');
        if (generalChannel) {
          setSelectedChannel(generalChannel.id);
        } else if (data.channels.length > 0) {
          setSelectedChannel(data.channels[0].id);
        }
      } else {
        console.error('チャンネル取得エラー:', data.error);
        setError('チャンネル一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('チャンネル取得エラー:', error);
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
