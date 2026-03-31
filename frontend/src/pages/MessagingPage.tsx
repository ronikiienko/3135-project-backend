import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Stack, Text, Textarea, Button, Group, Paper, Loader, Alert, Title, ScrollArea } from '@mantine/core';
import Topbar from '../components/Topbar';
import { getMessages, sendMessage, Message } from '../api/message';
import { getRenterMe } from '../api/renter';
import { getShelterMe } from '../api/shelter';
import { getAdminMe } from '../api/admin';
import { getRenterProfile, getShelterProfile } from '../api/profile';

const MessagingPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const correspondentName = (location.state as any)?.correspondentName ?? 'Unknown';
  const role = localStorage.getItem('role');

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (viewport.current) viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!userId) return;
    const data = await getMessages(Number(userId));
    if (data.error) setError('Could not load messages.');
    else if (data.messages) setMessages(data.messages);
  };

  useEffect(() => {
    if (!userId) return;

    const getMeFn = role === 'RENTER' ? getRenterMe : role === 'SHELTER' ? getShelterMe : getAdminMe;
    Promise.all([getMeFn(), getMessages(Number(userId))]).then(([meData, msgData]) => {
      const me = (meData as any).renter ?? (meData as any).shelter ?? (meData as any).admin;
      if (me) setCurrentUserId(me.id);
      if (msgData.error) setError('Could not load messages.');
      else if (msgData.messages) setMessages(msgData.messages);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSend = async () => {
    if (!body.trim() || !userId) return;
    setSending(true);
    setSendError(null);
    const result = await sendMessage(Number(userId), body.trim());
    setSending(false);
    if (result.error) {
      setSendError('Failed to send message.');
    } else {
      setBody('');
      await fetchMessages();
    }
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
      <Container my={40} size="sm">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack gap="md">
          <Title order={3}>Conversation with {correspondentName}</Title>

          <Paper withBorder radius="md" style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <ScrollArea flex={1} p="md" viewportRef={viewport}>
              {messages.length === 0 ? (
                <Text c="dimmed" size="sm">No messages yet. Say hello!</Text>
              ) : (
                <Stack gap="xs">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId;
                    return (
                      <Group key={msg.id} justify={isMine ? 'flex-end' : 'flex-start'}>
                        <Paper
                          p="xs"
                          radius="md"
                          bg={isMine ? 'blue.6' : 'gray.1'}
                          style={{ maxWidth: '70%' }}
                        >
                          <Text size="sm" c={isMine ? 'white' : 'dark'}>{msg.body}</Text>
                          <Text size="xs" c={isMine ? 'blue.1' : 'dimmed'} ta="right">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Paper>
                      </Group>
                    );
                  })}
                </Stack>
              )}
            </ScrollArea>

            <Stack gap="xs" p="md" style={{ borderTop: '1px solid #e9ecef' }}>
              {sendError && <Alert color="red" py={4}>{sendError}</Alert>}
              <Group align="flex-end">
                <Textarea
                  flex={1}
                  placeholder="Type a message..."
                  value={body}
                  onChange={(e) => setBody(e.currentTarget.value)}
                  autosize
                  minRows={1}
                  maxRows={4}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                />
                <Button onClick={handleSend} loading={sending} disabled={!body.trim()}>
                  Send
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </>
  );
};

export default MessagingPage;
