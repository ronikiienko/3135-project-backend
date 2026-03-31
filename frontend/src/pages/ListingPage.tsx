import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Stack, Group, Badge, Image, SimpleGrid, Loader, Alert, Paper, Anchor, Button, Modal } from '@mantine/core';
import { getShelterProfile, ShelterPublicProfile } from '../api/profile';
import Topbar from '../components/Topbar';
import { getListing, Listing, closeListing } from '../api/listing';
import { initiateRental } from '../api/rental';
import { LISTING_IMAGES_URL } from '../api/config';

const ListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [shelter, setShelter] = useState<ShelterPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    getListing(Number(id)).then((data) => {
      if (data.error) setError('Listing not found.');
      else if (data.listing) {
        setListing(data.listing);
        getShelterProfile(data.listing.shelter_id).then(({ shelter }) => {
          if (shelter) setShelter(shelter);
        });
      }
    });
  }, [id]);

  if (error) return (
    <>
      <Topbar />
      <Container my={40}><Alert color="red">{error}</Alert></Container>
    </>
  );

  if (!listing) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  const role = localStorage.getItem('role');

  return (
    <>
      <Topbar />
      <Container my={40}>
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Stack>
            {listing.listing_images.length > 0 && (
              <SimpleGrid cols={listing.listing_images.length === 1 ? 1 : 3}>
                {listing.listing_images.map((filename) => (
                  <Image key={filename} src={`${LISTING_IMAGES_URL}/${filename}`} radius="md" fit="contain" h={200} />
                ))}
              </SimpleGrid>
            )}

            <Group gap="xs">
              <Title order={2}>{listing.name}</Title>
              {listing.is_closed && <Badge color="red">Closed</Badge>}
            </Group>

            {shelter && (
              <Group gap="xs">
                <Text size="sm">
                  Posted by{' '}
                  <Anchor onClick={() => navigate(`/shelter/profile/${shelter.id}`)} style={{ cursor: 'pointer' }}>
                    {shelter.name}
                  </Anchor>
                </Text>
                {shelter.is_verified && <Badge color="green" size="xs">Verified</Badge>}
                <Text size="sm" c="dimmed">· {new Date(listing.created_at).toLocaleDateString()}</Text>
              </Group>
            )}

            <Group gap="xl">
              <Text><b>Species:</b> {listing.species}</Text>
              <Text><b>Age:</b> {listing.age} yrs</Text>
              <Text><b>Rate:</b> ${listing.rate}/hr</Text>
            </Group>

            <Stack gap={4}>
              <Text fw={500}>Description</Text>
              <Text>{listing.description}</Text>
            </Stack>

            {role === 'RENTER' && !listing.is_closed && (
              <Stack gap="xs">
                <Button
                  onClick={async () => {
                    setRequesting(true);
                    const data = await initiateRental(listing.id);
                    setRequesting(false);
                    if (!data.error) setRequested(true);
                  }}
                  loading={requesting}
                  disabled={requested}
                >
                  {requested ? 'Request Sent' : 'Request Rental'}
                </Button>
                <Text size="xs" c="dimmed">
                  Sending a request does not guarantee a rental. The shelter will review it and propose rental terms, which you can accept or decline.{' '}
                  <Anchor size="xs" onClick={() => navigate('/help')}>Learn more</Anchor>
                </Text>
                <Text size="xs" c="dimmed">
                  You don't set dates when requesting — the shelter proposes the rental period as part of their response.
                  You can <Anchor size="xs" onClick={() => navigate(`/messages/${listing.shelter_id}`, { state: { correspondentName: shelter?.name ?? 'Shelter' } })}>message the shelter</Anchor> beforehand to discuss availability.
                </Text>
              </Stack>
            )}

            {role === 'SHELTER' && !listing.is_closed && (
              <Stack gap="xs">
                {closeError && <Alert color="red">{closeError}</Alert>}
                <Text size="sm" c="dimmed">
                  Closing a listing is <strong>irreversible</strong>. It will no longer appear to renters, but active rentals will not be affected.
                </Text>
                <Group>
                  <Button color="red" variant="outline" loading={closing} onClick={() => setShowCloseModal(true)}>
                    Close Listing
                  </Button>
                </Group>
              </Stack>
            )}
          </Stack>
        </Paper>

        <Modal opened={showCloseModal} onClose={() => setShowCloseModal(false)} title="Close this listing?" centered>
          <Stack gap="md">
            <Text>This listing will be permanently closed and hidden from renters. This cannot be undone. Active rentals will not be affected.</Text>
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setShowCloseModal(false)} disabled={closing}>Go back</Button>
              <Button
                color="red"
                loading={closing}
                onClick={async () => {
                  setClosing(true);
                  setCloseError(null);
                  const result = await closeListing(listing.id);
                  setClosing(false);
                  if (result.error) {
                    setCloseError(result.error);
                  } else {
                    setListing({ ...listing, is_closed: true });
                  }
                  setShowCloseModal(false);
                }}
              >
                Yes, close listing
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </>
  );
};

export default ListingPage;