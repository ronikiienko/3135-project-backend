import React, { useEffect, useState } from 'react';
import { Container, Title, Text, Stack, Avatar, Group, Loader, Alert, Paper, Badge, Button, Code, Divider } from '@mantine/core';
import { getAdminMe, createAdminToken, Admin } from '../api/admin';
import { AVATARS_URL } from '../api/config';
import Topbar from '../components/Topbar';

const AdminAccountPage: React.FC = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

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

            {admin.can_create_admins && (
              <>
                <Divider />
                <Stack gap="sm">
                  <Title order={4}>Invite Admin</Title>
                  <Text size="sm" c="dimmed">Generate a one-time token to share with the new admin. It expires in 48 hours and is consumed on use.</Text>
                  {tokenError && <Alert color="red">{tokenError}</Alert>}
                  {generatedToken && (
                    <Stack gap={4}>
                      <Text size="sm" fw={500}>Share this token:</Text>
                      <Code block>{generatedToken}</Code>
                      <Text size="xs" c="dimmed">Expires: {tokenExpiresAt ? new Date(tokenExpiresAt).toLocaleString() : ''}</Text>
                    </Stack>
                  )}
                  <Button
                    variant="outline"
                    color="grape"
                    loading={tokenLoading}
                    onClick={async () => {
                      setTokenLoading(true);
                      setTokenError(null);
                      setGeneratedToken(null);
                      const data = await createAdminToken();
                      setTokenLoading(false);
                      if (data.error) setTokenError('Failed to generate token.');
                      else { setGeneratedToken(data.adminToken!); setTokenExpiresAt(data.expiresAt!); }
                    }}
                  >
                    Generate invite token
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default AdminAccountPage;