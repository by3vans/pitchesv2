import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PostHogProvider } from '@/providers/PostHogProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Pitchhood — Pitch smarter. Connect faster.',
  description: 'Pitchhood helps music artists send personalized pitches to labels, blogs, and playlists — and track every open, reply, and follow-up.',
  metadataBase: new URL('https://pitchhood.com'),
  openGraph: {
    title: 'Pitchhood — Pitch smarter. Connect faster.',
    description: 'Pitchhood helps music artists send personalized pitches to labels, blogs, and playlists — and track every open, reply, and follow-up.',
    url: 'https://pitchhood.com',
    siteName: 'Pitchhood',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pitchhood',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pitchhood — Pitch smarter. Connect faster.',
    description: 'Pitchhood helps music artists send personalized pitches to labels, blogs, and playlists.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('pm-theme');
                  var theme = stored && ['light','dark','system'].includes(stored) ? stored : 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  if (resolved === 'dark') document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <PostHogProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </PostHogProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
