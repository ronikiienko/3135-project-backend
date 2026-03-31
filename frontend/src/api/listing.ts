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
  created_at: string;
  shelter_name: string;
  shelter_location: string;
  listing_images: string[];
}

export interface CreateListingPayload {
  name: string;
  species: string;
  age: number;
  description: string;
  rate: number;
}


export async function getListing(listingId: number): Promise<{ listing?: Listing; error?: string }> {
  const res = await fetch(`${BASE_URL}/listing.php?listingId=${listingId}`, { credentials: 'include' });
  return res.json();
}

export async function getListings(): Promise<{ listings?: Listing[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/listings.php`, { credentials: 'include' });
  return res.json();
}

export async function closeListing(listingId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/closeListing.php?listingId=${listingId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function createListing(
  payload: CreateListingPayload,
  listingImages?: File[],
): Promise<{ listing?: Listing; error?: string }> {
  const form = new FormData();
  form.append('metadata', JSON.stringify(payload));
  if (listingImages) {
    for (const file of listingImages) form.append('listing_images[]', file);
  }
  const res = await fetch(`${BASE_URL}/shelter/createListing.php`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  return res.json();
}
