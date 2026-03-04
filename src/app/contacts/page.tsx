import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ContactsPage from './components/ContactsPage';

export default function ContactsPageRoute() {
  return (
    <ErrorBoundary label="Contacts">
      <Suspense>
        <ContactsPage />
      </Suspense>
    </ErrorBoundary>
  );
}
