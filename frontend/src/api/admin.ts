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

export async function suspendUser(userId: number, suspendUntil: string | null): Promise<{ success?: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/suspendUser.php?userId=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ suspend_until: suspendUntil }),
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

export interface Report {
  id: number;
  reporter_id: number | null;
  reported_id: number;
  reporter_name: string;
  reported_name: string;
  reason: string;
  body: string;
  is_resolved: boolean;
}

export async function getAdminReports(): Promise<{ reports?: Report[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/reports.php`, { credentials: 'include' });
  return res.json();
}

export async function resolveReport(reportId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/resolveReport.php?reportId=${reportId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}

export async function getReportMessages(reportId: number): Promise<{ messages?: import('./message').Message[]; reporter_id?: number | null; reported_id?: number; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/reportMessages.php?reportId=${reportId}`, { credentials: 'include' });
  return res.json();
}

export async function getDisputeMessages(rentalId: number): Promise<{ messages?: import('./message').Message[]; renter_id?: number; shelter_id?: number; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/disputeMessages.php?rentalId=${rentalId}`, { credentials: 'include' });
  return res.json();
}