import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Stack, Group, Badge, Loader, Alert, Paper, Button,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/en';
import Topbar from '../components/Topbar';
import ConfirmModal from '../components/ConfirmModal';
import DisputeModal from './rental/DisputeModal';
import DisputeSection from './rental/DisputeSection';
import ReviewSection from './rental/ReviewSection';
import { Rental, getRental, respondToRentalRequest, respondToRentalTerms, payForRental, withdrawFromRental, cancelRental, cancelRentalRequest, disputeRental } from '../api/rental';
import { statusColor, statusLabel, statusDescriptionRenter, statusDescriptionShelter } from '../utils/rentalStatus';
import { useRole } from '../hooks/useRole';

type ActiveModal = 'cancel' | 'cancelRequest' | 'deny' | 'withdraw' | 'declineTerms' | 'dispute' | null;

const RentalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useRole();

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [suggestedBegins, setSuggestedBegins] = useState<Date | null>(null);
  const [suggestedEnds, setSuggestedEnds] = useState<Date | null>(null);

  const fetchRental = () => {
    if (!id) return;
    setLoading(true);
    getRental(Number(id)).then((data) => {
      if (data.error) {
        setError('Rental not found or access denied.');
      } else {
        setRental(data.rental!);
      }
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
      suggestedRentalBegins: suggestedBegins.toISOString(),
      suggestedRentalEnds: suggestedEnds.toISOString(),
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
    if (result.error) setActionError(result.error);
    else fetchRental();
  };

  const handleRenterAccept = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await payForRental(rental.id);
    setActionLoading(false);
    if (result.error || !result.url) {
      setActionError(result.error ?? 'Failed to initiate payment.');
    } else {
      window.location.href = result.url;
    }
  };

  const handleRenterDecline = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await respondToRentalTerms(rental.id, { response: 'DECLINE' });
    setActionLoading(false);
    if (result.error) setActionError(result.error);
    else fetchRental();
  };

  const handleShelterWithdraw = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await withdrawFromRental(rental.id);
    setActionLoading(false);
    if (result.error) setActionError(result.error);
    else fetchRental();
  };

  const handleDisputeRental = async (reason: string) => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await disputeRental(rental.id, reason);
    setActionLoading(false);
    if (result.error) setActionError(result.error);
    else fetchRental();
  };

  const handleRenterCancelRequest = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await cancelRentalRequest(rental.id);
    setActionLoading(false);
    if (result.error) setActionError(result.error);
    else fetchRental();
  };

  const handleShelterCancel = async () => {
    if (!rental) return;
    setActionLoading(true);
    setActionError(null);
    const result = await cancelRental(rental.id);
    setActionLoading(false);
    if (result.error) setActionError(result.error);
    else fetchRental();
  };

  const closeModal = () => setActiveModal(null);

  if (loading) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40} size="sm">
        {error && <Alert color="red" mb="lg">{error}</Alert>}
        {!error && !rental && <Alert color="red">Rental not found.</Alert>}
        {rental && <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Title order={2}>Rental #{rental.id}</Title>
            <Stack gap={4} align="flex-end">
              <Badge size="lg" color={statusColor[rental.status] ?? 'gray'}>
                {statusLabel[rental.status] ?? rental.status.replace(/_/g, ' ')}
              </Badge>
              {role !== 'ADMIN' && (
                <Text size="xs" c="dimmed" ta="right" maw={260}>
                  {(role === 'SHELTER' ? statusDescriptionShelter : statusDescriptionRenter)[rental.status]}
                </Text>
              )}
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

              {(role === 'SHELTER' || role === 'ADMIN') && (
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

              {(role === 'RENTER' || role === 'ADMIN') && (
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
                    <strong>Accept</strong> to propose a rental period and cost — the renter must pay before the rental start date.{' '}
                    <strong>Decline</strong> to reject this request.
                  </Text>
                  <Text size="sm" c="dimmed">
                    Once the renter pays, you can still cancel the rental — but this will fully refund them.
                    If the renter hasn't paid before the rental start date, the request expires automatically.
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
                    <Button color="red" variant="outline" onClick={() => setActiveModal('deny')} loading={actionLoading}>
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
                      minDate={suggestedBegins ?? new Date()}
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
                <Button color="red" variant="outline" onClick={() => setActiveModal('withdraw')} loading={actionLoading}>
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
                <Button color="red" variant="outline" onClick={() => setActiveModal('cancel')} loading={actionLoading}>
                  Cancel Rental
                </Button>
              </Group>
            </Stack>
          )}

          {/* Renter cancel for REQUESTED status */}
          {role === 'RENTER' && rental.status === 'REQUESTED' && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Your request is waiting for the shelter to respond. You can cancel it at any time before they accept or decline — no payment will be taken.
              </Text>
              <Group>
                <Button color="red" variant="outline" onClick={() => setActiveModal('cancelRequest')} loading={actionLoading}>
                  Cancel Request
                </Button>
              </Group>
            </Stack>
          )}

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
                  Your payment is held securely until the rental period ends. The shelter receives the funds once the rental ends and no dispute has been raised within 24 hours.
                </Text>
                <Text size="sm" c="dimmed">
                  If something goes wrong during the rental, you have 24 hours after it ends to raise a dispute. An admin will review it and decide the outcome.
                </Text>
                <Text size="sm" c="orange.7">
                  Once you accept, your payment is non-refundable except through a dispute. The shelter can cancel the rental, but outside of that there is no other way to get your money back.
                </Text>
                <Group>
                  <Button color="green" onClick={handleRenterAccept} loading={actionLoading}>
                    Pay Now
                  </Button>
                  <Button color="red" variant="outline" onClick={() => setActiveModal('declineTerms')} loading={actionLoading}>
                    Decline Terms
                  </Button>
                </Group>
              </Stack>
            </Stack>
          )}

          {/* Renter dispute for PAID status */}
          {role === 'RENTER' && rental.status === 'PAID' && (
            <DisputeSection
              rental={rental}
              actionLoading={actionLoading}
              onOpenModal={() => setActiveModal('dispute')}
            />
          )}

          <ReviewSection rental={rental} role={role} />
        </Stack>}
      </Container>

      <ConfirmModal
        opened={activeModal === 'cancel'}
        onClose={closeModal}
        title="Cancel this rental?"
        message={<>This will cancel the rental and refund <strong>${rental?.total_cost?.toFixed(2)}</strong> to the renter. This action cannot be undone.</>}
        confirmLabel="Yes, cancel rental"
        loading={actionLoading}
        onConfirm={async () => { await handleShelterCancel(); closeModal(); }}
      />

      <ConfirmModal
        opened={activeModal === 'cancelRequest'}
        onClose={closeModal}
        title="Cancel this request?"
        message="Your request will be withdrawn. No payment will be taken. This cannot be undone."
        confirmLabel="Yes, cancel request"
        loading={actionLoading}
        onConfirm={async () => { await handleRenterCancelRequest(); closeModal(); }}
      />

      <ConfirmModal
        opened={activeModal === 'deny'}
        onClose={closeModal}
        title="Decline this request?"
        message="The renter's request will be declined. This cannot be undone."
        confirmLabel="Yes, decline"
        loading={actionLoading}
        onConfirm={async () => { await handleShelterDeny(); closeModal(); }}
      />

      <ConfirmModal
        opened={activeModal === 'withdraw'}
        onClose={closeModal}
        title="Withdraw proposed terms?"
        message="Your proposed terms will be withdrawn. The renter will not be charged. This cannot be undone."
        confirmLabel="Yes, withdraw"
        loading={actionLoading}
        onConfirm={async () => { await handleShelterWithdraw(); closeModal(); }}
      />

      <ConfirmModal
        opened={activeModal === 'declineTerms'}
        onClose={closeModal}
        title="Decline these terms?"
        message="You will decline the shelter's proposed terms. No payment will be taken. This cannot be undone."
        confirmLabel="Yes, decline terms"
        loading={actionLoading}
        onConfirm={async () => { await handleRenterDecline(); closeModal(); }}
      />

      <DisputeModal
        opened={activeModal === 'dispute'}
        onClose={closeModal}
        loading={actionLoading}
        onSubmit={handleDisputeRental}
      />
    </>
  );
};

export default RentalPage;
