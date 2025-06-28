import type { SlackUserProfile } from '@slack-time-punch/shared';

import styles from '../styles/UserProfile.module.css';

interface UserProfileProps {
  userProfile: SlackUserProfile | null;
  isLoading?: boolean;
}

const UserProfile = ({ userProfile, isLoading = false }: UserProfileProps): JSX.Element | null => {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>ユーザー情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  const displayName = userProfile.profile?.display_name ?? userProfile.profile?.real_name ?? userProfile.name;
  const profileImage = userProfile.profile?.image_72 ?? userProfile.profile?.image_48 ?? userProfile.profile?.image_32;

  return (
    <div className={styles.container}>
      <div className={styles.userInfo}>
        <div className={styles.avatarContainer}>
          {profileImage ? (
            <img
              src={profileImage}
              alt={`${displayName}のプロフィール画像`}
              className={styles.avatar}
              onError={(e) => {
                // 画像読み込みエラーの場合はデフォルトアイコンを表示
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector(`.${styles.avatarFallback}`);
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }
              }}
            />
          ) : null}
          <div className={styles.avatarFallback} style={{ display: profileImage ? 'none' : 'flex' }}>
            👤
          </div>
        </div>

        <div className={styles.userDetails}>
          <div className={styles.userName}>{displayName}</div>
          <div className={styles.teamName}>{userProfile.team_name}</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
