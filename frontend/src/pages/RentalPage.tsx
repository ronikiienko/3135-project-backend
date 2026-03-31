import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Stack, Group, Badge, Loader, Alert, Paper, Button, Modal, Textarea,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/en';
import Topbar from '../components/Topbar';
import { Rental, getRental, respondToRentalRequest, respondToRentalTerms, withdrawFromRental, cancelRental, cancelRentalRequest, disputeRental } from '../api/rental';
import { statusColor, statusLabel, statusDescriptionRenter, statusDescriptionShelter } from '../utils/rentalStatus';

const RentalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDeclineTermsModal, setShowDeclineTermsModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Shelter confirm form state
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [suggestedBegins, setSuggestedBegins] = useState<string | null>(null);
  const [suggestedEnds, setSuggestedEnds] = useState<string | null>(null);

  const fetchRental = () => {
    if (!id) return;
    setLoading(true);
    getRental(Number(id)).then((data) => {
      if (data.error) setError('Rental not found or access denied.');
      else if (data.rental) setRental(data.rental);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRental();
  }, [id]);

  const handleShelterConfirm = async () => {
    if (!rental || !suggestedBegins || !suggestedEnds) return;
    setActionLoading(true);
    setActionError(null);
    const result = await respondToRentalRequest(rental.id, {
      response: 'CONFIRM',
      suggestedRentalBegins: new Date(suggestedBegins).toISOString(),
      suggestedRentalEnds: new Date(suggestedEnds).toISOString(),
    });
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      setShowConfirmForm(false);
      setSuggestedBegins(null);
      setSuggestedEnds(null);
      fetchRental();
    }
  };

  const handleShelterDeny = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await respondToRentalRequest(rental.id, { response: 'DENY' });
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      fetchRental();
    }
  };

  const handleRenterAccept = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await respondToRentalTerms(rental.id, { response: 'ACCEPT' });
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      fetchRental();
    }
  };

  const handleRenterDecline = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await respondToRentalTerms(rental.id, { response: 'DECLINE' });
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      fetchRental();
    }
  };

  const handleShelterWithdraw = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await withdrawFromRental(rental.id);
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      fetchRental();
    }
  };

  const handleDisputeRental = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await disputeRental(rental.id, disputeReason);
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      setDisputeReason('');
      fetchRental();
    }
  };

  const handleRenterCancelRequest = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await cancelRentalRequest(rental.id);
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      fetchRental();
    }
  };

  const handleShelterCancel = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await cancelRental(rental.id);
    setActionLoading(false);
    if (result.error) {
      setActionError(result.error);
    } else {
      fetchRental();
    }
  };

  if (loading) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  if (error || !rental) return (
    <>
      <Topbar />
      <Container my={40}><Alert color="red">{error ?? 'Rental not found.'}</Alert></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40} size="sm">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Title order={2}>Rental #{rental.id}</Title>
            <Stack gap={4} align="flex-end">
              <Badge size="lg" color={statusColor[rental.status] ?? 'gray'}>
                {statusLabel[rental.status] ?? rental.status.replace(/_/g, ' ')}
              </Badge>
              <Text size="xs" c="dimmed" ta="right" maw={260}>
                {(role === 'SHELTER' ? statusDescriptionShelter : statusDescriptionRenter)[rental.status]}
              </Text>
            </Stack>
          </Group>

          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Group>
                <Text fw={600} w={160}>Listing:</Text>
                <Text
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--mantine-color-blue-6)' }}
                  onClick={() => navigate(`/listing/${rental.listing_id}`)}
                >
                  {rental.listing_name}
                </Text>
              </Group>

              {role === 'SHELTER' && (
                <Group>
                  <Text fw={600} w={160}>Renter:</Text>
                  <Text
                    style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--mantine-color-blue-6)' }}
                    onClick={() => navigate(`/renter/profile/${rental.renter_id}`)}
                  >
                    {rental.renter_name}
                  </Text>
                </Group>
              )}

              {role === 'RENTER' && (
                <Group>
                  <Text fw={600} w={160}>Shelter:</Text>
                  <Text
                    style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--mantine-color-blue-6)' }}
                    onClick={() => navigate(`/shelter/profile/${rental.shelter_id}`)}
                  >
                    {rental.shelter_name}
                  </Text>
                </Group>
              )}

              {rental.rental_begins && (
                <Group>
                  <Text fw={600} w={160}>Rental Begins:</Text>
                  <Text>{new Date(rental.rental_begins).toLocaleString()}</Text>
                </Group>
              )}

              {rental.rental_ends && (
                <Group>
                  <Text fw={600} w={160}>Rental Ends:</Text>
                  <Text>{new Date(rental.rental_ends).toLocaleString()}</Text>
                </Group>
              )}

              {rental.total_cost !== null && (
                <Group>
                  <Text fw={600} w={160}>Total Cost:</Text>
                  <Text>${rental.total_cost.toFixed(2)}</Text>
                </Group>
              )}

              {rental.terms_proposed_at && (
                <Group>
                  <Text fw={600} w={160}>Terms Proposed:</Text>
                  <Text>{new Date(rental.terms_proposed_at).toLocaleString()}</Text>
                </Group>
              )}
            </Stack>
          </Paper>

          {actionError && <Alert color="red">{actionError}</Alert>}

          {/* Shelter actions for REQUESTED status */}
          {role === 'SHELTER' && rental.status === 'REQUESTED' && (
            <Stack gap="sm">
              {!showConfirmForm ? (
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    <strong>Accept</strong> to propose a rental period and cost — the renter will have 24 hours to pay.{' '}
                    <strong>Decline</strong> to reject this request.
                  </Text>
                  <Text size="sm" c="dimmed">
                    Once the renter pays, you can still cancel the rental — but this will fully refund them.
                    If the renter hasn't paid within 24 hours, the request expires automatically.
                    You can also withdraw your proposed terms at any time before the renter pays.
                  </Text>
                  <Text size="sm" c="dimmed">
                    Payment is released to you 24 hours after the rental ends, provided the renter has not raised a dispute.
                    If a dispute is opened, an admin will review it and decide the outcome.
                  </Text>
                  <Group>
                    <Button color="green" onClick={() => setShowConfirmForm(true)} loading={actionLoading}>
                      Accept
                    </Button>
                    <Button color="red" variant="outline" onClick={() => setShowDenyModal(true)} loading={actionLoading}>
                      Decline
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Paper withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <Title order={4}>Propose Rental Period</Title>
                    <DateTimePicker
                      label="Rental Begins"
                      placeholder="Pick date and time"
                      value={suggestedBegins}
                      onChange={setSuggestedBegins}
                      minDate={new Date()}
                    />
                    <DateTimePicker
                      label="Rental Ends"
                      placeholder="Pick date and time"
                      value={suggestedEnds}
                      onChange={setSuggestedEnds}
                      minDate={suggestedBegins ? new Date(suggestedBegins) : new Date()}
                    />
                    <Group>
                      <Button color="green" onClick={handleShelterConfirm} loading={actionLoading}>
                        Confirm
                      </Button>
                      <Button variant="outline" onClick={() => { setShowConfirmForm(false); setSuggestedBegins(null); setSuggestedEnds(null); }} disabled={actionLoading}>
                        Cancel
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              )}
            </Stack>
          )}

          {/* Shelter withdraw for PAYMENT_PENDING status */}
          {role === 'SHELTER' && rental.status === 'PAYMENT_PENDING' && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Changed your mind? <strong>Withdraw</strong> to cancel the proposed terms. The renter will be notified and no payment will be taken.
              </Text>
              <Group>
                <Button color="red" variant="outline" onClick={() => setShowWithdrawModal(true)} loading={actionLoading}>
                  Withdraw
                </Button>
              </Group>
            </Stack>
          )}

          {/* Shelter cancel for PAID status */}
          {role === 'SHELTER' && rental.status === 'PAID' && (
            <Stack gap="xs">
              <Alert color="orange" title="Cancelling will refund the renter">
                If you cancel this rental, the full payment of ${rental.total_cost?.toFixed(2)} will be returned to the renter. This cannot be undone.
              </Alert>
              <Group>
                <Button color="red" variant="outline" onClick={() => setShowCancelModal(true)} loading={actionLoading}>
                  Cancel Rental
                </Button>
              </Group>
            </Stack>
          )}

          <Modal
            opened={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            title="Cancel this rental?"
            centered
          >
            <Stack gap="md">
              <Text>
                This will cancel the rental and refund <strong>${rental.total_cost?.toFixed(2)}</strong> to the renter. This action cannot be undone.
              </Text>
              <Group justify="flex-end">
                <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={actionLoading}>
                  Go back
                </Button>
                <Button
                  color="red"
                  loading={actionLoading}
                  onClick={async () => {
                    await handleShelterCancel();
                    setShowCancelModal(false);
                  }}
                >
                  Yes, cancel rental
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* Renter cancel for REQUESTED status */}
          {role === 'RENTER' && rental.status === 'REQUESTED' && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Your request is waiting for the shelter to respond. You can cancel it at any time before they accept or decline — no payment will be taken.
              </Text>
              <Group>
                <Button color="red" variant="outline" onClick={() => setShowCancelRequestModal(true)} loading={actionLoading}>
                  Cancel Request
                </Button>
              </Group>
            </Stack>
          )}

          <Modal
            opened={showCancelRequestModal}
            onClose={() => setShowCancelRequestModal(false)}
            title="Cancel this request?"
            centered
          >
            <Stack gap="md">
              <Text>Your request will be withdrawn. No payment will be taken. This cannot be undone.</Text>
              <Group justify="flex-end">
                <Button variant="outline" onClick={() => setShowCancelRequestModal(false)} disabled={actionLoading}>
                  Go back
                </Button>
                <Button
                  color="red"
                  loading={actionLoading}
                  onClick={async () => {
                    await handleRenterCancelRequest();
                    setShowCancelRequestModal(false);
                  }}
                >
                  Yes, cancel request
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* Renter actions for PAYMENT_PENDING status */}
          {role === 'RENTER' && rental.status === 'PAYMENT_PENDING' && (
            <Stack gap="sm">
              <Paper withBorder p="md" radius="md" bg="blue.0">
                <Stack gap="xs">
                  <Title order={4}>Proposed Terms</Title>
                  {rental.rental_begins && (
                    <Text><strong>Begins:</strong> {new Date(rental.rental_begins).toLocaleString()}</Text>
                  )}
                  {rental.rental_ends && (
                    <Text><strong>Ends:</strong> {new Date(rental.rental_ends).toLocaleString()}</Text>
                  )}
                  {rental.total_cost !== null && (
                    <Text><strong>Total Cost:</strong> ${rental.total_cost.toFixed(2)}</Text>
                  )}
                </Stack>
              </Paper>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  <strong>Accept</strong> to confirm the rental and complete payment.{' '}
                  <strong>Decline</strong> to reject these terms — no payment will be taken.
                </Text>
                <Text size="sm" c="dimmed">
                  Your payment is held securely until the rental period ends. The shelter receives the funds 24 hours after the rental ends, once no dispute has been raised.
                </Text>
                <Text size="sm" c="dimmed">
                  If something goes wrong during the rental, you have 24 hours after it ends to raise a dispute. An admin will review it and decide the outcome.
                </Text>
                <Text size="sm" c="orange.7">
                  Once you accept, your payment is non-refundable except through a dispute. The shelter can cancel the rental, but outside of that there is no other way to get your money back.
                </Text>
                <Group>
                  <Button color="green" onClick={handleRenterAccept} loading={actionLoading}>
                    Accept Terms
                  </Button>
                  <Button color="red" variant="outline" onClick={() => setShowDeclineTermsModal(true)} loading={actionLoading}>
                    Decline Terms
                  </Button>
                </Group>
              </Stack>
            </Stack>
          )}

          {/* Renter dispute for PAID status */}
          {role === 'RENTER' && rental.status === 'PAID' && (() => {
            const now = Date.now();
            const endsTs = rental.rental_ends ? new Date(rental.rental_ends).getTime() : null;
            const rentalEnded = endsTs !== null && endsTs <= now;
            const windowExpired = endsTs !== null && (now - endsTs) > 24 * 60 * 60 * 1000;
            const canDispute = rentalEnded && !windowExpired;

            let disabledReason: string | null = null;
            if (!rentalEnded) disabledReason = 'You can only raise a dispute after the rental has ended.';
            else if (windowExpired) disabledReason = 'The 24-hour dispute window has passed.';

            return (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  If something went wrong during the rental, you can raise a <strong>dispute</strong> within 24 hours after the rental ends.
                  Once raised, the shelter's payout is put on hold while an admin reviews the case.
                </Text>
                {canDispute && (
                  <Text size="sm" c="orange.7">
                    Only raise a dispute if you have a genuine issue. An admin will review the reason you provide and decide the outcome.
                  </Text>
                )}
                {disabledReason && <Text size="sm" c="dimmed">{disabledReason}</Text>}
                <Group>
                  <Button color="orange" variant="outline" onClick={() => setShowDisputeModal(true)} loading={actionLoading} disabled={!canDispute}>
                    Raise Dispute
                  </Button>
                </Group>
              </Stack>
            );
          })()}
        </Stack>
      </Container>

      <Modal opened={showDisputeModal} onClose={() => { setShowDisputeModal(false); setDisputeReason(''); }} title="Raise a dispute" centered>
        <Stack gap="md">
          <Text size="sm">Describe what went wrong. An admin will review this and decide the outcome. Your payment is on hold until resolved.</Text>
          <Textarea
            label="Reason"
            placeholder="Explain the issue in detail..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.currentTarget.value)}
            minRows={4}
            required
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }} disabled={actionLoading}>
              Go back
            </Button>
            <Button
              color="orange"
              loading={actionLoading}
              disabled={!disputeReason.trim()}
              onClick={async () => {
                await handleDisputeRental();
                setShowDisputeModal(false);
              }}
            >
              Submit dispute
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={showDenyModal} onClose={() => setShowDenyModal(false)} title="Decline this request?" centered>
        <Stack gap="md">
          <Text>The renter's request will be declined. This cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setShowDenyModal(false)} disabled={actionLoading}>Go back</Button>
            <Button color="red" loading={actionLoading} onClick={async () => { await handleShelterDeny(); setShowDenyModal(false); }}>
              Yes, decline
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Withdraw proposed terms?" centered>
        <Stack gap="md">
          <Text>Your proposed terms will be withdrawn. The renter will not be charged. This cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} disabled={actionLoading}>Go back</Button>
            <Button color="red" loading={actionLoading} onClick={async () => { await handleShelterWithdraw(); setShowWithdrawModal(false); }}>
              Yes, withdraw
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={showDeclineTermsModal} onClose={() => setShowDeclineTermsModal(false)} title="Decline these terms?" centered>
        <Stack gap="md">
          <Text>You will decline the shelter's proposed terms. No payment will be taken. This cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setShowDeclineTermsModal(false)} disabled={actionLoading}>Go back</Button>
            <Button color="red" loading={actionLoading} onClick={async () => { await handleRenterDecline(); setShowDeclineTermsModal(false); }}>
              Yes, decline terms
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default RentalPage;
