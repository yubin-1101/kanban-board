import { supabaseAdmin } from '../supabase.js';

export async function getComments(cardId: string) {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('*, profiles(*)')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createComment(cardId: string, userId: string, content: string) {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ card_id: cardId, user_id: userId, content })
    .select('*, profiles(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string, userId: string) {
  const { data: comment } = await supabaseAdmin
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (comment?.user_id !== userId) {
    throw new Error('본인의 댓글만 삭제할 수 있습니다');
  }

  const { error } = await supabaseAdmin.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}
