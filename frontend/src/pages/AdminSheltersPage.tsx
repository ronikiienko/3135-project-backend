import React, { useEffect, useState } from 'react';
import { Container, Title, Table, Badge, Button, Loader, Alert, Group, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getAdminShelters, assignShelterVerification, getAdminMe } from '../api/admin';
import { Shelter } from '../api/shelter';

const AdminSheltersPage: React.FC = () => {
  const navigate = useNavigate();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);

  const [adminId, setAdminId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getAdminMe(), getAdminShelters()]).then(([meData, sheltersData]) => {
      if (meData.admin) setAdminId(meData.admin.id);
      if (sheltersData.error) setError('Failed to load shelters.');
      else if (sheltersData.shelters) setShelters(sheltersData.shelters);
      setLoading(false);
    });
  }, []);

  const handleClaim = async (id: number) => {
    setClaiming(id);
    setError(null);
    const data = await assignShelterVerification(id);
    if (data.error) setError(data.error);
    else setShelters((prev) => prev.map((s) => s.id === id ? { ...s, assigned_admin_id: adminId } : s));
    setClaiming(null);
  };

  const unverified = shelters.filter((s) => !s.is_verified && s.assigned_admin_id === null);

  if (loading) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40}>
        <Group justify="space-between" mb="lg">
          <Title order={2}>Unassigned Shelter Verifications</Title>
          <Badge color="yellow" variant="light">{unverified.length} pending</Badge>
        </Group>
        {error && <Alert color="red" mb="md">{error}</Alert>}

        {unverified.length === 0 ? (
          <Text c="dimmed">No shelters pending verification.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {unverified.map((shelter) => (
                <Table.Tr key={shelter.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/shelter/profile/${shelter.id}`)}>
                  <Table.Td>{shelter.name}</Table.Td>
                  <Table.Td>{shelter.email}</Table.Td>
                  <Table.Td>{shelter.location}</Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Button size="xs" variant="outline" loading={claiming === shelter.id} onClick={() => handleClaim(shelter.id)}>
                      Claim
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Container>
    </>
  );
};

export default AdminSheltersPage;
