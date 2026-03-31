import { BASE_URL } from './config';
import { Shelter } from './shelter';
import { Rental } from './rental';

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

export async function getAdminDisputes(): Promise<{ disputes?: Rental[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/disputes.php`, { credentials: 'include' });
  return res.json();
}

export async function assignShelterVerification(shelterId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/assignShelterVerification.php?shelterId=${shelterId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}

export async function verifyShelter(shelterId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/verifyShelter.php?shelterId=${shelterId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}

export async function assignDispute(rentalId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/assignDispute.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}

export async function createAdminToken(): Promise<{ adminToken?: string; expiresAt?: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/createAdminToken.php`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function resolveDispute(rentalId: number, resolution: 'IN_FAVOR_OF_SHELTER' | 'IN_FAVOR_OF_RENTER'): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/resolveDispute.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ resolution }),
  });
  return res.json();
}