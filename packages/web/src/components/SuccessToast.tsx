import React, { useEffect } from 'react';

import styles from '../styles/SuccessToast.module.css';

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message, isVisible, onDismiss, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return (): void => clearTimeout(timer);
    }
  }, [isVisible, onDismiss, duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.toast}>
      <div className={styles.content}>
        <span className={styles.icon}>✅</span>
        <span className={styles.message}>{message}</span>
        <button onClick={onDismiss} className={styles.closeButton} aria-label='閉じる'>
          ×
        </button>
      </div>
    </div>
  );
};

export default SuccessToast;
