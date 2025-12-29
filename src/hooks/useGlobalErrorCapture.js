import { useEffect, useState, useCallback } from 'react';

export const useGlobalErrorCapture = () => {
  const [latestError, setLatestError] = useState(null);

  const capture = useCallback((message, stack, context = {}) => {
    setLatestError({
      message,
      stack,
      context,
      at: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    const handleError = (event) => {
      capture(event.message, event.error?.stack || event.error?.toString?.(), {
        source: 'window.error',
      });
    };

    const handleRejection = (event) => {
      const reason = event.reason || {};
      capture(
        reason.message || reason.toString?.() || 'Unhandled rejection',
        reason.stack || null,
        { source: 'unhandledrejection' },
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [capture]);

  const clear = useCallback(() => setLatestError(null), []);

  return { latestError, capture, clear };
};
