import { Suspense } from 'react';
import PitchCreationSuccessModal from './components/PitchCreationSuccessModal';

export default function PitchCreationSuccessModalPage() {
  return (
    <Suspense>
      <PitchCreationSuccessModal />
    </Suspense>
  );
}