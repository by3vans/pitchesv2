'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Direction = 'forward' | 'back';

interface TransitionContextValue {
  navigateTo: (href: string, direction?: Direction) => void;
  direction: Direction | null;
}

const TransitionContext = createContext<TransitionContextValue>({
  navigateTo: () => {},
  direction: null,
});

export function useNavigate() {
  return useContext(TransitionContext);
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction | null>(null);
  const isNavigating = useRef(false);

  const navigateTo = useCallback((href: string, dir: Direction = 'forward') => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    setDirection(dir);

    // Clona a página atual como overlay fixo
    const layer = document.querySelector('.page-layer') as HTMLElement | null;
    if (layer) {
      const clone = layer.cloneNode(true) as HTMLElement;
      clone.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        overflow: hidden;
        background: var(--ice, #F8F5F0);
        animation: ${dir === 'forward' ? 'page-exit-fwd' : 'page-exit-back'} 0.6s cubic-bezier(0.77,0,0.18,1) forwards;
      `;
      document.body.appendChild(clone);
      setTimeout(() => clone.remove(), 650);
    }

    router.push(href);

    setTimeout(() => {
      setDirection(null);
      isNavigating.current = false;
    }, 700);
  }, [router]);

  return (
    <TransitionContext.Provider value={{ navigateTo, direction }}>
      {children}
    </TransitionContext.Provider>
  );
}
