import api from '../lib/api';
import type { Card, UpdateCardInput, MoveCardInput, MoveCardCanvasInput } from '@kanban/shared';

export async function getCard(cardId: string): Promise<Card> {
  const { data } = await api.get(`/cards/${cardId}`);
  return data.data;
}

export async function createCard(
  boardId: string,
  title: string,
  listId?: string | null,
  xPosition?: number,
  yPosition?: number,
): Promise<Card> {
  const { data } = await api.post('/cards', {
    board_id: boardId,
    title,
    list_id: listId || null,
    x_position: xPosition,
    y_position: yPosition,
  });
  return data.data;
}

export async function createFreeCard(
  boardId: string,
  title: string,
  x: number,
  y: number,
): Promise<Card> {
  return createCard(boardId, title, null, x, y);
}

export async function updateCard(cardId: string, input: UpdateCardInput): Promise<Card> {
  const { data } = await api.patch(`/cards/${cardId}`, input);
  return data.data;
}

export async function moveCard(input: MoveCardInput): Promise<Card> {
  const { data } = await api.post('/cards/move', input);
  return data.data;
}

export async function moveCardCanvas(input: MoveCardCanvasInput): Promise<Card> {
  const { data } = await api.post('/cards/move-canvas', input);
  return data.data;
}

export async function deleteCard(cardId: string): Promise<void> {
  await api.delete(`/cards/${cardId}`);
}
