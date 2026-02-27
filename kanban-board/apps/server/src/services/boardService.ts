import { supabaseAdmin } from '../supabase.js';
import type { CreateBoardInput, UpdateBoardInput } from '@kanban/shared';

export async function getUserBoards(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('board_members')
    .select('board_id, role, boards(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map((m: any) => ({ ...m.boards, role: m.role })) ?? [];
}

export async function getBoardDetail(boardId: string) {
  const { data: board, error: boardError } = await supabaseAdmin
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single();

  if (boardError) throw boardError;

  const [listsResult, membersResult, labelsResult] = await Promise.all([
    supabaseAdmin
      .from('lists')
      .select('*, cards(*, card_labels(*, labels(*)), card_assignees(*, profiles(*)))')
      .eq('board_id', boardId)
      .order('position')
      .order('position', { referencedTable: 'cards' }),
    supabaseAdmin
      .from('board_members')
      .select('*, profiles(*)')
      .eq('board_id', boardId),
    supabaseAdmin
      .from('labels')
      .select('*')
      .eq('board_id', boardId),
  ]);

  if (listsResult.error) throw listsResult.error;

  return {
    ...board,
    lists: listsResult.data ?? [],
    board_members: membersResult.data ?? [],
    labels: labelsResult.data ?? [],
  };
}

export async function createBoard(userId: string, input: CreateBoardInput) {
  const { data: board, error } = await supabaseAdmin
    .from('boards')
    .insert({ title: input.title, background_color: input.background_color, owner_id: userId })
    .select()
    .single();

  if (error) throw error;

  // Add owner as board member
  await supabaseAdmin
    .from('board_members')
    .insert({ board_id: board.id, user_id: userId, role: 'owner' });

  return board;
}

export async function updateBoard(boardId: string, input: UpdateBoardInput) {
  const { data, error } = await supabaseAdmin
    .from('boards')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', boardId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBoard(boardId: string) {
  const { error } = await supabaseAdmin.from('boards').delete().eq('id', boardId);
  if (error) throw error;
}
