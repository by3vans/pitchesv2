import { z } from 'zod';

// Auth
export const LoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignUpSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Pitch
export const PitchSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  artist: z.string().min(1, 'Artist is required'),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  status: z.enum(['pending', 'sent', 'accepted', 'rejected', 'follow_up']).optional(),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

// Contact
export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  company: z.string().max(100, 'Company name is too long').optional(),
  role: z.string().max(100, 'Role is too long').optional(),
});

// Artist
export const ArtistSchema = z.object({
  name: z.string().min(1, 'Artist name is required').max(100, 'Name is too long'),
  genre: z.string().max(50, 'Genre is too long').optional(),
  label: z.string().max(100, 'Label is too long').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type PitchInput = z.infer<typeof PitchSchema>;
export type ContactInput = z.infer<typeof ContactSchema>;
export type ArtistInput = z.infer<typeof ArtistSchema>;
