import { supabaseAdmin } from '../supabase.js';
import type { UpdateCardInput } from '@kanban/shared';

export async function createCard(listId: string, title: string, userId: string) {
  const { data: lastCard } = await supabaseAdmin
    .from('cards')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = lastCard ? lastCard.position + 65536 : 65536;

  const { data, error } = await supabaseAdmin
    .from('cards')
    .insert({ list_id: listId, title, position, created_by: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCard(cardId: string) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .select(`
      *,
      card_labels(*, labels(*)),
      card_assignees(*, profiles(*)),
      checklists(*, checklist_items(*)),
      comments(*, profiles(*))
    `)
    .eq('id', cardId)
    .order('created_at', { referencedTable: 'comments', ascending: true })
    .order('position', { referencedTable: 'checklists' })
    .order('position', { referencedTable: 'checklists.checklist_items' })
    .single();

  if (error) throw error;
  return data;
}

export async function updateCard(cardId: string, input: UpdateCardInput) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moveCard(cardId: string, targetListId: string, position: number) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .update({ list_id: targetListId, position, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCard(cardId: string) {
  const { error } = await supabaseAdmin.from('cards').delete().eq('id', cardId);
  if (error) throw error;
}
