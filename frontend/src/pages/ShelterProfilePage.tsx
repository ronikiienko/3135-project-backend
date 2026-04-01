import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, Stack, Avatar, Group, Image, SimpleGrid, Loader, Alert, Paper, Badge, Rating, Divider, Anchor, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/en';
import Topbar from '../components/Topbar';
import { getShelterProfile, ShelterPublicProfile } from '../api/profile';
import { getReviews, Review } from '../api/rental';
import { statusLabel, statusColor } from '../utils/rentalStatus';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';
import { suspendUser } from '../api/admin';
import { useRole } from '../hooks/useRole';

const ShelterProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shelter, setShelter] = useState<ShelterPublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suspendUntil, setSuspendUntil] = useState<Date | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const role = useRole();

  useEffect(() => {
    if (!id) return;
    getShelterProfile(Number(id)).then((data) => {
      if (data.error) setError('Shelter not found.');
      else if (data.shelter) setShelter(data.shelter);
    });
    getReviews(Number(id)).then((data) => {
      if (data.reviews) setReviews(data.reviews);
    });
  }, [id]);

  if (!shelter && !error) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40}>
        {error && <Alert color="red" mb="lg">{error}</Alert>}
        {shelter && (
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
                    <Badge color="blue">Shelter</Badge>
                    {shelter.is_verified
                      ? <Badge color="green">Verified</Badge>
                      : <Badge color="gray">Not verified</Badge>
                    }
                  </Group>
                  <Button size="xs" variant="outline" onClick={() => navigate(`/messages/${shelter.id}`, { state: { correspondentName: shelter.name } })}>Message</Button>
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

              {reviews.length > 0 && (
                <Stack gap="sm">
                  <Divider />
                  <Text fw={500}>Reviews</Text>
                  {reviews.map((review) => (
                    <Paper key={review.id} withBorder p="sm" radius="md">
                      <Stack gap={4}>
                        <Group justify="space-between">
                          <Anchor size="sm" fw={500} onClick={() => navigate(`/renter/profile/${review.reviewer_id}`)} style={{ cursor: 'pointer' }}>
                            {review.reviewer_name}
                          </Anchor>
                          <Text size="xs" c="dimmed">{new Date(review.created_at).toLocaleDateString()}</Text>
                        </Group>
                        <Rating value={review.score * 5} readOnly fractions={2} />
                        <Text size="sm">{review.body}</Text>
                        <Group gap="xs">
                          {review.listing_id && (
                            <Anchor size="xs" c="dimmed" onClick={() => navigate(`/listing/${review.listing_id}`)} style={{ cursor: 'pointer' }}>
                              Re: {review.listing_name}
                            </Anchor>
                          )}
                          {review.rental_status && (
                            <Badge size="xs" color={statusColor[review.rental_status]} variant="light">
                              {statusLabel[review.rental_status] ?? review.rental_status}
                            </Badge>
                          )}
                        </Group>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}

              {role === 'ADMIN' && (
                <Stack gap="sm">
                  <Divider />
                  <Text fw={500}>Admin: Suspension</Text>
                  {shelter.suspended_until && new Date(shelter.suspended_until) > new Date() && (
                    <Alert color="orange">
                      Currently suspended until {new Date(shelter.suspended_until).toLocaleString()}.
                    </Alert>
                  )}
                  {suspendError && <Alert color="red">{suspendError}</Alert>}
                  <Group align="flex-end">
                    <DateTimePicker
                      label="Suspend until"
                      placeholder="Pick date and time"
                      value={suspendUntil}
                      onChange={setSuspendUntil}
                      minDate={new Date()}
                      clearable
                    />
                    <Button
                      color="orange"
                      loading={suspending}
                      disabled={!suspendUntil}
                      onClick={async () => {
                        if (!suspendUntil) return;
                        setSuspending(true);
                        setSuspendError(null);
                        const result = await suspendUser(shelter.id, new Date(suspendUntil).toISOString());
                        setSuspending(false);
                        if (result.error) {
                          setSuspendError(result.error);
                        } else {
                          setShelter({ ...shelter, suspended_until: suspendUntil.toISOString() });
                          setSuspendUntil(null);
                        }
                      }}
                    >
                      Suspend
                    </Button>
                    {shelter.suspended_until && new Date(shelter.suspended_until) > new Date() && (
                      <Button
                        color="gray"
                        variant="outline"
                        loading={suspending}
                        onClick={async () => {
                          setSuspending(true);
                          setSuspendError(null);
                          const result = await suspendUser(shelter.id, null);
                          setSuspending(false);
                          if (result.error) {
                            setSuspendError(result.error);
                          } else {
                            setShelter({ ...shelter, suspended_until: null });
                          }
                        }}
                      >
                        Lift suspension
                      </Button>
                    )}
                  </Group>
                </Stack>
              )}

            </Stack>
          </Paper>
        )}
      </Container>
    </>
  );
};

export default ShelterProfilePage;