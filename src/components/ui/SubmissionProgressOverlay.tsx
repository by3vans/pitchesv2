'use client';

import type { SubmissionProgressState } from '@/hooks/useSubmissionProgress';
import Icon from '@/components/ui/AppIcon';

interface SubmissionProgressOverlayProps {
  progress: SubmissionProgressState;
  title?: string;
}

export default function SubmissionProgressOverlay({ progress, title = 'Submitting…' }: SubmissionProgressOverlayProps) {
  if (!progress.isActive) return null;

  const allDone = progress.steps.every((s) => s.status === 'done');
  const hasError = progress.steps.some((s) => s.status === 'error');

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      aria-live="polite"
      aria-label="Submission in progress"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: hasError
                ? 'rgba(239,68,68,0.1)'
                : allDone
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(59,130,246,0.1)',
            }}
          >
            {hasError ? (
              <Icon name="ExclamationCircleIcon" size={18} variant="outline" style={{ color: 'var(--color-destructive)' }} />
            ) : allDone ? (
              <Icon name="CheckCircleIcon" size={18} variant="outline" style={{ color: 'var(--color-success)' }} />
            ) : (
              <svg
                className="animate-spin"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="rgba(59,130,246,0.25)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}
            >
              {hasError ? 'Submission failed' : allDone ? 'Done!' : title}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {hasError
                ? 'An error occurred during submission'
                : allDone
                ? 'All steps completed successfully'
                : `Step ${progress.currentStepIndex + 1} of ${progress.steps.length}`}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {progress.steps.map((step, i) => {
            const isDone = step.status === 'done';
            const isActive = step.status === 'active';
            const isError = step.status === 'error';
            const isWaiting = step.status === 'waiting';

            return (
              <div key={step.id} className="flex items-center gap-3">
                {/* Step indicator */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{
                    background: isDone
                      ? 'var(--color-success)'
                      : isActive
                      ? 'var(--color-accent)'
                      : isError
                      ? 'var(--color-destructive)'
                      : 'var(--color-muted)',
                    color: isWaiting ? 'var(--color-muted-foreground)' : 'white',
                    transition: 'background 0.3s ease',
                  }}
                >
                  {isDone ? (
                    <Icon name="CheckIcon" size={12} variant="solid" style={{ color: 'white' }} />
                  ) : isError ? (
                    <Icon name="XMarkIcon" size={12} variant="solid" style={{ color: 'white' }} />
                  ) : isActive ? (
                    <span
                      className="w-2 h-2 rounded-full bg-white"
                      style={{ animation: 'pulse 1s ease-in-out infinite' }}
                    />
                  ) : (
                    <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.65rem' }}>{i + 1}</span>
                  )}
                </div>

                {/* Label + timestamp */}
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span
                    className="text-sm"
                    style={{
                      color: isWaiting
                        ? 'var(--color-muted-foreground)'
                        : isActive
                        ? 'var(--color-accent)'
                        : isError
                        ? 'var(--color-destructive)'
                        : 'var(--color-foreground)',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {step.label}
                  </span>
                  {step.timestamp && (
                    <span
                      className="text-xs font-mono shrink-0"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {step.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          className="mt-5 h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--color-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(progress.steps.filter((s) => s.status === 'done').length / progress.steps.length) * 100}%`,
              background: hasError ? 'var(--color-destructive)' : 'var(--color-accent)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
