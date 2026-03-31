import { BASE_URL } from './config';

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  created_at: string;
}

export async function sendMessage(recipientId: number, body: string): Promise<{ message?: Message; error?: string }> {
  const res = await fetch(`${BASE_URL}/message/send.php?recipientId=${recipientId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ body }),
  });
  return res.json();
}

export interface Conversation {
  correspondent_id: number;
  correspondent_name: string;
  avatar_filename: string | null;
  last_message: string;
  last_message_at: string;
}

export async function getConversations(): Promise<{ conversations?: Conversation[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/conversations.php`, { credentials: 'include' });
  return res.json();
}

export async function getMessages(correspondentId: number): Promise<{ messages?: Message[]; error?: string }> {
  const res = await fetch(`${BASE_URL}/messages.php?correspondentId=${correspondentId}`, {
    credentials: 'include',
  });
  return res.json();
}
