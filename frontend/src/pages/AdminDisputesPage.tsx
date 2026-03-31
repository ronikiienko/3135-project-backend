import React, { useEffect, useState } from 'react';
import { Container, Title, Table, Badge, Button, Loader, Alert, Group, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getAdminDisputes, assignDispute, getAdminMe } from '../api/admin';
import { Rental } from '../api/rental';

const AdminDisputesPage: React.FC = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);

  const [adminId, setAdminId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getAdminMe(), getAdminDisputes()]).then(([meData, disputesData]) => {
      if (meData.admin) setAdminId(meData.admin.id);
      if (disputesData.error) setError('Failed to load disputes.');
      else if (disputesData.disputes) setDisputes(disputesData.disputes.filter((d) => d.assigned_admin_id === null));
      setLoading(false);
    });
  }, []);

  const handleClaim = async (id: number) => {
    setClaiming(id);
    setError(null);
    const data = await assignDispute(id);
    if (data.error) setError(data.error);
    else setDisputes((prev) => prev.map((d) => d.id === id ? { ...d, assigned_admin_id: adminId } : d));
    setClaiming(null);
  };

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
          <Title order={2}>Unassigned Disputes</Title>
          <Badge color="red" variant="light">{disputes.length} open</Badge>
        </Group>
        {error && <Alert color="red" mb="md">{error}</Alert>}

        {disputes.length === 0 ? (
          <Text c="dimmed">No open disputes.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Rental</Table.Th>
                <Table.Th>Renter</Table.Th>
                <Table.Th>Shelter</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {disputes.map((dispute) => (
                  <Table.Tr key={dispute.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/rental/${dispute.id}`)}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{dispute.listing_name}</Text>
                      <Text size="xs" c="dimmed">#{dispute.id}</Text>
                    </Table.Td>
                    <Table.Td>{dispute.renter_name}</Table.Td>
                    <Table.Td>{dispute.shelter_name}</Table.Td>
                    <Table.Td><Text size="sm" lineClamp={2}>{dispute.dispute_reason}</Text></Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Button size="xs" variant="outline" color="red" loading={claiming === dispute.id} onClick={() => handleClaim(dispute.id)}>
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

export default AdminDisputesPage;
