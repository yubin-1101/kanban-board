import api from '../lib/api';
import type { Label } from '@kanban/shared';

export async function getBoardLabels(boardId: string): Promise<Label[]> {
  const { data } = await api.get(`/labels/board/${boardId}`);
  return data.data;
}

export async function createLabel(boardId: string, name: string, color: string): Promise<Label> {
  const { data } = await api.post('/labels', { board_id: boardId, name, color });
  return data.data;
}

export async function deleteLabel(labelId: string): Promise<void> {
  await api.delete(`/labels/${labelId}`);
}

export async function addCardLabel(cardId: string, labelId: string) {
  const { data } = await api.post(`/labels/card/${cardId}/${labelId}`);
  return data.data;
}

export async function removeCardLabel(cardId: string, labelId: string): Promise<void> {
  await api.delete(`/labels/card/${cardId}/${labelId}`);
}
