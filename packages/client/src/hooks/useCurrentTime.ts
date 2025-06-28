import { useEffect, useState } from 'react';

type UseCurrentTimeReturn = {
  currentTime: Date;
  formattedTime: string;
};

export const useCurrentTime = (): UseCurrentTimeReturn => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
