'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ROUTE_ORDER = ['/', '/login', '/onboarding-profile-setup'];

function getDirection(from: string, to: string) {
  const fi = ROUTE_ORDER.indexOf(from);
  const ti = ROUTE_ORDER.indexOf(to);
  return ti >= fi ? 'forward' : 'back';
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [enterClass, setEnterClass] = useState('');

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    const dir = getDirection(prevPathRef.current, pathname);
    prevPathRef.current = pathname;
    setEnterClass(`page-enter-${dir}`);
    const t = setTimeout(() => setEnterClass(''), 700);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="page-stack">
      <div className={['page-layer', enterClass].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  );
}
