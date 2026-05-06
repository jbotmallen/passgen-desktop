import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { getVaultSettings } from '@/lib/settings';
import { logError } from '@/utils/logger';

interface AutoLockHandlerProps {
  vaultId: string;
}

export function AutoLockHandler({ vaultId }: AutoLockHandlerProps) {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [duration, setDuration] = useState(300000);

  useEffect(() => {
    let isMounted = true;

    async function fetchDuration() {
      try {
        const settings = await getVaultSettings(vaultId);
        if (isMounted) {
          setDuration(settings.auto_lock_duration);
        }
      } catch (error) {
        logError('Failed to fetch auto lock duration', error);
      }
    }

    fetchDuration();

    return () => {
      isMounted = false;
    };
  }, [vaultId]);

  useEffect(() => {
    const handleInactivity = async () => {
      try {
        await invoke('lock_vault');
        navigate('/vaults', { replace: true });
      } catch (error) {
        logError('Failed to lock vault', error);
      }
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // If duration is 0 or less, it means "Never lock"
      if (duration > 0) {
        timeoutRef.current = setTimeout(handleInactivity, duration);
      }
    };

    // Initialize timer
    resetTimer();

    // Add event listeners for user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [duration, navigate]);

  return null;
}
