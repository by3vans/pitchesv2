import type { Metadata } from 'next';
import ArtistsPage from './components/ArtistsPage';

export const metadata: Metadata = {
  title: 'Artists - PitchManager',
  description: 'Manage artists and their linked recipients.',
};

export default function Page() {
  return <ArtistsPage />;
}
