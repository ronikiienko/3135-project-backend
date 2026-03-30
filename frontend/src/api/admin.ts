import { BASE_URL } from './config';
import { Shelter } from './shelter';

export interface Admin {
  id: number;
  email: string;
  avatar_filename: string | null;
  profile_images: string[];
  is_deleted: boolean;
  name: string;
  can_create_admins: boolean;
}

export async function getAdminMe(): Promise<{ admin?: Admin; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/me.php`, { credentials: 'include' });
  return res.json();
}

export async function getAdminShelters(): Promise<{ shelters?: Shelter[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/shelters.php`, { credentials: 'include' });
  return res.json();
}

export async function verifyShelter(shelterId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/verifyShelter.php?shelterId=${shelterId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}