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
}

export async function getShelterMe(): Promise<{ shelter?: Shelter; error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/me.php`, { credentials: 'include' });
  return res.json();
}