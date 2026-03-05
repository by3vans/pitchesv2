'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtistsPage() {
  const router = useRouter();
  useEffect(() => {
    router?.replace('/artists-listing-dashboard');
  }, [router]);
  return null;
}
