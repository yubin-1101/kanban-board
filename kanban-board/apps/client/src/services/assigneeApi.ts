import api from '../lib/api';

export async function addAssignee(cardId: string, userId: string) {
  // We'll use the card update pattern through direct supabase or a dedicated endpoint
  // For now, use a simple approach
  const { data } = await api.post(`/cards/${cardId}/assignees`, { user_id: userId });
  return data.data;
}

export async function removeAssignee(cardId: string, userId: string) {
  await api.delete(`/cards/${cardId}/assignees/${userId}`);
}
