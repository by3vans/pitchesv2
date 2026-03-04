import type { Metadata } from 'next';
import SettingsPage from './components/SettingsPage';

export const metadata: Metadata = {
  title: 'Settings - PitchManager',
  description: 'App settings and preferences.',
};

export default function Page() {
  return <SettingsPage />;
}
