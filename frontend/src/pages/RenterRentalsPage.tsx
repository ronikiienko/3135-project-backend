import React, { useEffect, useState } from 'react';
import { Container, Title, Stack, Card, Group, Text, Badge, Loader, Alert } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getRentals, Rental } from '../api/rental';
import { statusColor, statusLabel, statusDescriptionRenter } from '../utils/rentalStatus';

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
              <Card key={r.id} withBorder padding="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate(`/rental/${r.id}`)}>
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text fw={600}>{r.listing_name}</Text>
                    <Text
                      size="sm"
                      c="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/shelter/profile/${r.shelter_id}`); }}
                    >
                      Shelter: {r.shelter_name}
                    </Text>
                    {r.rental_begins && r.rental_ends && (
                      <Text size="sm" c="dimmed">
                        {new Date(r.rental_begins).toLocaleDateString()} — {new Date(r.rental_ends).toLocaleDateString()}
                      </Text>
                    )}
                    {r.total_cost !== null && (
                      <Text size="sm">Total: ${r.total_cost}</Text>
                    )}
                  </Stack>
                  <Stack gap={2} align="flex-end">
                    <Badge color={statusColor[r.status] ?? 'gray'}>{statusLabel[r.status] ?? r.status.replace(/_/g, ' ')}</Badge>
                    <Text size="xs" c="dimmed" ta="right" maw={220}>{statusDescriptionRenter[r.status]}</Text>
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

export default RenterRentalsPage;
