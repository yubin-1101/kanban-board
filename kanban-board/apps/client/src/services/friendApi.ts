import api from '../lib/api';
import type { Friendship } from '@kanban/shared';

export async function getFriends(): Promise<Friendship[]> {
  const { data } = await api.get('/friends');
  return data.data;
}

export async function getReceivedRequests(): Promise<Friendship[]> {
  const { data } = await api.get('/friends/requests/received');
  return data.data;
}

export async function getSentRequests(): Promise<Friendship[]> {
  const { data } = await api.get('/friends/requests/sent');
  return data.data;
}

export async function sendFriendRequest(email: string): Promise<Friendship> {
  const { data } = await api.post('/friends/request', { email });
  return data.data;
}

export async function respondToRequest(
  friendshipId: string,
  action: 'accept' | 'reject',
): Promise<Friendship> {
  const { data } = await api.patch(`/friends/${friendshipId}/respond`, { action });
  return data.data;
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await api.delete(`/friends/${friendshipId}`);
}
