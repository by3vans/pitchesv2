import type { Metadata } from 'next';
import LoginPage from './components/LoginPage';

export const metadata: Metadata = {
  title: 'Login — Pitchhood',
  description: 'Sign in to manage your A&R pipeline, review pitches, and discover the next big artist.',
};

export default function Page() {
  return <LoginPage />;
}
