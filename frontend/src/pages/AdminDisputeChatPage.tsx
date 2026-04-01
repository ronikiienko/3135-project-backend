import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Stack, Paper, Group, Loader, Alert, Button, ScrollArea, Badge } from '@mantine/core';
import Topbar from '../components/Topbar';
import { getDisputeMessages } from '../api/admin';
import { Message } from '../api/message';

const AdminDisputeChatPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [renterId, setRenterId] = useState<number | null>(null);
  const [shelterId, setShelterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rentalId) return;
    getDisputeMessages(Number(rentalId)).then((data) => {
      if (data.error) setError('Could not load messages. You may not be assigned to this dispute.');
      else {
        setMessages(data.messages ?? []);
        setRenterId(data.renter_id ?? null);
        setShelterId(data.shelter_id ?? null);
      }
      setLoading(false);
    });
  }, [rentalId]);

  useEffect(() => {
    if (viewport.current) viewport.current.scrollTo({ top: viewport.current.scrollHeight });
  }, [messages]);

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
          <Group justify="space-between">
            <Title order={3}>Dispute Chat — Rental #{rentalId}</Title>
            <Button variant="subtle" size="xs" onClick={() => navigate(`/rental/${rentalId}`)}>View rental</Button>
          </Group>
          <Text size="sm" c="dimmed">Read-only view of the conversation between the renter and shelter.</Text>
          {error && <Alert color="red">{error}</Alert>}
          {!error && (
            <Paper withBorder radius="md" style={{ height: 480, display: 'flex', flexDirection: 'column' }}>
              <ScrollArea flex={1} p="md" viewportRef={viewport}>
                {messages.length === 0 ? (
                  <Text c="dimmed" size="sm">No messages between these users.</Text>
                ) : (
                  <Stack gap="xs">
                    {messages.map((msg) => {
                      const isRenter = msg.sender_id === renterId;
                      return (
                        <Group key={msg.id} justify={isRenter ? 'flex-start' : 'flex-end'}>
                          <Stack gap={2} style={{ maxWidth: '70%' }}>
                            <Badge size="xs" color={isRenter ? 'blue' : 'green'} variant="light">
                              {isRenter ? 'Renter' : 'Shelter'}
                            </Badge>
                            <Paper p="xs" radius="md" bg={isRenter ? 'blue.0' : 'green.0'}>
                              <Text size="sm">{msg.body}</Text>
                              <Text size="xs" c="dimmed" ta="right">
                                {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </Text>
                            </Paper>
                          </Stack>
                        </Group>
                      );
                    })}
                  </Stack>
                )}
              </ScrollArea>
            </Paper>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default AdminDisputeChatPage;
