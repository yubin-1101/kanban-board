import { supabaseAdmin } from '../supabase.js';

export async function createChecklist(cardId: string, title: string) {
  const { data: last } = await supabaseAdmin
    .from('checklists')
    .select('position')
    .eq('card_id', cardId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = last ? last.position + 65536 : 65536;

  const { data, error } = await supabaseAdmin
    .from('checklists')
    .insert({ card_id: cardId, title, position })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChecklist(checklistId: string) {
  const { error } = await supabaseAdmin.from('checklists').delete().eq('id', checklistId);
  if (error) throw error;
}

export async function createChecklistItem(checklistId: string, title: string) {
  const { data: last } = await supabaseAdmin
    .from('checklist_items')
    .select('position')
    .eq('checklist_id', checklistId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = last ? last.position + 65536 : 65536;

  const { data, error } = await supabaseAdmin
    .from('checklist_items')
    .insert({ checklist_id: checklistId, title, position })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChecklistItem(
  itemId: string,
  updates: { title?: string; is_completed?: boolean },
) {
  const { data, error } = await supabaseAdmin
    .from('checklist_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChecklistItem(itemId: string) {
  const { error } = await supabaseAdmin.from('checklist_items').delete().eq('id', itemId);
  if (error) throw error;
}
