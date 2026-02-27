import { supabaseAdmin } from '../supabase.js';
import type { BoardRole } from '@kanban/shared';

async function getProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, any>();
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .in('id', userIds);
  return new Map((data ?? []).map((p: any) => [p.id, p]));
}

// Changed: now inserts into board_invitations instead of board_members
export async function inviteMember(boardId: string, inviterId: string, email: string, role: BoardRole) {
  // Find user by email
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!profile) {
    throw new Error('해당 이메일의 사용자를 찾을 수 없습니다');
  }

  // Check if already a member
  const { data: existing } = await supabaseAdmin
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', profile.id)
    .single();

  if (existing) {
    throw new Error('이미 보드의 멤버입니다');
  }

  // Check if already has a pending invitation
  const { data: existingInvitation } = await supabaseAdmin
    .from('board_invitations')
    .select('id, status')
    .eq('board_id', boardId)
    .eq('invitee_id', profile.id)
    .single();

  if (existingInvitation) {
    if (existingInvitation.status === 'pending') {
      throw new Error('이미 초대를 보낸 상태입니다');
    }
    // rejected인 경우 기존 레코드 삭제 후 새로 생성
    await supabaseAdmin.from('board_invitations').delete().eq('id', existingInvitation.id);
  }

  const { data, error } = await supabaseAdmin
    .from('board_invitations')
    .insert({
      board_id: boardId,
      inviter_id: inviterId,
      invitee_id: profile.id,
      role,
    })
    .select('*')
    .single();

  if (error) throw error;

  const profileMap = await getProfilesByIds([inviterId, profile.id]);

  return {
    ...data,
    inviter: profileMap.get(inviterId) ?? null,
    invitee: profileMap.get(profile.id) ?? null,
  };
}

export async function getReceivedInvitations(userId: string) {
  const { data: invitations, error } = await supabaseAdmin
    .from('board_invitations')
    .select('*')
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!invitations || invitations.length === 0) return [];

  // Get board info and inviter profiles
  const boardIds = [...new Set(invitations.map((i: any) => i.board_id))];
  const inviterIds = [...new Set(invitations.map((i: any) => i.inviter_id))];

  const [{ data: boards }, profileMap] = await Promise.all([
    supabaseAdmin.from('boards').select('*').in('id', boardIds),
    getProfilesByIds(inviterIds),
  ]);

  const boardMap = new Map((boards ?? []).map((b: any) => [b.id, b]));

  return invitations.map((inv: any) => ({
    ...inv,
    board: boardMap.get(inv.board_id) ?? null,
    inviter: profileMap.get(inv.inviter_id) ?? null,
  }));
}

export async function getSentInvitations(boardId: string) {
  const { data: invitations, error } = await supabaseAdmin
    .from('board_invitations')
    .select('*')
    .eq('board_id', boardId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!invitations || invitations.length === 0) return [];

  const inviteeIds = invitations.map((i: any) => i.invitee_id);
  const profileMap = await getProfilesByIds(inviteeIds);

  return invitations.map((inv: any) => ({
    ...inv,
    invitee: profileMap.get(inv.invitee_id) ?? null,
  }));
}

export async function respondToInvitation(invitationId: string, userId: string, action: 'accept' | 'reject') {
  // Only invitee can respond
  const { data: invitation } = await supabaseAdmin
    .from('board_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .single();

  if (!invitation) {
    throw new Error('초대를 찾을 수 없습니다');
  }

  const newStatus = action === 'accept' ? 'accepted' : 'rejected';

  // Update invitation status
  const { data, error } = await supabaseAdmin
    .from('board_invitations')
    .update({ status: newStatus })
    .eq('id', invitationId)
    .select('*')
    .single();

  if (error) throw error;

  // If accepted, add to board_members
  if (action === 'accept') {
    const { error: memberError } = await supabaseAdmin
      .from('board_members')
      .insert({
        board_id: invitation.board_id,
        user_id: userId,
        role: invitation.role,
      });

    if (memberError) throw memberError;
  }

  return data;
}

export async function cancelInvitation(invitationId: string, userId: string) {
  // Only inviter can cancel
  const { data: invitation } = await supabaseAdmin
    .from('board_invitations')
    .select('id')
    .eq('id', invitationId)
    .eq('inviter_id', userId)
    .eq('status', 'pending')
    .single();

  if (!invitation) {
    throw new Error('초대를 찾을 수 없습니다');
  }

  const { error } = await supabaseAdmin
    .from('board_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
}

export async function updateMemberRole(memberId: string, role: BoardRole) {
  const { data, error } = await supabaseAdmin
    .from('board_members')
    .update({ role })
    .eq('id', memberId)
    .select('*, profiles(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function removeMember(memberId: string) {
  // Prevent removing owner
  const { data: member } = await supabaseAdmin
    .from('board_members')
    .select('role')
    .eq('id', memberId)
    .single();

  if (member?.role === 'owner') {
    throw new Error('보드 소유자는 제거할 수 없습니다');
  }

  const { error } = await supabaseAdmin.from('board_members').delete().eq('id', memberId);
  if (error) throw error;
}

export async function getBoardMembers(boardId: string) {
  const { data, error } = await supabaseAdmin
    .from('board_members')
    .select('*, profiles(*)')
    .eq('board_id', boardId);

  if (error) throw error;
  return data;
}
