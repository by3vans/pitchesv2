import type { Metadata } from 'next';
import ArtistsListingDashboard from './components/ArtistsListingDashboard';

export const metadata: Metadata = {
  title: 'Artists - PitchManager',
  description: 'Manage and browse all artists with advanced filtering, bulk actions, and portfolio overview.',
};

export default function ArtistsListingDashboardPage() {
  return <ArtistsListingDashboard />;
}
