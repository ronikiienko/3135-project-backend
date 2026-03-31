import React, { useEffect, useState } from 'react';
import { Container, Title, Stack, Card, Group, Text, Badge, Loader, Alert } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getRentals, Rental } from '../api/rental';
import { statusColor, statusLabel, statusDescriptionRenter, statusDescriptionShelter } from '../utils/rentalStatus';

const closedStatuses = [
  'SHELTER_DECLINED', 'PAYMENT_EXPIRED', 'RENTER_DECLINED', 'SHELTER_WITHDREW',
  'PEACEFULLY_TERMINATED', 'DISPUTE_IN_FAVOR_OF_SHELTER', 'DISPUTE_IN_FAVOR_OF_RENTER', 'SHELTER_CANCELLED', 'RENTER_CANCELLED',
];

const RentalHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusDescriptions = role === 'SHELTER' ? statusDescriptionShelter : statusDescriptionRenter;

  useEffect(() => {
    getRentals().then((data) => {
      if (data.error) setError('Failed to load rental history.');
      else setRentals((data.rentals ?? []).filter((r) => closedStatuses.includes(r.status)));
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Topbar />
      <Container my={40}>
        <Title order={2} mb="lg">Rental History</Title>
        {loading ? <Loader /> : error ? (
          <Alert color="red">{error}</Alert>
        ) : rentals.length === 0 ? (
          <Text c="dimmed">No past rentals yet.</Text>
        ) : (
          <Stack>
            {rentals.map((r) => (
              <Card key={r.id} withBorder padding="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate(`/rental/${r.id}`)}>
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={600}>{r.listing_name}</Text>
                    {role === 'RENTER' && (
                      <Text
                        size="sm" c="blue" style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/shelter/profile/${r.shelter_id}`); }}
                      >
                        Shelter: {r.shelter_name}
                      </Text>
                    )}
                    {role === 'SHELTER' && (
                      <Text
                        size="sm" c="blue" style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/renter/profile/${r.renter_id}`); }}
                      >
                        Renter: {r.renter_name}
                      </Text>
                    )}
                    {r.rental_begins && r.rental_ends && (
                      <Text size="sm" c="dimmed">
                        {new Date(r.rental_begins).toLocaleDateString()} — {new Date(r.rental_ends).toLocaleDateString()}
                      </Text>
                    )}
                    {r.total_cost !== null && <Text size="sm">Total: ${r.total_cost}</Text>}
                    {r.closed_at && (
                      <Text size="xs" c="dimmed">Closed {new Date(r.closed_at).toLocaleDateString()}</Text>
                    )}
                  </Stack>
                  <Stack gap={4} align="flex-end">
                    <Badge color={statusColor[r.status] ?? 'gray'}>{statusLabel[r.status] ?? r.status}</Badge>
                    <Text size="xs" c="dimmed" ta="right" maw={220}>{statusDescriptions[r.status]}</Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </>
  );
};

export default RentalHistoryPage;
