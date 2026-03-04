'use client';

import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
  onNewPitch?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Skip if user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (!modifier) return;

      switch (e.key) {
        case 'n': case'N':
          if (!isEditing && handlers.onNewPitch) {
            e.preventDefault();
            handlers.onNewPitch();
          }
          break;
        case '/':
          if (handlers.onSearch) {
            e.preventDefault();
            handlers.onSearch();
          }
          break;
        case 'f': case'F':
          if (!isEditing && handlers.onFilter) {
            e.preventDefault();
            handlers.onFilter();
          }
          break;
        case '?':
          if (handlers.onHelp) {
            e.preventDefault();
            handlers.onHelp();
          }
          break;
        default:
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
