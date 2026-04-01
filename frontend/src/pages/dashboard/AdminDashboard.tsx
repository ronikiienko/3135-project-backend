import React, { useEffect, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Button, Group, Loader, Stack, Badge, Divider, Alert } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Shelter } from '../../api/shelter';
import { Rental } from '../../api/rental';
import { getAdminMe, getAdminShelters, getAdminDisputes, verifyShelter, resolveDispute } from '../../api/admin';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<number | null>(null);
  const [assignedShelters, setAssignedShelters] = useState<Shelter[]>([]);
  const [assignedDisputes, setAssignedDisputes] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [resolving, setResolving] = useState<number | null>(null);

  useEffect(() => {
    getAdminMe().then(({ admin }) => {
      if (!admin) return;
      setAdminId(admin.id);
      Promise.all([getAdminShelters(), getAdminDisputes()]).then(([sheltersData, disputesData]) => {
        setAssignedShelters((sheltersData.shelters ?? []).filter((s) => s.assigned_admin_id === admin.id && !s.is_verified));
        setAssignedDisputes((disputesData.disputes ?? []).filter((d) => d.assigned_admin_id === admin.id));
        setLoading(false);
      });
    });
  }, []);

  const handleVerify = async (id: number) => {
    setVerifying(id);
    setError(null);
    const result = await verifyShelter(id);
    setVerifying(null);
    if (result.error) setError(result.error);
    else setAssignedShelters((prev) => prev.filter((x) => x.id !== id));
  };

  const handleResolve = async (id: number, resolution: 'IN_FAVOR_OF_SHELTER' | 'IN_FAVOR_OF_RENTER') => {
    setResolving(id);
    setError(null);
    const result = await resolveDispute(id, resolution);
    setResolving(null);
    if (result.error) setError(result.error);
    else setAssignedDisputes((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <Container my={40}>
      <Stack gap="xl">
        {error && <Alert color="red">{error}</Alert>}
        {loading ? <Loader /> : (
          <>
            {(assignedShelters.length > 0 || assignedDisputes.length > 0) && (
              <Stack gap="sm">
                <Group gap="sm">
                  <Title order={2}>My Queue</Title>
                  <Badge color="blue">{assignedShelters.length + assignedDisputes.length}</Badge>
                </Group>
                <Stack gap="xs">
                  {assignedShelters.map((s) => (
                    <Card key={s.id} withBorder padding="sm" radius="md">
                      <Group justify="space-between">
                        <Stack gap={2} style={{ cursor: 'pointer' }} onClick={() => navigate(`/shelter/profile/${s.id}`)}>
                          <Text fw={600}>{s.name}</Text>
                          <Text size="sm" c="dimmed">{s.location}</Text>
                        </Stack>
                        <Group gap="sm">
                          <Badge color="yellow">Pending verification</Badge>
                          <Button size="xs" color="green" loading={verifying === s.id} onClick={() => handleVerify(s.id)}>
                            Verify
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                  {assignedDisputes.map((d) => (
                    <Card key={d.id} withBorder padding="sm" radius="md">
                      <Group justify="space-between">
                        <Stack gap={2} style={{ cursor: 'pointer' }} onClick={() => navigate(`/rental/${d.id}`)}>
                          <Text fw={600}>{d.listing_name}</Text>
                          <Text size="sm" c="dimmed">{d.renter_name} · {d.shelter_name}</Text>
                        </Stack>
                        <Group gap="sm">
                          <Badge color="orange">Dispute</Badge>
                          <Button size="xs" variant="outline" onClick={() => navigate(`/admin/dispute/${d.id}/chat`)}>
                            View Chat
                          </Button>
                          <Button size="xs" color="blue" variant="outline" loading={resolving === d.id} onClick={() => handleResolve(d.id, 'IN_FAVOR_OF_SHELTER')}>
                            Shelter wins
                          </Button>
                          <Button size="xs" color="red" variant="outline" loading={resolving === d.id} onClick={() => handleResolve(d.id, 'IN_FAVOR_OF_RENTER')}>
                            Renter wins
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
                <Divider />
              </Stack>
            )}
          </>
        )}

        <Stack gap="sm">
          <Title order={2}>Admin Panel</Title>
          <SimpleGrid cols={3}>
            <Card withBorder shadow="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/shelters')}>
              <Text fw={600}>Shelters</Text>
              <Text size="sm" c="dimmed">Claim and verify pending shelter accounts</Text>
            </Card>
            <Card withBorder shadow="sm" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/disputes')}>
              <Text fw={600}>Disputes</Text>
              <Text size="sm" c="dimmed">Claim and resolve open rental disputes</Text>
            </Card>
          </SimpleGrid>
        </Stack>
      </Stack>
    </Container>
  );
};

export default AdminDashboard;