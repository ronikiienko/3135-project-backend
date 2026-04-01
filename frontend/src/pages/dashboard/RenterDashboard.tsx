import React, { useEffect, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Group, Loader, Image, Stack, Badge, Divider, Alert, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Listing, getListings } from '../../api/listing';
import { getRenterMe, Renter } from '../../api/renter';
import { Rental, getRentals } from '../../api/rental';
import { LISTING_IMAGES_URL } from '../../api/config';
import { ACTIVE_STATUSES, statusColor, statusLabel, statusDescriptionRenter } from '../../utils/rentalStatus';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const RenterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [renter, setRenter] = useState<Renter | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDescription, setFilterDescription] = useState('');

  useEffect(() => {
    Promise.all([getRenterMe(), getListings(), getRentals()]).then(([renterData, listingsData, rentalsData]) => {
      if (renterData.renter) setRenter(renterData.renter);
      setListings((listingsData.listings ?? []).filter((l) => !l.is_closed));
      setRentals(rentalsData.rentals ?? []);
      setLoading(false);
    });
  }, []);

  const activeRentals = rentals.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const recentlyClosed = rentals.filter(
    (r) => !ACTIVE_STATUSES.includes(r.status) && r.closed_at && new Date(r.closed_at).getTime() >= Date.now() - SEVEN_DAYS_MS,
  );
  const filteredListings = listings.filter((l) =>
    l.name.toLowerCase().includes(filterName.toLowerCase()) &&
    (l.shelter_location ?? '').toLowerCase().includes(filterLocation.toLowerCase()) &&
    l.description.toLowerCase().includes(filterDescription.toLowerCase()),
  );
  const isSuspended = renter !== null && renter.suspended_until !== null && new Date(renter.suspended_until) > new Date();

  return (
    <Container my={40}>
      {isSuspended && (
        <Alert color="red" title="Account Suspended" mb="lg">
          Your account is suspended until {new Date(renter!.suspended_until!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          {' '}You cannot initiate new rental requests. Active rentals are unaffected.
        </Alert>
      )}
      {loading ? <Loader /> : (
        <Stack gap="xl">
          {activeRentals.length > 0 && (
            <Stack gap="sm">
              <Group gap="sm">
                <Title order={2}>Active Rentals</Title>
                <Badge color="yellow">{activeRentals.length}</Badge>
              </Group>
              <Stack gap="xs">
                {activeRentals.map((r) => (
                  <Card key={r.id} withBorder padding="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate(`/rental/${r.id}`)}>
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Text fw={600}>{r.listing_name}</Text>
                        <Text size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/shelter/profile/${r.shelter_id}`); }}>
                          Shelter: {r.shelter_name}
                        </Text>
                      </Stack>
                      <Badge color={statusColor[r.status] ?? 'gray'}>{statusLabel[r.status] ?? r.status}</Badge>
                    </Group>
                  </Card>
                ))}
              </Stack>
              <Divider />
            </Stack>
          )}

          {recentlyClosed.length > 0 && (
            <Stack gap="sm">
              <Title order={3} c="dimmed">Recently Closed</Title>
              <Stack gap="xs">
                {recentlyClosed.map((r) => (
                  <Card key={r.id} withBorder padding="sm" radius="md" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => navigate(`/rental/${r.id}`)}>
                    <Stack gap={6}>
                      <Group justify="space-between">
                        <Stack gap={2}>
                          <Text fw={600}>{r.listing_name}</Text>
                          <Text size="sm" c="dimmed">Shelter: {r.shelter_name}</Text>
                        </Stack>
                        <Badge color={statusColor[r.status] ?? 'gray'}>{statusLabel[r.status] ?? r.status}</Badge>
                      </Group>
                      {statusDescriptionRenter[r.status] && (
                        <Alert color={statusColor[r.status] ?? 'gray'} variant="light" p="xs">
                          <Text size="xs">{statusDescriptionRenter[r.status]}</Text>
                        </Alert>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
              <Divider />
            </Stack>
          )}

          <Stack gap="sm">
            <Title order={2}>Available Pets</Title>
            <Group grow>
              <TextInput placeholder="Search by name" value={filterName} onChange={(e) => setFilterName(e.currentTarget.value)} />
              <TextInput placeholder="Filter by location" value={filterLocation} onChange={(e) => setFilterLocation(e.currentTarget.value)} />
              <TextInput placeholder="Filter by description" value={filterDescription} onChange={(e) => setFilterDescription(e.currentTarget.value)} />
            </Group>
            {filteredListings.length === 0 ? (
              <Text c="dimmed">{listings.length === 0 ? 'No listings available right now.' : 'No listings match your search.'}</Text>
            ) : (
              <SimpleGrid cols={3}>
                {filteredListings.map((l) => (
                  <Card key={l.id} withBorder shadow="sm" radius="md" padding="sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/listing/${l.id}`)}>
                    {l.listing_images[0] && (
                      <Card.Section mb="sm">
                        <Image src={`${LISTING_IMAGES_URL}/${l.listing_images[0]}`} h={160} fit="contain" />
                      </Card.Section>
                    )}
                    <Text fw={600}>{l.name}</Text>
                    <Text size="sm" c="dimmed">{l.species} · {l.age} yrs · ${l.rate}/hr</Text>
                    <Text size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/shelter/profile/${l.shelter_id}`); }}>
                      {l.shelter_name}
                    </Text>
                    {l.shelter_location && <Text size="xs" c="dimmed">{l.shelter_location}</Text>}
                    <Text size="sm" mt="xs" lineClamp={2}>{l.description}</Text>
                    <Text size="xs" c="dimmed" mt={4}>Posted {new Date(l.created_at).toLocaleDateString()}</Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};

export default RenterDashboard;