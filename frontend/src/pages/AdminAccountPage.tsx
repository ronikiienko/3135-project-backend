import React, { useEffect, useState } from 'react';
import { Container, Title, Text, Stack, Avatar, Group, Loader, Alert, Paper, Badge } from '@mantine/core';
import { getAdminMe, Admin } from '../api/admin';
import { AVATARS_URL } from '../api/config';
import Topbar from '../components/Topbar';

const AdminAccountPage: React.FC = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminMe().then((data) => {
      if (data.error) setError('Failed to load account details.');
      else if (data.admin) setAdmin(data.admin);
    });
  }, []);

  if (error) {
    return (
      <Container my={40}>
        <Alert color="red">{error}</Alert>
      </Container>
    );
  }

  if (!admin) {
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
                src={admin.avatar_filename ? `${AVATARS_URL}/${admin.avatar_filename}` : undefined}
                size="xl"
                radius="xl"
                color="blue"
              >
                {admin.name.charAt(0)}
              </Avatar>
              <Stack gap={4}>
                <Group gap="xs">
                  <Title order={2}>{admin.name}</Title>
                  {admin.can_create_admins && <Badge color="grape">Can create admins</Badge>}
                </Group>
                <Text c="dimmed">{admin.email}</Text>
              </Stack>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default AdminAccountPage;