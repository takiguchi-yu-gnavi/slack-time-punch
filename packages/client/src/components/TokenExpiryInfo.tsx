import { useEffect, useState } from 'react'
import { config } from '../config'
import styles from '../styles/TokenExpiryInfo.module.css'

interface TokenExpiryInfoProps {
  userToken: string | null
}

interface TokenExpiryData {
  expires_in_seconds?: number
  expires_in_hours?: number
  expires_in_days?: number
  expiration_date?: string
  expiration_date_local?: string
  remaining_time?: string
  is_permanent?: boolean // 永続的なトークンかどうか
}

const TokenExpiryInfo = ({ userToken }: TokenExpiryInfoProps) => {
  const [expiryInfo, setExpiryInfo] = useState<TokenExpiryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setTestMode] = useState<'permanent' | 'expiring' | null>(null)

  useEffect(() => {
    if (!userToken) {
      setExpiryInfo(null)
      return
    }

    const fetchExpiryInfo = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`${config.SERVER_URL}/auth/user-info?token=${userToken}`)
        const data = await response.json()
        
        if (data.success && data.token_info) {
          setExpiryInfo(data.token_info)
        } else {
          // token_infoが存在しない場合は、永続的なトークンとして扱う
          setExpiryInfo({ is_permanent: true })
        }
      } catch (err) {
        console.error('トークン有効期限情報の取得に失敗:', err)
        setError('有効期限情報の取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpiryInfo()
  }, [userToken])

  const handleTestPermanent = async () => {
    setTestMode('permanent')
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${config.SERVER_URL}/auth/mock-user-info?type=permanent`)
      const data = await response.json()
      
      if (data.success && data.token_info) {
        setExpiryInfo(data.token_info)
      }
    } catch (err) {
      console.error('永続トークンテストに失敗:', err)
      setError('テストに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestExpiring = async () => {
    setTestMode('expiring')
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${config.SERVER_URL}/auth/mock-user-info?type=expiring`)
      const data = await response.json()
      
      if (data.success && data.token_info) {
        setExpiryInfo(data.token_info)
      }
    } catch (err) {
      console.error('有効期限付きトークンテストに失敗:', err)
      setError('テストに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!userToken || isLoading) {
    // 開発用：テスト機能を表示
    if (process.env.NODE_ENV === 'development' && !userToken) {
      return (
        <div className={styles.container}>
          <div className={styles.header}>
            <span className={styles.icon}>🧪</span>
            <span className={styles.title}>トークン有効期限テスト</span>
          </div>
          
          <div className={styles.testButtons}>
            <button onClick={handleTestPermanent} className={styles.testButton}>
              永続トークンをテスト
            </button>
            <button onClick={handleTestExpiring} className={styles.testButton}>
              有効期限付きトークンをテスト
            </button>
          </div>
        </div>
      )
    }
    
    return null
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      </div>
    )
  }

  if (!expiryInfo) {
    return null
  }

  // 永続的なトークンの場合
  if (expiryInfo.is_permanent) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.icon}>♾️</span>
          <span className={styles.title}>認証トークン状態</span>
        </div>
        
        <div className={styles.details}>
          <div className={styles.permanentInfo}>
            <strong>永続的なトークン</strong>
          </div>
          <div className={styles.permanentDescription}>
            このトークンは有効期限がありません。<br />
            手動で取り消すか、アプリを削除するまで有効です。
          </div>
        </div>
      </div>
    )
  }

  // 有効期限が設定されているトークンの場合
  if (!expiryInfo.expires_in_hours) {
    return null
  }

  // 有効期限が近い場合の警告表示
  const isExpiringSoon = expiryInfo.expires_in_hours < 24
  const isExpiringVerySOON = expiryInfo.expires_in_hours < 1

  return (
    <div className={`${styles.container} ${isExpiringVerySOON ? styles.critical : isExpiringSoon ? styles.warning : ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>
          {isExpiringVerySOON ? '🚨' : isExpiringSoon ? '⚠️' : '🕐'}
        </span>
        <span className={styles.title}>認証トークン有効期限</span>
      </div>
      
      <div className={styles.details}>
        <div className={styles.remainingTime}>
          残り: <strong>{expiryInfo.remaining_time}</strong>
        </div>
        <div className={styles.expirationDate}>
          有効期限: {expiryInfo.expiration_date_local}
        </div>
        
        {isExpiringSoon && (
          <div className={styles.warningMessage}>
            {isExpiringVerySOON 
              ? '認証の有効期限が1時間を切りました！' 
              : '認証の有効期限が24時間以内です。'}
          </div>
        )}
      </div>
    </div>
  )
}

export default TokenExpiryInfo
