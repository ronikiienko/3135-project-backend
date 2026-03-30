import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Stack, Group, Badge, Image, SimpleGrid, Loader, Alert, Paper, Anchor } from '@mantine/core';
import { getShelterProfile, ShelterPublicProfile } from '../api/profile';
import Topbar from '../components/Topbar';
import { getListing, Listing } from '../api/listing';
import { LISTING_IMAGES_URL } from '../api/config';

const ListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [shelter, setShelter] = useState<ShelterPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

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
              <Group>
                {/* Request Rental button goes here */}
              </Group>
            )}

            {role === 'SHELTER' && !listing.is_closed && (
              <Group>
                {/* Close Listing button goes here */}
              </Group>
            )}
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default ListingPage;