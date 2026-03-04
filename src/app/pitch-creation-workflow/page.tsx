import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PitchCreationForm from './components/PitchCreationForm';

export default function PitchCreationWorkflowPage() {
  return (
    <ErrorBoundary label="Pitch Creation">
      <Suspense>
        <PitchCreationForm />
      </Suspense>
    </ErrorBoundary>
  );
}