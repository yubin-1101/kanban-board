import { supabaseAdmin } from '../supabase.js';

export async function getBoardLabels(boardId: string) {
  const { data, error } = await supabaseAdmin
    .from('labels')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at');

  if (error) throw error;
  return data;
}

export async function createLabel(boardId: string, name: string, color: string) {
  const { data, error } = await supabaseAdmin
    .from('labels')
    .insert({ board_id: boardId, name, color })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLabel(labelId: string) {
  const { error } = await supabaseAdmin.from('labels').delete().eq('id', labelId);
  if (error) throw error;
}

export async function addCardLabel(cardId: string, labelId: string) {
  const { data, error } = await supabaseAdmin
    .from('card_labels')
    .insert({ card_id: cardId, label_id: labelId })
    .select('*, labels(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function removeCardLabel(cardId: string, labelId: string) {
  const { error } = await supabaseAdmin
    .from('card_labels')
    .delete()
    .eq('card_id', cardId)
    .eq('label_id', labelId);

  if (error) throw error;
}
