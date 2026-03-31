import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, Stack, Avatar, Group, Image, SimpleGrid, Loader, Alert, Paper, Badge, Rating, Divider, Anchor, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getRenterProfile, RenterPublicProfile } from '../api/profile';
import { getReviews, Review } from '../api/rental';
import { statusLabel, statusColor } from '../utils/rentalStatus';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';

const RenterProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [renter, setRenter] = useState<RenterPublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getRenterProfile(Number(id)).then((data) => {
      if (data.error) setError('Renter not found.');
      else if (data.renter) setRenter(data.renter);
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
                <Button size="xs" variant="outline" onClick={() => navigate(`/messages/${renter.id}`, { state: { correspondentName: `${renter.fName} ${renter.lName}` } })}>Message</Button>
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

            {reviews.length > 0 && (
              <Stack gap="sm">
                <Divider />
                <Text fw={500}>Reviews</Text>
                {reviews.map((review) => (
                  <Paper key={review.id} withBorder p="sm" radius="md">
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Anchor size="sm" fw={500} onClick={() => navigate(`/shelter/profile/${review.reviewer_id}`)} style={{ cursor: 'pointer' }}>
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

export default RenterProfilePage;
