import type { Metadata } from 'next';
import PitchCreationSuccessModal from './components/PitchCreationSuccessModal';

export const metadata: Metadata = {
  title: 'Pitch Created — Pitchhood',
  description: 'Your pitch was created successfully.',
};

export default function PitchCreationSuccessModalPage() {
  return <PitchCreationSuccessModal />;
}