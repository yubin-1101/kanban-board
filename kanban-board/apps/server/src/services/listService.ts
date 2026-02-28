import { supabaseAdmin } from '../supabase.js';

export async function createList(boardId: string, title: string) {
  // Get max position
  const { data: lastList } = await supabaseAdmin
    .from('lists')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = lastList ? lastList.position + 65536 : 65536;

  const { data, error } = await supabaseAdmin
    .from('lists')
    .insert({ board_id: boardId, title, position })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateList(listId: string, title: string) {
  const { data, error } = await supabaseAdmin
    .from('lists')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moveList(listId: string, position: number) {
  const { data, error } = await supabaseAdmin
    .from('lists')
    .update({ position, updated_at: new Date().toISOString() })
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moveListCanvas(listId: string, xPosition: number, yPosition: number) {
  const { data, error } = await supabaseAdmin
    .from('lists')
    .update({ x_position: xPosition, y_position: yPosition, updated_at: new Date().toISOString() })
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteList(listId: string) {
  const { error } = await supabaseAdmin.from('lists').delete().eq('id', listId);
  if (error) throw error;
}
