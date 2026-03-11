import type { Metadata } from 'next';
import LoginPage from './components/LoginPage';

export const metadata: Metadata = {
  title: 'Login — Pitchhood',
  description: 'Sign in to track your pitches, manage your artists, and never lose a submission again.',
};

export default function Page() {
  return <LoginPage />;
}
