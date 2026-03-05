import { Suspense } from 'react';
import PitchCreationSuccessModal from './components/PitchCreationSuccessModal';

export const dynamic = 'force-dynamic';

export default function PitchCreationSuccessModalPage() {
  return (
    <Suspense>
      <PitchCreationSuccessModal />
    </Suspense>
  );
}