import type { Metadata } from 'next';
import PasswordResetConfirmationPage from './components/PasswordResetConfirmationPage';

export const metadata: Metadata = {
  title: 'Reset Password — Pitchhood',
  description: 'Set a new password for your Pitchhood account.',
};

export default function PasswordResetConfirmation() {
  return <PasswordResetConfirmationPage />;
}