import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, Stack, Avatar, Group, Image, SimpleGrid, Loader, Alert, Paper, Badge } from '@mantine/core';
import Topbar from '../components/Topbar';
import { getShelterProfile, ShelterPublicProfile } from '../api/profile';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';

const ShelterProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shelter, setShelter] = useState<ShelterPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getShelterProfile(Number(id)).then((data) => {
      if (data.error) setError('Shelter not found.');
      else if (data.shelter) setShelter(data.shelter);
    });
  }, [id]);

  if (error) return (
    <>
      <Topbar />
      <Container my={40}><Alert color="red">{error}</Alert></Container>
    </>
  );

  if (!shelter) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40}>
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Stack>
            <Group>
              <Avatar
                src={shelter.avatar_filename ? `${AVATARS_URL}/${shelter.avatar_filename}` : undefined}
                size="xl"
                radius="xl"
                color="blue"
              >
                {shelter.name.charAt(0)}
              </Avatar>
              <Stack gap={4}>
                <Group gap="xs">
                  <Title order={2}>{shelter.name}</Title>
                  {shelter.is_verified
                    ? <Badge color="green">Verified</Badge>
                    : <Badge color="gray">Not verified</Badge>
                  }
                </Group>
                {shelter.rating !== null && (
                  <Text size="sm" c="dimmed">Rating: {(shelter.rating * 5).toFixed(1)} / 5</Text>
                )}
              </Stack>
            </Group>

            <Stack gap={4}>
              <Text fw={500}>Location</Text>
              <Text>{shelter.location}</Text>
            </Stack>

            <Stack gap={4}>
              <Text fw={500}>About</Text>
              <Text>{shelter.description}</Text>
            </Stack>

            {shelter.profile_images.length > 0 && (
              <Stack gap={4}>
                <Text fw={500}>Photos</Text>
                <SimpleGrid cols={3}>
                  {shelter.profile_images.map((filename) => (
                    <Image key={filename} src={`${PROFILE_IMAGES_URL}/${filename}`} radius="md" fit="cover" h={120} />
                  ))}
                </SimpleGrid>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default ShelterProfilePage;
