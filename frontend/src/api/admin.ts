import { BASE_URL } from './config';

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