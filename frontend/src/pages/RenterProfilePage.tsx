import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, Stack, Avatar, Group, Image, SimpleGrid, Loader, Alert, Paper, Badge } from '@mantine/core';
import Topbar from '../components/Topbar';
import { getRenterProfile, RenterPublicProfile } from '../api/profile';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';

const RenterProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [renter, setRenter] = useState<RenterPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getRenterProfile(Number(id)).then((data) => {
      if (data.error) setError('Renter not found.');
      else if (data.renter) setRenter(data.renter);
    });
  }, [id]);

  if (error) return (
    <>
      <Topbar />
      <Container my={40}><Alert color="red">{error}</Alert></Container>
    </>
  );

  if (!renter) return (
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
                src={renter.avatar_filename ? `${AVATARS_URL}/${renter.avatar_filename}` : undefined}
                size="xl"
                radius="xl"
                color="blue"
              >
                {renter.fName.charAt(0)}
              </Avatar>
              <Stack gap={4}>
                <Group gap="xs">
                  <Title order={2}>{renter.fName} {renter.lName}</Title>
                  <Badge color="teal">Renter</Badge>
                </Group>
                {renter.rating !== null && (
                  <Text size="sm" c="dimmed">Rating: {(renter.rating * 5).toFixed(1)} / 5</Text>
                )}
              </Stack>
            </Group>

            <Stack gap={4}>
              <Text fw={500}>Location</Text>
              <Text>{renter.location}</Text>
            </Stack>

            <Stack gap={4}>
              <Text fw={500}>About</Text>
              <Text>{renter.description}</Text>
            </Stack>

            {renter.profile_images.length > 0 && (
              <Stack gap={4}>
                <Text fw={500}>Photos</Text>
                <SimpleGrid cols={3}>
                  {renter.profile_images.map((filename) => (
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

export default RenterProfilePage;
