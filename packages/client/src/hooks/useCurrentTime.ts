import { useEffect, useState } from 'react';

interface UseCurrentTimeReturn {
  currentTime: Date;
  formattedTime: string;
}

export const useCurrentTime = (): UseCurrentTimeReturn => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect((): (() => void) => {
    const timer = setInterval((): void => {
      setCurrentTime(new Date());
    }, 1000);

    return (): void => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    currentTime,
    formattedTime,
  };
};
