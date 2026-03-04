'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional label shown in the fallback heading, e.g. "Pitch Creation" */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for debugging; swap for a real error reporter if needed
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { label = 'This section' } = this.props;

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '320px',
          padding: '40px 24px',
          background: 'var(--color-card)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '16px',
          margin: '24px auto',
          maxWidth: '560px',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        {/* Error icon */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width={26}
            height={26}
            style={{ color: 'var(--color-destructive)' }}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-foreground)',
            margin: 0,
          }}
        >
          {label} encountered an unexpected error
        </h2>

        {/* Error detail */}
        {this.state.error?.message && (
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8125rem',
              color: 'var(--color-muted-foreground)',
              margin: 0,
              maxWidth: '420px',
              lineHeight: 1.5,
            }}
          >
            {this.state.error.message}
          </p>
        )}

        {/* Retry button */}
        <button
          onClick={this.handleReset}
          style={{
            marginTop: '8px',
            padding: '9px 22px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-foreground)',
            color: 'var(--color-background)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Try again
        </button>
      </div>
    );
  }
}
