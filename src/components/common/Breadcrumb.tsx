'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  'pitches-listing-dashboard': 'Dashboard',
  'pitch-detail-management': 'Detalhes do Pitch',
  'pitch-creation-workflow': 'Novo Pitch',
};

const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  const pathname = usePathname();

  const resolvedItems: BreadcrumbItem[] = items ?? (() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Início', path: '/pitches-listing-dashboard' }];
    segments.forEach((seg, idx) => {
      const label = routeLabels[seg] ?? seg.replace(/-/g, ' ');
      const path = '/' + segments.slice(0, idx + 1).join('/');
      crumbs.push({ label, path: idx < segments.length - 1 ? path : undefined });
    });
    return crumbs;
  })();

  if (resolvedItems.length <= 1) return null;

  return (
    <nav className={`pm-breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {resolvedItems.map((item, idx) => {
          const isLast = idx === resolvedItems.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && (
                <Icon
                  name="ChevronRightIcon"
                  size={12}
                  variant="outline"
                  className="text-muted-foreground shrink-0"
                />
              )}
              {item.path && !isLast ? (
                <Link
                  href={item.path}
                  className="hover:text-foreground transition-colors duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'text-foreground font-medium' : ''}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;