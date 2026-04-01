import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Stack, Paper, Group, Loader, Alert, Button, ScrollArea, Badge } from '@mantine/core';
import Topbar from '../components/Topbar';
import { getReportMessages } from '../api/admin';
import { Message } from '../api/message';

const AdminReportChatPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [reporterId, setReporterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reportId) return;
    getReportMessages(Number(reportId)).then((data) => {
      if (data.error) setError('Could not load messages.');
      else {
        setMessages(data.messages ?? []);
        setReporterId(data.reporter_id ?? null);
      }
      setLoading(false);
    });
  }, [reportId]);

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
            <Title order={3}>Report Chat — Report #{reportId}</Title>
            <Button variant="subtle" size="xs" onClick={() => navigate('/admin/reports')}>Back to reports</Button>
          </Group>
          <Text size="sm" c="dimmed">Read-only view of the conversation between the reporter and the reported user.</Text>
          {error && <Alert color="red">{error}</Alert>}
          {!error && (
            <Paper withBorder radius="md" style={{ height: 480, display: 'flex', flexDirection: 'column' }}>
              <ScrollArea flex={1} p="md" viewportRef={viewport}>
                {messages.length === 0 ? (
                  <Text c="dimmed" size="sm">No messages between these users.</Text>
                ) : (
                  <Stack gap="xs">
                    {messages.map((msg) => {
                      const isReporter = msg.sender_id === reporterId;
                      return (
                        <Group key={msg.id} justify={isReporter ? 'flex-start' : 'flex-end'}>
                          <Stack gap={2} style={{ maxWidth: '70%' }}>
                            <Badge size="xs" color={isReporter ? 'blue' : 'gray'} variant="light">
                              {isReporter ? 'Reporter' : 'Reported'}
                            </Badge>
                            <Paper p="xs" radius="md" bg={isReporter ? 'blue.0' : 'gray.1'}>
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

export default AdminReportChatPage;
