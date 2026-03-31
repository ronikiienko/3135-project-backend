import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Stack, Group, Badge, Loader, Alert, Paper, Button,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/en';
import Topbar from '../components/Topbar';
import { Rental, getRental, respondToRentalRequest, respondToRentalTerms } from '../api/rental';

const statusColor: Record<string, string> = {
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

const RentalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
          <Group justify="space-between" align="center">
            <Title order={2}>Rental #{rental.id}</Title>
            <Badge size="lg" color={statusColor[rental.status] ?? 'gray'}>{rental.status.replace(/_/g, ' ')}</Badge>
          </Group>

          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Group>
                <Text fw={600} w={160}>Listing:</Text>
                <Text
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--mantine-color-blue-6)' }}
                  onClick={() => navigate(`/listing/${rental.listing_id}`)}
                >
                  {rental.listing_name ?? `Listing #${rental.listing_id}`}
                </Text>
              </Group>

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
                <Group>
                  <Button color="green" onClick={() => setShowConfirmForm(true)} loading={actionLoading}>
                    Accept
                  </Button>
                  <Button color="red" variant="outline" onClick={handleShelterDeny} loading={actionLoading}>
                    Decline
                  </Button>
                </Group>
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
              <Group>
                <Button color="green" onClick={handleRenterAccept} loading={actionLoading}>
                  Accept Terms
                </Button>
                <Button color="red" variant="outline" onClick={handleRenterDecline} loading={actionLoading}>
                  Decline Terms
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default RentalPage;
