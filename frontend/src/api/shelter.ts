import { BASE_URL } from './config';

export interface Shelter {
  id: number;
  email: string;
  avatar_filename: string | null;
  profile_images: string[];
  is_deleted: boolean;
  name: string;
  is_verified: boolean;
  location: string;
  description: string;
  rating: number | null;
  suspended_until: string | null;
  assigned_admin_id: number | null;
  stripe_account_id: string | null;
}

export async function getShelterMe(): Promise<{ shelter?: Shelter; error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/me.php`, { credentials: 'include' });
  return res.json();
}

export async function connectStripeAccount(): Promise<{ url?: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/stripe/connectAccount.php`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function updateShelterProfile(name: string, location: string, description: string): Promise<{ shelter?: Shelter; error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/updateProfile.php`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, location, description }),
  });
  return res.json();
}