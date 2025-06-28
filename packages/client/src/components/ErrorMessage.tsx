import React from 'react';
import styles from '../styles/ErrorMessage.module.css';

type ErrorMessageProps = {
  error: string;
  onDismiss?: () => void;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => (
  <div className={styles.error}>
    <span className={styles.errorText}>❌ {error}</span>
    {onDismiss && (
      <button onClick={onDismiss} className={styles.dismissButton}>
        ✕
      </button>
    )}
  </div>
);

export default ErrorMessage;
