import React from 'react';
import styles from '../styles/TimePunchButtons.module.css';

type TimePunchButtonsProps = {
  isLoading: boolean;
  isDisabled: boolean;
  onTimePunch: (type: 'in' | 'out') => void;
};

const TimePunchButtons: React.FC<TimePunchButtonsProps> = ({
  isLoading,
  isDisabled,
  onTimePunch,
}) => (
  <div className={styles.punchButtons}>
    <button
      onClick={() => onTimePunch('in')}
      disabled={isLoading || isDisabled}
      className={`${styles.punchButton} ${styles.punchInButton} ${isDisabled ? styles.disabled : ''}`}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner}></span>
          投稿中...
        </>
      ) : (
        <>🟢 出勤</>
      )}
    </button>

    <button
      onClick={() => onTimePunch('out')}
      disabled={isLoading || isDisabled}
      className={`${styles.punchButton} ${styles.punchOutButton} ${isDisabled ? styles.disabled : ''}`}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner}></span>
          投稿中...
        </>
      ) : (
        <>🔴 退勤</>
      )}
    </button>
  </div>
);

export default TimePunchButtons;
