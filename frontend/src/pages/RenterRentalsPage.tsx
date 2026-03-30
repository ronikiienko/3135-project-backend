import React, { useEffect, useState } from 'react';
import { Container, Title, Stack, Card, Group, Text, Badge, Loader, Alert } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getRentals, Rental } from '../api/rental';

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

const RenterRentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getRentals().then((data) => {
      if (data.error) setError('Failed to load rentals.');
      else if (data.rentals) setRentals(data.rentals);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  if (error) return (
    <>
      <Topbar />
      <Container my={40}><Alert color="red">{error}</Alert></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40}>
        <Title order={2} mb="lg">My Rentals</Title>
        {rentals.length === 0 ? (
          <Text c="dimmed">No rentals yet.</Text>
        ) : (
          <Stack>
            {rentals.map((r) => (
              <Card key={r.id} withBorder padding="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate(`/listing/${r.listing_id}`)}>
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text fw={600}>Listing #{r.listing_id}</Text>
                    {r.rental_begins && r.rental_ends && (
                      <Text size="sm" c="dimmed">
                        {new Date(r.rental_begins).toLocaleDateString()} — {new Date(r.rental_ends).toLocaleDateString()}
                      </Text>
                    )}
                    {r.total_cost !== null && (
                      <Text size="sm">Total: ${r.total_cost}</Text>
                    )}
                  </Stack>
                  <Badge color={statusColor[r.status] ?? 'gray'}>{r.status.replace(/_/g, ' ')}</Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </>
  );
};

export default RenterRentalsPage;
