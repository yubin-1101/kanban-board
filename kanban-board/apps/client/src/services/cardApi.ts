import api from '../lib/api';
import type { Card, UpdateCardInput, MoveCardInput } from '@kanban/shared';

export async function getCard(cardId: string): Promise<Card> {
  const { data } = await api.get(`/cards/${cardId}`);
  return data.data;
}

export async function createCard(listId: string, title: string): Promise<Card> {
  const { data } = await api.post('/cards', { list_id: listId, title });
  return data.data;
}

export async function updateCard(cardId: string, input: UpdateCardInput): Promise<Card> {
  const { data } = await api.patch(`/cards/${cardId}`, input);
  return data.data;
}

export async function moveCard(input: MoveCardInput): Promise<Card> {
  const { data } = await api.post('/cards/move', input);
  return data.data;
}

export async function deleteCard(cardId: string): Promise<void> {
  await api.delete(`/cards/${cardId}`);
}
