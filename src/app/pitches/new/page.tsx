import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PitchCreationForm from '../../pitch-creation-workflow/components/PitchCreationForm';

export default function PitchesNewPage() {
  return (
    <ErrorBoundary label="Pitch Creation">
      <Suspense>
        <PitchCreationForm />
      </Suspense>
    </ErrorBoundary>
  );
}
