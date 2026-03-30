import React, { useEffect, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Button, Group, Loader, Image } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import CreateListingModal from '../components/CreateListingModal';
import { Listing, getListings } from '../api/listing';
import { getShelterMe } from '../api/shelter';
import { LISTING_IMAGES_URL } from '../api/config';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShelterMe().then(({ shelter }) => {
      if (!shelter) return;
      getListings().then(({ listings: all }) => {
        if (all) setListings(all.filter((l) => l.shelter_id === shelter.id));
        setLoading(false);
      });
    });
  }, []);

  const handleCreated = (listing: Listing) => {
    setListings((prev) => [listing, ...prev]);
  };

  return (
    <Container my={40}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Your Listings</Title>
        <Button onClick={() => setModalOpen(true)}>Create Listing</Button>
      </Group>

      {loading ? <Loader /> : listings.length === 0 ? (
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

      <CreateListingModal opened={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
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
    </>
  );
};

export default DashboardPage;