import React, { useEffect, useState } from 'react';
import { Container, Title, Table, Badge, Button, Loader, Alert, Group } from '@mantine/core';
import Topbar from '../components/Topbar';
import { getAdminShelters, verifyShelter } from '../api/admin';
import { Shelter } from '../api/shelter';

const AdminSheltersPage: React.FC = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    getAdminShelters().then((data) => {
      if (data.error) setError('Failed to load shelters.');
      else if (data.shelters) setShelters(data.shelters);
      setLoading(false);
    });
  }, []);

  const handleVerify = async (id: number) => {
    setVerifying(id);
    const data = await verifyShelter(id);
    if (!data.error) {
      setShelters((prev) => prev.map((s) => s.id === id ? { ...s, is_verified: true } : s));
    }
    setVerifying(null);
  };

  const pending = shelters.filter((s) => !s.is_verified);
  const verified = shelters.filter((s) => s.is_verified);

  if (loading) {
    return (
      <>
        <Topbar />
        <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}>
          <Loader />
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Topbar />
        <Container my={40}>
          <Alert color="red">{error}</Alert>
        </Container>
      </>
    );
  }

  const renderRows = (list: Shelter[]) =>
    list.map((shelter) => (
      <Table.Tr key={shelter.id}>
        <Table.Td>{shelter.name}</Table.Td>
        <Table.Td>{shelter.email}</Table.Td>
        <Table.Td>{shelter.location}</Table.Td>
        <Table.Td>
          {shelter.is_verified
            ? <Badge color="green">Verified</Badge>
            : <Badge color="yellow">Pending</Badge>
          }
        </Table.Td>
        <Table.Td>
          {!shelter.is_verified && (
            <Button
              size="xs"
              loading={verifying === shelter.id}
              onClick={() => handleVerify(shelter.id)}
            >
              Verify
            </Button>
          )}
        </Table.Td>
      </Table.Tr>
    ));

  return (
    <>
      <Topbar />
      <Container my={40}>
        <Group justify="space-between" mb="lg">
          <Title order={2}>Shelters</Title>
          <Badge color="yellow" variant="light">{pending.length} pending</Badge>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {renderRows(pending)}
            {renderRows(verified)}
          </Table.Tbody>
        </Table>
      </Container>
    </>
  );
};

export default AdminSheltersPage;