import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Text, Stack, Avatar, Group, Image, SimpleGrid, Loader, Alert, Paper, Badge, Rating, Divider, Anchor, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/en';
import Topbar from '../components/Topbar';
import { getRenterProfile, RenterPublicProfile } from '../api/profile';
import { getReviews, Review } from '../api/rental';
import { statusLabel, statusColor } from '../utils/rentalStatus';
import { AVATARS_URL, PROFILE_IMAGES_URL } from '../api/config';
import { suspendUser } from '../api/admin';
import { useRole } from '../hooks/useRole';
import ReportModal from '../components/ReportModal';

const RenterProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [renter, setRenter] = useState<RenterPublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suspendUntil, setSuspendUntil] = useState<Date | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const role = useRole();

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

  if (!renter && !error) return (
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
        {renter && (
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
                  <Text size="xs" c="dimmed">ID #{renter.id}</Text>
                  <Group gap="xs">
                    <Button size="xs" variant="outline" onClick={() => navigate(`/messages/${renter.id}`, { state: { correspondentName: `${renter.fName} ${renter.lName}` } })}>Message</Button>
                    {role === 'SHELTER' && <Button size="xs" color="red" variant="outline" onClick={() => setReportOpen(true)}>Report</Button>}
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

              {role === 'ADMIN' && (
                <Stack gap="sm">
                  <Divider />
                  <Text fw={500}>Admin: Suspension</Text>
                  {renter.suspended_until && new Date(renter.suspended_until) > new Date() && (
                    <Alert color="orange">
                      Currently suspended until {new Date(renter.suspended_until).toLocaleString()}.
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
                        const result = await suspendUser(renter.id, new Date(suspendUntil).toISOString());
                        setSuspending(false);
                        if (result.error) {
                          setSuspendError(result.error);
                        } else {
                          setRenter({ ...renter, suspended_until: new Date(suspendUntil).toISOString() });
                          setSuspendUntil(null);
                        }
                      }}
                    >
                      Suspend
                    </Button>
                    {renter.suspended_until && new Date(renter.suspended_until) > new Date() && (
                      <Button
                        color="gray"
                        variant="outline"
                        loading={suspending}
                        onClick={async () => {
                          setSuspending(true);
                          setSuspendError(null);
                          const result = await suspendUser(renter.id, null);
                          setSuspending(false);
                          if (result.error) {
                            setSuspendError(result.error);
                          } else {
                            setRenter({ ...renter, suspended_until: null });
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
      {renter && <ReportModal opened={reportOpen} onClose={() => setReportOpen(false)} reportedId={renter.id} reportedName={`${renter.fName} ${renter.lName}`} />}
    </>
  );
};

export default RenterProfilePage;