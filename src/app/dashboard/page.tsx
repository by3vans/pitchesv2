import type { Metadata } from 'next';
import DashboardPage from './components/DashboardPage';

export const metadata: Metadata = {
  title: 'Dashboard - PitchManager',
  description: 'Overview of pitches, artists, and recent activity.',
};

export default function Page() {
  return <DashboardPage />;
}
