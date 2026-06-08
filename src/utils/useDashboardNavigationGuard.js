import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useDashboardNavigationGuard({ enabled = true, message = 'You have unsaved dashboard context. Leave this page?' } = {}) {
  const navigate = useNavigate();
  const hasPushedStateRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    if (!hasPushedStateRef.current) {
      window.history.pushState({ dashboardGuard: true }, '');
      hasPushedStateRef.current = true;
    }

    const handlePopState = () => {
      const shouldLeave = window.confirm(message);
      if (!shouldLeave) {
        window.history.pushState({ dashboardGuard: true }, '');
        return;
      }

      hasPushedStateRef.current = false;
      setTimeout(() => navigate(-1), 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled, message, navigate]);
}
