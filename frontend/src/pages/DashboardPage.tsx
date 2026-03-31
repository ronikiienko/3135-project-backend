import React, { useEffect, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Button, Group, Loader, Image, Stack, Badge, Divider, Alert, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import CreateListingModal from '../components/CreateListingModal';
import { Listing, getListings } from '../api/listing';
import { getShelterMe, Shelter } from '../api/shelter';
import { getRenterMe, Renter } from '../api/renter';
import { Rental, getRentals } from '../api/rental';
import { getAdminMe, getAdminShelters, getAdminDisputes, verifyShelter, resolveDispute } from '../api/admin';
import { LISTING_IMAGES_URL } from '../api/config';
import { statusColor, statusLabel, statusDescriptionRenter, statusDescriptionShelter } from '../utils/rentalStatus';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<number | null>(null);
  const [assignedShelters, setAssignedShelters] = useState<Shelter[]>([]);
  const [assignedDisputes, setAssignedDisputes] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [resolving, setResolving] = useState<number | null>(null);

  useEffect(() => {
    getAdminMe().then(({ admin }) => {
      if (!admin) return;
      setAdminId(admin.id);
      Promise.all([getAdminShelters(), getAdminDisputes()]).then(([sheltersData, disputesData]) => {
        setAssignedShelters((sheltersData.shelters ?? []).filter((s) => s.assigned_admin_id === admin.id && !s.is_verified));
        setAssignedDisputes((disputesData.disputes ?? []).filter((d) => d.assigned_admin_id === admin.id));
        setLoading(false);
      });
    });
  }, []);

  return (
    <Container my={40}>
      <Stack gap="xl">
        {loading ? <Loader /> : (
          <>
            {(assignedShelters.length > 0 || assignedDisputes.length > 0) && (
              <Stack gap="sm">
                <Group gap="sm">
                  <Title order={2}>My Queue</Title>
                  <Badge color="blue">{assignedShelters.length + assignedDisputes.length}</Badge>
                </Group>
                <Stack gap="xs">
                  {assignedShelters.map((s) => (
                    <Card key={s.id} withBorder padding="sm" radius="md">
                      <Group justify="space-between">
                        <Stack gap={2} style={{ cursor: 'pointer' }} onClick={() => navigate(`/shelter/profile/${s.id}`)}>
                          <Text fw={600}>{s.name}</Text>
                          <Text size="sm" c="dimmed">{s.location}</Text>
                        </Stack>
                        <Group gap="sm">
                          <Badge color="yellow">Pending verification</Badge>
                          <Button
                            size="xs"
                            color="green"
                            loading={verifying === s.id}
                            onClick={async () => {
                              setVerifying(s.id);
                              const result = await verifyShelter(s.id);
                              setVerifying(null);
                              if (!result.error) setAssignedShelters((prev) => prev.filter((x) => x.id !== s.id));
                            }}
                          >
                            Verify
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                  {assignedDisputes.map((d) => (
                    <Card key={d.id} withBorder padding="sm" radius="md">
                      <Group justify="space-between">
                        <Stack gap={2} style={{ cursor: 'pointer' }} onClick={() => navigate(`/rental/${d.id}`)}>
                          <Text fw={600}>{d.listing_name}</Text>
                          <Text size="sm" c="dimmed">{d.renter_name} · {d.shelter_name}</Text>
                        </Stack>
                        <Group gap="sm">
                          <Badge color="orange">Dispute</Badge>
                          <Button
                            size="xs"
                            color="blue"
                            variant="outline"
                            loading={resolving === d.id}
                            onClick={async () => {
                              setResolving(d.id);
                              const result = await resolveDispute(d.id, 'IN_FAVOR_OF_SHELTER');
                              setResolving(null);
                              if (!result.error) setAssignedDisputes((prev) => prev.filter((x) => x.id !== d.id));
                            }}
                          >
                            Shelter wins
                          </Button>
                          <Button
                            size="xs"
                            color="red"
                            variant="outline"
                            loading={resolving === d.id}
                            onClick={async () => {
                              setResolving(d.id);
                              const result = await resolveDispute(d.id, 'IN_FAVOR_OF_RENTER');
                              setResolving(null);
                              if (!result.error) setAssignedDisputes((prev) => prev.filter((x) => x.id !== d.id));
                            }}
                          >
                            Renter wins
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
                <Divider />
              </Stack>
            )}
          </>
        )}

        <Stack gap="sm">
          <Title order={2}>Admin Panel</Title>
          <SimpleGrid cols={3}>
            <Card withBorder shadow="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/shelters')}>
              <Text fw={600}>Shelters</Text>
              <Text size="sm" c="dimmed">Claim and verify pending shelter accounts</Text>
            </Card>
            <Card withBorder shadow="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/disputes')}>
              <Text fw={600}>Disputes</Text>
              <Text size="sm" c="dimmed">Claim and resolve open rental disputes</Text>
            </Card>
          </SimpleGrid>
        </Stack>
      </Stack>
    </Container>
  );
};


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
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyClosed = rentals.filter(
    (r) => !activeStatuses.includes(r.status) && r.closed_at && new Date(r.closed_at).getTime() >= sevenDaysAgo,
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

const RenterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [renter, setRenter] = useState<Renter | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDescription, setFilterDescription] = useState('');

  const activeStatuses = ['REQUESTED', 'PAYMENT_PENDING', 'PAID', 'DISPUTE'];

  useEffect(() => {
    console.log('hello world');
    Promise.all([
      getRenterMe(),
      getListings(),
      getRentals(),
    ]).then(([renterData, listingsData, rentalsData]) => {
      console.log('renterData:', renterData);
      if (renterData.renter) setRenter(renterData.renter);
      setListings((listingsData.listings ?? []).filter((l) => !l.is_closed));
      setRentals(rentalsData.rentals ?? []);
      setLoading(false);
    });
  }, []);

  const activeRentals = rentals.filter((r) => activeStatuses.includes(r.status));

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyClosed = rentals.filter(
    (r) => !activeStatuses.includes(r.status) && r.closed_at && new Date(r.closed_at).getTime() >= sevenDaysAgo,
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
                        <Text
                          size="sm"
                          c="blue"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/shelter/profile/${r.shelter_id}`); }}
                        >
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
                    <Text
                      size="sm"
                      c="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/shelter/profile/${l.shelter_id}`); }}
                    >
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
