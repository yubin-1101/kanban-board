import { supabaseAdmin } from '../supabase.js';
import type { UpdateCardInput } from '@kanban/shared';

export async function createCard(
  boardId: string,
  title: string,
  userId: string,
  listId?: string | null,
  xPosition?: number,
  yPosition?: number,
) {
  if (listId) {
    // Card inside a list - calculate position
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
      .insert({
        board_id: boardId,
        list_id: listId,
        title,
        position,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Free-floating card on canvas
    const { data, error } = await supabaseAdmin
      .from('cards')
      .insert({
        board_id: boardId,
        list_id: null,
        title,
        position: 0,
        x_position: xPosition ?? 200,
        y_position: yPosition ?? 200,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
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

export async function moveCardCanvas(
  cardId: string,
  xPosition: number,
  yPosition: number,
  listId: string | null,
) {
  const update: Record<string, any> = {
    x_position: xPosition,
    y_position: yPosition,
    list_id: listId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('cards')
    .update(update)
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
