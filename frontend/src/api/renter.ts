import { BASE_URL } from './config';

export interface Renter {
  id: number;
  email: string;
  avatar_filename: string | null;
  profile_images: string[];
  is_deleted: boolean;
  fName: string;
  lName: string;
  location: string;
  description: string;
  rating: number | null;
  suspended_until: string | null;
}

export async function getRenterMe(): Promise<{ renter?: Renter; error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/me.php`, { credentials: 'include' });
  return res.json();
}

export async function updateRenterProfile(fName: string, lName: string, location: string, description: string): Promise<{ renter?: Renter; error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/updateProfile.php`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ fName, lName, location, description }),
  });
  return res.json();
}
