import type { Metadata } from 'next';
import NotificationsCenter from './components/NotificationsCenter';

export const metadata: Metadata = {
  title: 'Notifications - PitchManager',
  description: 'Centralized activity monitoring and alert management for pitch workflows and system events.',
};

export default function NotificationsCenterPage() {
  return <NotificationsCenter />;
}
