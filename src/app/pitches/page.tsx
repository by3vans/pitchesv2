import type { Metadata } from 'next';
import PitchesInteractive from '../pitches-listing-dashboard/components/PitchesInteractive';

export const metadata: Metadata = {
  title: 'Pitches — Pitchhood',
  description: 'Manage and track all your pitches.',
};

export default function PitchesPage() {
  return <PitchesInteractive />;
}
