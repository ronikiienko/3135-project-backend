import React, { useEffect, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Button, Group, Loader, Image, Stack, Badge, Divider } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import CreateListingModal from '../components/CreateListingModal';
import { Listing, getListings } from '../api/listing';
import { getShelterMe } from '../api/shelter';
import { Rental, getRentals } from '../api/rental';
import { LISTING_IMAGES_URL } from '../api/config';
import { statusColor, statusLabel } from '../utils/rentalStatus';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Container my={40}>
      <Title order={2} mb="lg">Admin Panel</Title>
      <SimpleGrid cols={3}>
        <Card withBorder shadow="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/shelters')}>
          <Text fw={600}>Shelters</Text>
          <Text size="sm" c="dimmed">Verify pending shelter accounts</Text>
        </Card>
      </SimpleGrid>
    </Container>
  );
};


const ShelterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [listingMap, setListingMap] = useState<Map<number, Listing>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShelterMe().then(({ shelter }) => {
      if (!shelter) return;
      Promise.all([
        getListings(),
        getRentals(),
      ]).then(([listingsData, rentalsData]) => {
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

  const activeStatuses = ['REQUESTED', 'PAYMENT_PENDING', 'PAID', 'DISPUTE'];
  const activeRentals = rentals.filter((r) => activeStatuses.includes(r.status));

  return (
    <Container my={40}>
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
                        <Text
                          size="sm"
                          c="blue"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/renter/profile/${r.renter_id}`); }}
                        >
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

          <Stack gap="sm">
            <Group justify="space-between">
              <Title order={2}>Your Listings</Title>
              <Button onClick={() => setModalOpen(true)}>Create Listing</Button>
            </Group>
            {listings.length === 0 ? (
              <Text c="dimmed">No listings yet. Create your first one!</Text>
            ) : (
              <SimpleGrid cols={3}>
                {listings.map((l) => (
                  <Card key={l.id} withBorder shadow="sm" radius="md" padding="sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/listing/${l.id}`)}>
                    {l.listing_images[0] && (
                      <Card.Section mb="sm">
                        <Image src={`${LISTING_IMAGES_URL}/${l.listing_images[0]}`} h={160} fit="contain" />
                      </Card.Section>
                    )}
                    <Text fw={600}>{l.name}</Text>
                    <Text size="sm" c="dimmed">{l.species} · {l.age} yrs · ${l.rate}/hr</Text>
                    <Text size="sm" mt="xs" lineClamp={2}>{l.description}</Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Stack>
      )}

      <CreateListingModal opened={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </Container>
  );
};

const RenterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListings().then(({ listings: all }) => {
      setListings((all ?? []).filter((l) => !l.is_closed));
      setLoading(false);
    });
  }, []);

  return (
    <Container my={40}>
      <Title order={2} mb="lg">Available Pets</Title>
      {loading ? <Loader /> : listings.length === 0 ? (
        <Text c="dimmed">No listings available right now.</Text>
      ) : (
        <SimpleGrid cols={3}>
          {listings.map((l) => (
            <Card key={l.id} withBorder shadow="sm" radius="md" padding="sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/listing/${l.id}`)}>
              {l.listing_images[0] && (
                <Card.Section mb="sm">
                  <Image src={`${LISTING_IMAGES_URL}/${l.listing_images[0]}`} h={160} fit="contain" />
                </Card.Section>
              )}
              <Text fw={600}>{l.name}</Text>
              <Text size="sm" c="dimmed">{l.species} · {l.age} yrs · ${l.rate}/hr</Text>
              <Text
                size="sm"
                c="blue"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/shelter/profile/${l.shelter_id}`); }}
              >
                {l.shelter_name}
              </Text>
              <Text size="sm" mt="xs" lineClamp={2}>{l.description}</Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
};

const DashboardPage: React.FC = () => {
  const role = localStorage.getItem('role');

  return (
    <>
      <Topbar />
      {role === 'ADMIN'   && <AdminDashboard />}
      {role === 'SHELTER' && <ShelterDashboard />}
      {role === 'RENTER'  && <RenterDashboard />}
    </>
  );
};

export default DashboardPage;