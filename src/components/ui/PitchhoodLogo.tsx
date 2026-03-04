'use client';

import React from 'react';

interface PitchhoodLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function PitchhoodLogo({ size = 'md', className = '', showText = true }: PitchhoodLogoProps) {
  const iconSizes = { sm: 24, md: 32, lg: 40 };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const iconSize = iconSizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon mark */}
      <div
        className="rounded-lg flex items-center justify-center shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          background: '#2563EB',
        }}
        aria-hidden="true"
      >
        <svg
          width={iconSize * 0.56}
          height={iconSize * 0.56}
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="9" cy="9" r="4" fill="white" opacity="0.95" />
          <path d="M9 2C9 2 13 5 13 9C13 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
          <path d="M9 2C9 2 5 5 5 9C5 13 9 16 9 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        </svg>
      </div>

      {/* Wordmark */}
      {showText && (
        <span
          className={`${textSizes[size]} font-bold tracking-tight`}
          style={{
            fontFamily: 'Inter, sans-serif',
            color: 'var(--color-foreground)',
            letterSpacing: '-0.03em',
          }}
        >
          Pitch<span style={{ color: '#2563EB' }}>hood</span>
        </span>
      )}
    </div>
  );
}
