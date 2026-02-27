import api from '../lib/api';
import type { BoardMember, BoardRole, BoardInvitation } from '@kanban/shared';

export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const { data } = await api.get(`/members/${boardId}`);
  return data.data;
}

export async function inviteMember(
  boardId: string,
  email: string,
  role: BoardRole,
): Promise<BoardInvitation> {
  const { data } = await api.post(`/members/${boardId}`, { email, role });
  return data.data;
}

export async function updateMemberRole(
  memberId: string,
  role: BoardRole,
): Promise<BoardMember> {
  const { data } = await api.patch(`/members/role/${memberId}`, { role });
  return data.data;
}

export async function removeMember(memberId: string): Promise<void> {
  await api.delete(`/members/${memberId}`);
}

// Board invitation APIs
export async function getReceivedInvitations(): Promise<BoardInvitation[]> {
  const { data } = await api.get('/members/invitations/received');
  return data.data;
}

export async function getSentInvitations(boardId: string): Promise<BoardInvitation[]> {
  const { data } = await api.get(`/members/invitations/${boardId}`);
  return data.data;
}

export async function respondToInvitation(
  invitationId: string,
  action: 'accept' | 'reject',
): Promise<BoardInvitation> {
  const { data } = await api.patch(`/members/invitations/${invitationId}/respond`, { action });
  return data.data;
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await api.delete(`/members/invitations/${invitationId}`);
}
