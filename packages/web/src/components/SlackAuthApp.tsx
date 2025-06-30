import { useEffect } from 'react';

import { useCurrentTime } from '../hooks/useCurrentTime';
import { useSlackAuth } from '../hooks/useSlackAuth';
import { useSlackChannels } from '../hooks/useSlackChannels';
import { useTimePunch } from '../hooks/useTimePunch';
import styles from '../styles/SlackAuthApp.module.css';

import ChannelSelector from './ChannelSelector';
import ErrorMessage from './ErrorMessage';
import TimePunchButtons from './TimePunchButtons';

function SlackAuthApp(): JSX.Element {
  const { authState, tokenInfo, login, logout, setAuthError, setAuthLoading } = useSlackAuth();
  const {
    channels,
    selectedChannel,
    isLoading: isLoadingChannels,
    error: channelsError,
    fetchChannels,
    setSelectedChannel,
    clearChannels,
  } = useSlackChannels();
  const { formattedTime } = useCurrentTime();
  const { timePunch } = useTimePunch(setAuthLoading, setAuthError);

  // 認証状態が変わった時にチャンネルを取得
  useEffect(() => {
    if (authState.isAuthenticated && tokenInfo?.userToken && channels.length === 0) {
      void fetchChannels(tokenInfo.userToken);
    }
  }, [authState.isAuthenticated, tokenInfo?.userToken, channels.length, fetchChannels]);

  const handleLogout = (): void => {
    clearChannels();
    logout();
  };

  const handleTimePunch = async (type: 'in' | 'out'): Promise<void> => {
    if (tokenInfo?.userToken && selectedChannel) {
      await timePunch(type, tokenInfo.userToken, selectedChannel);
    }
  };

  const handleRetryChannels = (): void => {
    if (tokenInfo?.userToken) {
      void fetchChannels(tokenInfo.userToken);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>⏰</div>
      <h1 className={styles.title}>Slack 出退勤打刻アプリ</h1>

      {!authState.isAuthenticated ? (
        <>
          <div className={styles.timeDisplay}>
            <div className={styles.currentTime}>{formattedTime}</div>
          </div>

          {authState.error && <ErrorMessage error={authState.error} onDismiss={() => setAuthError(null)} />}

          <div className={styles.buttonContainer}>
            <button onClick={login} disabled={authState.isLoading} className={styles.slackButton}>
              {authState.isLoading ? (
                <>
                  <span className={styles.spinner} />
                  認証中...
                </>
              ) : (
                <>
                  <span className={styles.slackIcon}>💬</span>
                  Slackで認証
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.description}>
            認証が完了しました！
            <br />
            チャンネルを選択して出退勤の打刻を行えます。
          </p>

          <div className={styles.timeDisplay}>
            <div className={styles.currentTime}>{formattedTime}</div>
          </div>

          <ChannelSelector
            channels={channels}
            selectedChannel={selectedChannel}
            isLoading={isLoadingChannels}
            onChannelChange={setSelectedChannel}
            onRetry={handleRetryChannels}
          />

          {(authState.error ?? channelsError) && (
            <ErrorMessage error={authState.error ?? channelsError ?? ''} onDismiss={() => setAuthError(null)} />
          )}

          <TimePunchButtons
            isLoading={authState.isLoading}
            isDisabled={!selectedChannel}
            onTimePunch={(type: 'in' | 'out') => void handleTimePunch(type)}
          />

          <div className={styles.logoutContainer}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              ログアウト
            </button>
          </div>
        </>
      )}

      <div className={styles.footer}>
        <p>© 2025 Slack 出退勤打刻アプリ</p>
      </div>
    </div>
  );
}

export default SlackAuthApp;
