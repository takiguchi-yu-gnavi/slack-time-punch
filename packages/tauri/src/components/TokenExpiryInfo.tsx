import type { TokenInfoApiResponse } from '@slack-time-punch/shared';
import { useEffect, useState } from 'react';

import { config } from '../config';
import styles from '../styles/TokenExpiryInfo.module.css';
import { httpClient } from '../utils/httpClient';

interface TokenExpiryInfoProps {
  userToken: string | null;
}

interface TokenExpiryData {
  expires_in_seconds?: number;
  expires_in_hours?: number;
  expires_in_days?: number;
  expiration_date?: string;
  expiration_date_local?: string;
  remaining_time?: string;
  is_permanent?: boolean; // 永続的なトークンかどうか
}

const TokenExpiryInfo = ({ userToken }: TokenExpiryInfoProps): JSX.Element | null => {
  const [expiryInfo, setExpiryInfo] = useState<TokenExpiryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userToken) {
      setExpiryInfo(null);
      return;
    }

    const fetchExpiryInfo = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await httpClient.get<TokenInfoApiResponse>(
          `${config.SERVER_URL}/auth/user-info?token=${userToken}`
        );

        if (data.success && data.token_info) {
          setExpiryInfo(data.token_info);
        } else {
          // token_infoが存在しない場合は、永続的なトークンとして扱う
          setExpiryInfo({ is_permanent: true });
        }
      } catch (err) {
        console.error('トークン有効期限情報の取得に失敗:', err);
        setError('有効期限情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchExpiryInfo();
  }, [userToken]);

  if (!userToken) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>有効期限情報を確認中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>⚠️ {error}</div>
      </div>
    );
  }

  if (!expiryInfo) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.tokenInfo}>
        <div className={styles.tokenStatus}>
          {expiryInfo.is_permanent ? (
            <div className={styles.permanent}>
              <span className={styles.statusIcon}>✅</span>
              <span>トークンは永続的です</span>
            </div>
          ) : (
            <div className={styles.expiring}>
              <span className={styles.statusIcon}>⏰</span>
              <span>残り時間: {expiryInfo.remaining_time ?? `${expiryInfo.expires_in_hours ?? 0}時間`}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenExpiryInfo;
