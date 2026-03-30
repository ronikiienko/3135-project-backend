import { BASE_URL } from './config';

export interface Listing {
  id: number;
  shelter_id: number;
  name: string;
  species: string;
  age: number;
  description: string;
  is_closed: boolean;
  rate: number;
  listing_images: string[];
}

export interface CreateListingPayload {
  name: string;
  species: string;
  age: number;
  description: string;
  rate: number;
}

export async function createListing(
  payload: CreateListingPayload,
  listingImages?: File[],
): Promise<{ listing?: Listing; error?: string }> {
  const form = new FormData();
  form.append('metadata', JSON.stringify(payload));
  if (listingImages) {
    for (const file of listingImages) form.append('listing_images', file);
  }
  const res = await fetch(`${BASE_URL}/shelter/createListing.php`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  return res.json();
}