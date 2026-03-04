import type { Metadata } from 'next';
import PitchesPage from './components/PitchesPage';

export const metadata: Metadata = {
  title: 'Pitches - PitchManager',
  description: 'Manage and track all your pitches.',
};

export default function Page() {
  return <PitchesPage />;
}
