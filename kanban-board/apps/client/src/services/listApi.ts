import api from '../lib/api';
import type { List } from '@kanban/shared';

export async function createList(boardId: string, title: string): Promise<List> {
  const { data } = await api.post('/lists', { board_id: boardId, title });
  return data.data;
}

export async function updateList(listId: string, title: string): Promise<List> {
  const { data } = await api.patch(`/lists/${listId}`, { title });
  return data.data;
}

export async function moveList(listId: string, position: number): Promise<List> {
  const { data } = await api.patch(`/lists/${listId}/move`, { position });
  return data.data;
}

export async function deleteList(listId: string): Promise<void> {
  await api.delete(`/lists/${listId}`);
}
