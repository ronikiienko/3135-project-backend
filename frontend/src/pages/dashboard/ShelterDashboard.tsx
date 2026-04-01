import React, { useEffect, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Button, Group, Loader, Image, Stack, Badge, Divider, Alert } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import CreateListingModal from '../../components/CreateListingModal';
import { Listing, getListings } from '../../api/listing';
import { getShelterMe, Shelter } from '../../api/shelter';
import { Rental, getRentals } from '../../api/rental';
import { LISTING_IMAGES_URL } from '../../api/config';
import { ACTIVE_STATUSES, statusColor, statusLabel, statusDescriptionShelter } from '../../utils/rentalStatus';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const ShelterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [listingMap, setListingMap] = useState<Map<number, Listing>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShelterMe().then(({ shelter }) => {
      if (!shelter) return;
      setShelter(shelter);
      Promise.all([getListings(), getRentals()]).then(([listingsData, rentalsData]) => {
        const own = (listingsData.listings ?? []).filter((l) => l.shelter_id === shelter.id);
        setListings(own);
        setListingMap(new Map(own.map((l) => [l.id, l])));
        setRentals(rentalsData.rentals ?? []);
        setLoading(false);
      });
    });
  }, []);

  const handleCreated = (listing: Listing) => {
    setListings((prev) => [listing, ...prev]);
    setListingMap((prev) => new Map(prev).set(listing.id, listing));
  };

  const activeRentals = rentals.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const recentlyClosed = rentals.filter(
    (r) => !ACTIVE_STATUSES.includes(r.status) && r.closed_at && new Date(r.closed_at).getTime() >= Date.now() - SEVEN_DAYS_MS,
  );
  const openListings = listings.filter((l) => !l.is_closed);
  const closedListings = listings.filter((l) => l.is_closed);
  const isSuspended = shelter !== null && shelter.suspended_until !== null && new Date(shelter.suspended_until) > new Date();

  return (
    <Container my={40}>
      {isSuspended && (
        <Alert color="red" title="Account Suspended" mb="lg">
          Your account is suspended until {new Date(shelter!.suspended_until!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          {' '}You cannot create new listings, and your listings are hidden from renters. Active rentals are unaffected.
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
                        <Text fw={600}>{listingMap.get(r.listing_id)?.name ?? `Listing #${r.listing_id}`}</Text>
                        <Text size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/renter/profile/${r.renter_id}`); }}>
                          Renter: {r.renter_name}
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
                          <Text fw={600}>{listingMap.get(r.listing_id)?.name ?? `Listing #${r.listing_id}`}</Text>
                          <Text size="sm" c="dimmed">Renter: {r.renter_name}</Text>
                        </Stack>
                        <Badge color={statusColor[r.status] ?? 'gray'}>{statusLabel[r.status] ?? r.status}</Badge>
                      </Group>
                      {statusDescriptionShelter[r.status] && (
                        <Alert color={statusColor[r.status] ?? 'gray'} variant="light" p="xs">
                          <Text size="xs">{statusDescriptionShelter[r.status]}</Text>
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
            <Group justify="space-between">
              <Title order={2}>Your Listings</Title>
              <Button onClick={() => setModalOpen(true)}>Create Listing</Button>
            </Group>
            {openListings.length === 0 ? (
              <Text c="dimmed">No active listings. Create your first one!</Text>
            ) : (
              <SimpleGrid cols={3}>
                {openListings.map((l) => (
                  <Card key={l.id} withBorder shadow="sm" radius="md" padding="sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/listing/${l.id}`)}>
                    {l.listing_images[0] && (
                      <Card.Section mb="sm">
                        <Image src={`${LISTING_IMAGES_URL}/${l.listing_images[0]}`} h={160} fit="contain" />
                      </Card.Section>
                    )}
                    <Text fw={600}>{l.name}</Text>
                    <Text size="sm" c="dimmed">{l.species} · {l.age} yrs · ${l.rate}/hr</Text>
                    <Text size="sm" mt="xs" lineClamp={2}>{l.description}</Text>
                    <Text size="xs" c="dimmed" mt={4}>Posted {new Date(l.created_at).toLocaleDateString()}</Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>

          {closedListings.length > 0 && (
            <Stack gap="sm">
              <Divider />
              <Group gap="sm">
                <Title order={3} c="dimmed">Closed Listings</Title>
                <Badge color="gray">{closedListings.length}</Badge>
              </Group>
              <SimpleGrid cols={3}>
                {closedListings.map((l) => (
                  <Card key={l.id} withBorder shadow="sm" radius="md" padding="sm" style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => navigate(`/listing/${l.id}`)}>
                    {l.listing_images[0] && (
                      <Card.Section mb="sm">
                        <Image src={`${LISTING_IMAGES_URL}/${l.listing_images[0]}`} h={160} fit="contain" />
                      </Card.Section>
                    )}
                    <Group gap="xs">
                      <Text fw={600}>{l.name}</Text>
                      <Badge color="red" size="xs">Closed</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">{l.species} · {l.age} yrs · ${l.rate}/hr</Text>
                    <Text size="sm" mt="xs" lineClamp={2}>{l.description}</Text>
                    <Text size="xs" c="dimmed" mt={4}>Posted {new Date(l.created_at).toLocaleDateString()}</Text>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Stack>
      )}

      <CreateListingModal opened={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </Container>
  );
};

export default ShelterDashboard;