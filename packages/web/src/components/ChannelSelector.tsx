import React from 'react';

import { SlackChannel } from '../hooks/useSlackChannels';
import styles from '../styles/ChannelSelector.module.css';

interface ChannelSelectorProps {
  channels: SlackChannel[];
  selectedChannel: string;
  isLoading: boolean;
  onChannelChange: (channelId: string) => void;
  onRetry: () => void;
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  channels,
  selectedChannel,
  isLoading,
  onChannelChange,
  onRetry,
}) => (
  <div className={styles.channelSelector}>
    <label htmlFor='channel-select' className={styles.channelLabel}>
      📢 メッセージを投稿するチャンネル:
    </label>
    {isLoading ? (
      <div className={styles.loadingChannels}>
        <span className={styles.spinner} />
        チャンネル一覧を読み込み中...
      </div>
    ) : channels.length > 0 ? (
      <select
        id='channel-select'
        value={selectedChannel}
        onChange={(e) => onChannelChange(e.target.value)}
        className={styles.channelSelect}
      >
        <option value=''>チャンネルを選択してください</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            #{channel.name}
          </option>
        ))}
      </select>
    ) : (
      <div className={styles.channelError}>
        チャンネル一覧の取得に失敗しました
        <button onClick={onRetry} className={styles.retryButton}>
          再取得
        </button>
      </div>
    )}
  </div>
);

export default ChannelSelector;
