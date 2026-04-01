import { BASE_URL } from './config';

export async function updateAvatar(file: File): Promise<{ avatar_filename?: string; error?: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`${BASE_URL}/user/updateAvatar.php`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  return res.json();
}

export async function addImages(files: File[]): Promise<{ added?: string[]; error?: string }> {
  const form = new FormData();
  files.forEach((f) => form.append('profile_images[]', f));
  const res = await fetch(`${BASE_URL}/user/addImages.php`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  return res.json();
}

export async function deleteImage(filename: string): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/user/deleteImage.php?filename=${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}
