import api from '../lib/api';
import type { Comment } from '@kanban/shared';

export async function getComments(cardId: string): Promise<Comment[]> {
  const { data } = await api.get(`/comments/${cardId}`);
  return data.data;
}

export async function createComment(cardId: string, content: string): Promise<Comment> {
  const { data } = await api.post(`/comments/${cardId}`, { content });
  return data.data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}
