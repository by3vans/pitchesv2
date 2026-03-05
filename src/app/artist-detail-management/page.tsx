import type { Metadata } from 'next';
import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ArtistDetailManagement from './components/ArtistDetailManagement';

export const metadata: Metadata = {
  title: 'Artist Detail | Pitchhood',
  description: 'Manage artist profiles, track pitch history, and update contact details for your roster.',
};

export default function ArtistDetailManagementPage() {
  return (
    <ErrorBoundary label="Artist Detail">
      <Suspense>
        <ArtistDetailManagement />
      </Suspense>
    </ErrorBoundary>
  );
}
