export const statusColor: Record<string, string> = {
  REQUESTED: 'yellow',
  SHELTER_DECLINED: 'red',
  PAYMENT_PENDING: 'blue',
  PAYMENT_EXPIRED: 'red',
  RENTER_DECLINED: 'red',
  SHELTER_WITHDREW: 'red',
  PAID: 'green',
  DISPUTE: 'orange',
  PEACEFULLY_TERMINATED: 'gray',
  DISPUTE_IN_FAVOR_OF_SHELTER: 'green',
  DISPUTE_IN_FAVOR_OF_RENTER: 'red',
  SHELTER_CANCELLED: 'red',
};

export const statusLabel: Record<string, string> = {
  REQUESTED: 'Requested',
  SHELTER_DECLINED: 'Declined by shelter',
  PAYMENT_PENDING: 'Awaiting payment',
  PAYMENT_EXPIRED: 'Payment expired',
  RENTER_DECLINED: 'Declined by renter',
  SHELTER_WITHDREW: 'Shelter withdrew',
  PAID: 'Paid',
  DISPUTE: 'In dispute',
  PEACEFULLY_TERMINATED: 'Completed',
  DISPUTE_IN_FAVOR_OF_SHELTER: 'Dispute: shelter won',
  DISPUTE_IN_FAVOR_OF_RENTER: 'Dispute: renter won',
  SHELTER_CANCELLED: 'Cancelled by shelter',
};

export const statusDescriptionRenter: Record<string, string> = {
  REQUESTED: 'Waiting for the shelter to review your request.',
  SHELTER_DECLINED: 'The shelter declined your rental request.',
  PAYMENT_PENDING: 'The shelter has proposed rental terms. Review and pay to confirm.',
  PAYMENT_EXPIRED: 'The payment window closed before you paid. The rental has been cancelled.',
  RENTER_DECLINED: 'You declined the shelter\'s proposed terms.',
  SHELTER_WITHDREW: 'The shelter withdrew after accepting your request.',
  PAID: 'Rental confirmed and paid. Enjoy your time with the pet!',
  DISPUTE: 'A dispute is open for this rental. An admin will review it.',
  PEACEFULLY_TERMINATED: 'Rental ended successfully with no disputes.',
  DISPUTE_IN_FAVOR_OF_SHELTER: 'The dispute was resolved in favor of the shelter.',
  DISPUTE_IN_FAVOR_OF_RENTER: 'The dispute was resolved in your favor.',
  SHELTER_CANCELLED: 'The shelter cancelled this rental.',
};

export const statusDescriptionShelter: Record<string, string> = {
  REQUESTED: 'A renter has requested to rent this pet. Review and respond.',
  SHELTER_DECLINED: 'You declined this rental request.',
  PAYMENT_PENDING: 'Terms proposed — waiting for the renter to pay.',
  PAYMENT_EXPIRED: 'The renter did not pay within the allowed time. The rental has been cancelled.',
  RENTER_DECLINED: 'The renter declined your proposed terms.',
  SHELTER_WITHDREW: 'You withdrew from this rental.',
  PAID: 'Rental confirmed and paid.',
  DISPUTE: 'A dispute is open for this rental. An admin will review it.',
  PEACEFULLY_TERMINATED: 'Rental ended successfully with no disputes.',
  DISPUTE_IN_FAVOR_OF_SHELTER: 'The dispute was resolved in your favor.',
  DISPUTE_IN_FAVOR_OF_RENTER: 'The dispute was resolved in favor of the renter.',
  SHELTER_CANCELLED: 'You cancelled this rental.',
};
