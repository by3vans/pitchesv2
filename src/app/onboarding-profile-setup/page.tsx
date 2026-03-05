import type { Metadata } from 'next';
import OnboardingProfileSetup from './components/OnboardingProfileSetup';

export const metadata: Metadata = {
  title: 'Profile Setup — Pitchhood',
  description: 'Complete your profile to personalize your A&R experience.',
};

export default function OnboardingProfileSetupPage() {
  return <OnboardingProfileSetup />;
}