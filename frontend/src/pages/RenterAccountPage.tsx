import React, { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Avatar,
  Group,
  Image,
  SimpleGrid,
  Loader,
  Alert,
  Paper,
} from '@mantine/core';
import { getRenterMe, Renter } from '../api/renter';
import { AVATARS_URL } from '../api/config';
import Topbar from '../components/Topbar';

const RenterAccountPage: React.FC = () => {
  const [renter, setRenter] = useState<Renter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRenterMe().then((data) => {
      if (data.error) {
        setError('Failed to load account details.');
      } else if (data.renter) {
        setRenter(data.renter);
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

  if (!renter) {
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
              src={renter.avatar_filename ? `${AVATARS_URL}/${renter.avatar_filename}` : undefined}
              size="xl"
              radius="xl"
              color="blue"
            >
              {renter.fName.charAt(0)}
            </Avatar>
            <Stack gap={4}>
              <Title order={2}>{renter.fName} {renter.lName}</Title>
              <Text c="dimmed">{renter.email}</Text>
            </Stack>
          </Group>

          <Stack gap={4}>
            <Text fw={500}>Location</Text>
            <Text>{renter.location}</Text>
          </Stack>

          <Stack gap={4}>
            <Text fw={500}>Description</Text>
            <Text>{renter.description}</Text>
          </Stack>

          {renter.rating !== null && (
            <Stack gap={4}>
              <Text fw={500}>Rating</Text>
              <Text>{(renter.rating * 5).toFixed(1)} / 5</Text>
            </Stack>
          )}

          {renter.profile_images.length > 0 && (
            <Stack gap={4}>
              <Text fw={500}>Profile Images</Text>
              <SimpleGrid cols={3}>
                {renter.profile_images.map((filename) => (
                  <Image
                    key={filename}
                    src={`${AVATARS_URL}/${filename}`}
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

export default RenterAccountPage;