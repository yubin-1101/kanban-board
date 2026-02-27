import api from '../lib/api';
import type { Checklist, ChecklistItem } from '@kanban/shared';

export async function createChecklist(cardId: string, title: string): Promise<Checklist> {
  const { data } = await api.post(`/checklists/${cardId}`, { title });
  return data.data;
}

export async function deleteChecklist(checklistId: string): Promise<void> {
  await api.delete(`/checklists/${checklistId}`);
}

export async function createChecklistItem(
  checklistId: string,
  title: string,
): Promise<ChecklistItem> {
  const { data } = await api.post(`/checklists/${checklistId}/items`, { title });
  return data.data;
}

export async function updateChecklistItem(
  itemId: string,
  updates: { title?: string; is_completed?: boolean },
): Promise<ChecklistItem> {
  const { data } = await api.patch(`/checklists/items/${itemId}`, updates);
  return data.data;
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  await api.delete(`/checklists/items/${itemId}`);
}
