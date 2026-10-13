import { useSyncExternalStore } from 'react';
import { isMuted, subscribeToMuted } from './sounds';

export function useMuted(): boolean {
  return useSyncExternalStore(subscribeToMuted, isMuted);
}
