import { useEffect } from 'react';

import { useCurrentTime } from '../hooks/useCurrentTime';
import { useSlackAuth } from '../hooks/useSlackAuth';
import { useSlackChannels } from '../hooks/useSlackChannels';
import { useTimePunch } from '../hooks/useTimePunch';
import styles from '../styles/SlackAuthApp.module.css';

import ChannelSelector from './ChannelSelector';
import ErrorMessage from './ErrorMessage';
import TimePunchButtons from './TimePunchButtons';
import TokenExpiryInfo from './TokenExpiryInfo';
import UserProfile from './UserProfile';

/**
 * Tauri環境用のSlack認証アプリケーションコンポーネント
 * デスクトップアプリ特有の機能とUIを提供
 */
const TauriSlackApp = (): JSX.Element => {
  const { authState, tokenInfo, userProfile, login, logout, setAuthError, setAuthLoading } = useSlackAuth();
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
      <h1 className={styles.title}>Slack 出退勤打刻アプリ (Desktop)</h1>

      {!authState.isAuthenticated ? (
        <>
          <p className={styles.description}>
            Slackと連携して簡単に出退勤管理を行えます。
            <br />
            Slack認証を行って、出退勤の打刻を始めましょう！
          </p>

          <div className={styles.timeDisplay}>
            <div className={styles.currentTime}>{formattedTime}</div>
          </div>

          {/* 開発環境でのテスト機能 */}
          <TokenExpiryInfo userToken={null} />

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

          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🕘</div>
              <div className={styles.featureText}>
                <h3>出勤打刻</h3>
                <p>ワンクリックで出勤時間を記録</p>
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🏠</div>
              <div className={styles.featureText}>
                <h3>退勤打刻</h3>
                <p>簡単操作で退勤時間を記録</p>
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureText}>
                <h3>履歴管理</h3>
                <p>出退勤履歴をSlackで確認</p>
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🖥️</div>
              <div className={styles.featureText}>
                <h3>デスクトップアプリ</h3>
                <p>ネイティブアプリで快適操作</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <UserProfile userProfile={userProfile} isLoading={authState.isAuthenticated && !userProfile} />

          <TokenExpiryInfo userToken={tokenInfo?.userToken ?? null} />

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
        <p>© 2025 Slack 出退勤打刻アプリ (Desktop)</p>
      </div>
    </div>
  );
};

export default TauriSlackApp;
