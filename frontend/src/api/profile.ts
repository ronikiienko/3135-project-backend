import { BASE_URL } from './config';

export interface ShelterPublicProfile {
  id: number;
  name: string;
  is_verified: boolean;
  location: string;
  description: string;
  rating: number | null;
  avatar_filename: string | null;
  profile_images: string[];
}

export interface RenterPublicProfile {
  id: number;
  fName: string;
  lName: string;
  location: string;
  description: string;
  rating: number | null;
  avatar_filename: string | null;
  profile_images: string[];
}

export async function getShelterProfile(shelterId: number): Promise<{ shelter?: ShelterPublicProfile; error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/profile.php?shelterId=${shelterId}`, { credentials: 'include' });
  return res.json();
}

export async function getRenterProfile(renterId: number): Promise<{ renter?: RenterPublicProfile; error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/profile.php?renterId=${renterId}`, { credentials: 'include' });
  return res.json();
}
