import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Stack, Text, Loader, Alert, Paper, Group, Avatar } from '@mantine/core';
import Topbar from '../components/Topbar';
import { getConversations, Conversation } from '../api/message';
import { AVATARS_URL } from '../api/config';

const ConversationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConversations().then((data) => {
      if (data.error) setError('Failed to load conversations.');
      else if (data.conversations) setConversations(data.conversations);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <>
      <Topbar />
      <Container my={40} style={{ display: 'flex', justifyContent: 'center' }}><Loader /></Container>
    </>
  );

  return (
    <>
      <Topbar />
      <Container my={40} size="sm">
        <Stack gap="md">
          {error && <Alert color="red">{error}</Alert>}
          <Title order={2}>Messages</Title>
          {conversations.length === 0 ? (
            <Text c="dimmed">No conversations yet.</Text>
          ) : (
            <Stack gap="xs">
              {conversations.map((conv) => (
                <Paper
                  key={conv.correspondent_id}
                  withBorder
                  p="md"
                  radius="md"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/messages/${conv.correspondent_id}`, { state: { correspondentName: conv.correspondent_name } })}
                >
                  <Group>
                    <Avatar
                      src={conv.avatar_filename ? `${AVATARS_URL}/${conv.avatar_filename}` : undefined}
                      radius="xl"
                      color="blue"
                    >
                      {conv.correspondent_name?.[0]}
                    </Avatar>
                    <Stack gap={2} flex={1}>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>{conv.correspondent_name}</Text>
                        <Text size="xs" c="dimmed">{new Date(conv.last_message_at).toLocaleString()}</Text>
                      </Group>
                      <Text size="sm" c="dimmed" lineClamp={1}>{conv.last_message}</Text>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default ConversationsPage;
