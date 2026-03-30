import { BASE_URL } from './config';

export interface Rental {
  id: number;
  shelter_id: number;
  renter_id: number;
  listing_id: number;
  assigned_admin_id: number | null;
  rental_begins: string | null;
  rental_ends: string | null;
  terms_proposed_at: string | null;
  status: string;
  dispute_reason: string | null;
  total_cost: number | null;
  stripe_transaction_id: string | null;
}

export async function getRentals(): Promise<{ rentals?: Rental[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/rentals.php`, { credentials: 'include' });
  return res.json();
}

export async function initiateRental(listingId: number): Promise<{ rental?: Rental; error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/initiateRental.php?listingId=${listingId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}
