export interface Artist {
  id: string;
  name: string;
  genre?: string;
  location?: string;
  notes: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  fullName: string;
  email: string;
  role: string;
  company: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface ArtistRecipientLink {
  id: string;
  artistId: string;
  contactId: string;
  relationshipType: string;
  isPrimary: boolean;
}

export type PitchStatus = 'draft' | 'new' | 'in_review' | 'approved' | 'rejected';

export interface Pitch {
  id: string;
  title: string;
  artistId: string;
  trackUrl: string;
  status: PitchStatus;
  notes: string;
  createdAt: string;
}

export interface PitchRecipient {
  id: string;
  pitchId: string;
  contactId: string;
}

export const CONTACT_ROLES = ['A&R', 'Manager', 'Publisher', 'Label', 'Booking Agent', 'PR', 'Sync Agent', 'Other'] as const;
export const RELATIONSHIP_TYPES = ['A&R', 'Manager', 'Publisher', 'Label', 'Booking Agent', 'PR', 'Sync Agent', 'Other'] as const;
export const PITCH_STATUSES: { value: PitchStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
