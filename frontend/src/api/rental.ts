import { BASE_URL } from './config';

export interface Rental {
  id: number;
  shelter_id: number;
  renter_id: number;
  listing_id: number;
  listing_name: string;
  renter_name: string;
  shelter_name: string;
  assigned_admin_id: number | null;
  rental_begins: string | null;
  rental_ends: string | null;
  terms_proposed_at: string | null;
  status: string;
  dispute_reason: string | null;
  total_cost: number | null;
  stripe_transaction_id: string | null;
  closed_at: string | null;
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

export async function getRental(rentalId: number): Promise<{ rental?: Rental; error?: string }> {
  const res = await fetch(`${BASE_URL}/rental.php?rentalId=${rentalId}`, { credentials: 'include' });
  return res.json();
}

export async function respondToRentalRequest(
  rentalId: number,
  payload: { response: 'CONFIRM'; suggestedRentalBegins: string; suggestedRentalEnds: string } | { response: 'DENY' }
): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/respondToRentalRequest.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function withdrawFromRental(rentalId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/withdrawFromRental.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}

export async function cancelRental(rentalId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/shelter/cancelRental.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}

export async function disputeRental(rentalId: number, reason: string): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/disputeRental.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function cancelRentalRequest(rentalId: number): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/cancelRentalRequest.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return res.json();
}

export interface Review {
  id: number;
  rental_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewed_id: number;
  body: string;
  score: number;
  created_at: string;
  listing_id: number | null;
  listing_name: string | null;
  rental_status: string | null;
}

export async function getReviews(reviewedId: number): Promise<{ reviews?: Review[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/reviews.php?reviewedId=${reviewedId}`, { credentials: 'include' });
  return res.json();
}

export async function createReview(rentalId: number, reviewedId: number, body: string, score: number): Promise<{ review?: object; error?: string }> {
  const res = await fetch(`${BASE_URL}/review/createReview.php?rentalId=${rentalId}&reviewedId=${reviewedId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ body, score }),
  });
  return res.json();
}

export async function payForRental(rentalId: number): Promise<{ url?: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/pay.php?rentalId=${rentalId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function respondToRentalTerms(
  rentalId: number,
  payload: { response: 'ACCEPT' | 'DECLINE' }
): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/renter/respondToRentalTerms.php?rentalId=${rentalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
}
