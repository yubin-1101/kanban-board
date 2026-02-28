import { supabaseAdmin } from '../supabase.js';

export async function getDrawing(boardId: string) {
  const { data, error } = await supabaseAdmin
    .from('board_drawings')
    .select('strokes')
    .eq('board_id', boardId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No row found - return empty
    return { strokes: [] };
  }
  if (error) throw error;
  return data;
}

export async function saveDrawing(boardId: string, strokes: any[]) {
  const { data, error } = await supabaseAdmin
    .from('board_drawings')
    .upsert(
      { board_id: boardId, strokes, updated_at: new Date().toISOString() },
      { onConflict: 'board_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
