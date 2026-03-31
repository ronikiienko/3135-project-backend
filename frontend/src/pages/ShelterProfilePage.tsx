import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, Stack, Avatar, Group, Image, SimpleGrid, Loader, Alert, Paper, Badge, Rating, Divider, Anchor, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getShelterProfile, ShelterPublicProfile } from '../api/profile';
import { getReviews, Review } from '../api/rental';
import { statusLabel, statusColor } from '../utils/rentalStatus';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';

const ShelterProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shelter, setShelter] = useState<ShelterPublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

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

          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default ShelterProfilePage;
