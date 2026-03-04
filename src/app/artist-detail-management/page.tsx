import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ArtistDetailManagement from './components/ArtistDetailManagement';

export default function ArtistDetailManagementPage() {
  return (
    <ErrorBoundary label="Artist Detail">
      <Suspense>
        <ArtistDetailManagement />
      </Suspense>
    </ErrorBoundary>
  );
}
