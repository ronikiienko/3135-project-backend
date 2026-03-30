import React, { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Badge,
  Avatar,
  Group,
  Image,
  SimpleGrid,
  Loader,
  Alert,
  Paper,
} from '@mantine/core';
import { getShelterMe, Shelter } from '../api/shelter';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';
import Topbar from '../components/Topbar';

const ShelterAccountPage: React.FC = () => {
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getShelterMe().then((data) => {
      if (data.error) {
        setError('Failed to load account details.');
      } else if (data.shelter) {
        setShelter(data.shelter);
      }
    });
  }, []);

  if (error) {
    return (
      <Container my={40}>
        <Alert color="red">{error}</Alert>
      </Container>
    );
  }

  if (!shelter) {
    return (
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader />
      </Container>
    );
  }

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
                {shelter.is_verified ? (
                  <Badge color="green">Verified</Badge>
                ) : (
                  <Badge color="gray">Not verified</Badge>
                )}
              </Group>
              <Text c="dimmed">{shelter.email}</Text>
            </Stack>
          </Group>

          <Stack gap={4}>
            <Text fw={500}>Location</Text>
            <Text>{shelter.location}</Text>
          </Stack>

          <Stack gap={4}>
            <Text fw={500}>Description</Text>
            <Text>{shelter.description}</Text>
          </Stack>

          {shelter.rating !== null && (
            <Stack gap={4}>
              <Text fw={500}>Rating</Text>
              <Text>{(shelter.rating * 5).toFixed(1)} / 5</Text>
            </Stack>
          )}

          {shelter.profile_images.length > 0 && (
            <Stack gap={4}>
              <Text fw={500}>Profile Images</Text>
              <SimpleGrid cols={3}>
                {shelter.profile_images.map((filename) => (
                  <Image
                    key={filename}
                    src={`${PROFILE_IMAGES_URL}/${filename}`}
                    radius="md"
                    fit="cover"
                    h={120}
                  />
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

export default ShelterAccountPage;