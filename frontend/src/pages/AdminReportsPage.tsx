import React, { useEffect, useState } from 'react';
import { Container, Title, Stack, Card, Group, Text, Badge, Button, Loader, Alert } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { getAdminReports, resolveReport, Report } from '../api/admin';

const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<number | null>(null);

  useEffect(() => {
    getAdminReports().then((data) => {
      if (data.error) setError('Failed to load reports.');
      else setReports(data.reports ?? []);
      setLoading(false);
    });
  }, []);

  const handleResolve = async (id: number) => {
    setResolving(id);
    const result = await resolveReport(id);
    setResolving(null);
    if (result.error) setError(result.error);
    else setReports((prev) => prev.map((r) => r.id === id ? { ...r, is_resolved: true } : r));
  };

  return (
    <>
      <Topbar />
      <Container my={40}>
        <Title order={2} mb="lg">Reports</Title>
        {error && <Alert color="red" mb="md">{error}</Alert>}
        {loading ? <Loader /> : reports.length === 0 ? (
          <Text c="dimmed">No reports.</Text>
        ) : (
          <Stack>
            {reports.map((r) => (
              <Card key={r.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Group gap="xs">
                      <Text size="sm">
                        <Text span fw={600} style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => navigate(`/renter/profile/${r.reporter_id}`)}>
                          {r.reporter_name}
                        </Text>
                        {' reported '}
                        <Text span fw={600} style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => navigate(`/shelter/profile/${r.reported_id}`)}>
                          {r.reported_name}
                        </Text>
                      </Text>
                      <Badge size="xs" color="gray" variant="light">{r.reason}</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">{r.body}</Text>
                  </Stack>
                  <Group gap="xs">
                    <Button size="xs" variant="outline" onClick={() => navigate(`/admin/report/${r.id}/chat`)}>View Chat</Button>
                    {r.is_resolved
                      ? <Badge color="green">Resolved</Badge>
                      : <Button size="xs" variant="outline" loading={resolving === r.id} onClick={() => handleResolve(r.id)}>Mark resolved</Button>
                    }
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </>
  );
};

export default AdminReportsPage;
