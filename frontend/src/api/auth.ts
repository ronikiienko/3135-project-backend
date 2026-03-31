import { BASE_URL } from './config';

export type Role = 'SHELTER' | 'RENTER' | 'ADMIN';

export interface LoginPayload {
  email: string;
  password: string;
  role: Role;
}

export interface RegisterShelterPayload {
  email: string;
  password: string;
  name: string;
  location: string;
  description: string;
}

export interface RegisterRenterPayload {
  email: string;
  password: string;
  fName: string;
  lName: string;
  location: string;
  description: string;
}

async function postMultipart(
  url: string,
  metadata: object,
  singleFiles?: Record<string, File | null>,
  multiFiles?: Record<string, File[]>,
) {
  const form = new FormData();
  form.append('metadata', JSON.stringify(metadata));
  if (singleFiles) {
    for (const [key, file] of Object.entries(singleFiles)) {
      if (file) form.append(key, file);
    }
  }
  if (multiFiles) {
    for (const [key, files] of Object.entries(multiFiles)) {
      for (const file of files) form.append(`${key}[]`, file);
    }
  }
  return fetch(url, { method: 'POST', body: form, credentials: 'include' });
}

export async function logout() {
  return fetch(`${BASE_URL}/auth/logout.php`, { method: 'POST', credentials: 'include' });
}

export async function login(payload: LoginPayload) {
  const res = await fetch(`${BASE_URL}/auth/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return res.json();
}

export async function registerShelter(
  payload: RegisterShelterPayload,
  avatar?: File | null,
  profileImages?: File[],
) {
  const res = await postMultipart(
    `${BASE_URL}/auth/registerShelter.php`,
    payload,
    { avatar: avatar ?? null },
    { profile_images: profileImages ?? [] },
  );
  return res.json();
}

export interface RegisterAdminPayload {
  email: string;
  password: string;
  name: string;
  token: string;
  can_create_admins: boolean;
}

export async function registerAdmin(
  payload: RegisterAdminPayload,
  avatar?: File | null,
  profileImages?: File[],
) {
  const res = await postMultipart(
    `${BASE_URL}/auth/registerAdmin.php`,
    payload,
    { avatar: avatar ?? null },
    { profile_images: profileImages ?? [] },
  );
  return res.json();
}

export async function registerRenter(
  payload: RegisterRenterPayload,
  avatar?: File | null,
  profileImages?: File[],
) {
  const res = await postMultipart(
    `${BASE_URL}/auth/registerRenter.php`,
    payload,
    { avatar: avatar ?? null },
    { profile_images: profileImages ?? [] },
  );
  return res.json();
}
