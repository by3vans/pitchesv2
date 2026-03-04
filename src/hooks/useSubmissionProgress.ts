'use client';

import { useState, useCallback } from 'react';

export type SubmissionStep = {
  id: string;
  label: string;
  status: 'waiting' | 'active' | 'done' | 'error';
  timestamp?: string;
};

export type SubmissionProgressState = {
  isActive: boolean;
  currentStepIndex: number;
  steps: SubmissionStep[];
  error?: string;
};

const PITCH_STEPS: Omit<SubmissionStep, 'status' | 'timestamp'>[] = [
  { id: 'uploading',  label: 'Uploading assets' },
  { id: 'validating', label: 'Validating fields' },
  { id: 'saving',     label: 'Saving pitch record' },
  { id: 'syncing',    label: 'Syncing to server' },
];

const ARTIST_STEPS: Omit<SubmissionStep, 'status' | 'timestamp'>[] = [
  { id: 'uploading',  label: 'Uploading assets' },
  { id: 'validating', label: 'Validating fields' },
  { id: 'saving',     label: 'Saving artist record' },
  { id: 'syncing',    label: 'Syncing to server' },
];

function formatTs(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function buildInitialSteps(defs: Omit<SubmissionStep, 'status' | 'timestamp'>[]): SubmissionStep[] {
  return defs.map((d, i) => ({
    ...d,
    status: i === 0 ? 'active' : 'waiting',
    timestamp: i === 0 ? formatTs() : undefined,
  }));
}

export function useSubmissionProgress(type: 'pitch' | 'artist') {
  const stepDefs = type === 'pitch' ? PITCH_STEPS : ARTIST_STEPS;

  const [progress, setProgress] = useState<SubmissionProgressState>({
    isActive: false,
    currentStepIndex: 0,
    steps: buildInitialSteps(stepDefs),
  });

  const start = useCallback(() => {
    setProgress({
      isActive: true,
      currentStepIndex: 0,
      steps: buildInitialSteps(stepDefs),
      error: undefined,
    });
  }, [stepDefs]);

  const advanceStep = useCallback(() => {
    setProgress((prev) => {
      const next = prev.currentStepIndex + 1;
      if (next >= prev.steps.length) return prev;
      const steps = prev.steps.map((s, i) => {
        if (i < next) return { ...s, status: 'done' as const, timestamp: s.timestamp ?? formatTs() };
        if (i === next) return { ...s, status: 'active' as const, timestamp: formatTs() };
        return s;
      });
      return { ...prev, currentStepIndex: next, steps };
    });
  }, []);

  const complete = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      isActive: false,
      currentStepIndex: prev.steps.length,
      steps: prev.steps.map((s) => ({ ...s, status: 'done' as const, timestamp: s.timestamp ?? formatTs() })),
    }));
  }, []);

  const fail = useCallback((errorMsg?: string) => {
    setProgress((prev) => {
      const steps = prev.steps.map((s, i) => {
        if (i < prev.currentStepIndex) return { ...s, status: 'done' as const };
        if (i === prev.currentStepIndex) return { ...s, status: 'error' as const, timestamp: formatTs() };
        return s;
      });
      return { ...prev, isActive: false, steps, error: errorMsg };
    });
  }, []);

  const reset = useCallback(() => {
    setProgress({
      isActive: false,
      currentStepIndex: 0,
      steps: buildInitialSteps(stepDefs),
      error: undefined,
    });
  }, [stepDefs]);

  // Run all steps with delays (simulated)
  const runSteps = useCallback(async (onComplete?: () => void) => {
    start();
    const delays = [400, 500, 600, 500];
    for (let i = 1; i < stepDefs.length; i++) {
      await new Promise<void>((res) => setTimeout(res, delays[i - 1] ?? 500));
      advanceStep();
    }
    await new Promise<void>((res) => setTimeout(res, delays[stepDefs.length - 1] ?? 500));
    complete();
    onComplete?.();
  }, [start, advanceStep, complete, stepDefs.length]);

  return { progress, start, advanceStep, complete, fail, reset, runSteps };
}
