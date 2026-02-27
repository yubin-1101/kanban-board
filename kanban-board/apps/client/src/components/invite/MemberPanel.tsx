import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteMember, updateMemberRole, removeMember, getSentInvitations, cancelInvitation } from '../../services/memberApi';
import { getFriends } from '../../services/friendApi';
import { useAuthStore } from '../../stores/authStore';
import { avatarGradient } from '../../lib/utils';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import type { BoardMember, BoardRole, Friendship, BoardInvitation } from '@kanban/shared';

interface MemberPanelProps {
  boardId: string;
  members: BoardMember[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberPanel({ boardId, members, isOpen, onClose }: MemberPanelProps) {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [role, setRole] = useState<BoardRole>('member');

  const currentMember = members.find((m) => m.user_id === profile?.id);
  const isAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    enabled: isOpen && isAdmin,
  });

  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['boardInvitations', 'sent', boardId],
    queryFn: () => getSentInvitations(boardId),
    enabled: isOpen && isAdmin,
  });

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const pendingInviteeIds = new Set(sentInvitations.map((i: BoardInvitation) => i.invitee_id));

  function getFriendProfile(friendship: Friendship) {
    return friendship.requester_id === profile?.id ? friendship.addressee : friendship.requester;
  }

  const inviteMutation = useMutation({
    mutationFn: (email: string) => inviteMember(boardId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardInvitations', 'sent', boardId] });
      toast.success('초대를 보냈습니다');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || '초대에 실패했습니다');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardInvitations', 'sent', boardId] });
      toast.success('초대를 취소했습니다');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || '취소에 실패했습니다');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: BoardRole }) =>
      updateMemberRole(memberId, newRole),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('멤버가 제거되었습니다');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || '제거에 실패했습니다');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="멤버 관리" size="md">
      <div className="space-y-6">
        {/* Pending Invitations */}
        {isAdmin && sentInvitations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-2">
              대기 중인 초대 ({sentInvitations.length})
            </h4>
            <div className="space-y-1 bg-amber-50/50 rounded-xl p-2">
              {sentInvitations.map((inv: BoardInvitation) => {
                const grad = avatarGradient(inv.invitee?.display_name);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-white/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      >
                        {inv.invitee?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-primary">{inv.invitee?.display_name}</p>
                        <p className="text-xs text-ink-tertiary">{inv.invitee?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium capitalize">
                        {inv.role}
                      </span>
                      <button
                        onClick={() => cancelMutation.mutate(inv.id)}
                        disabled={cancelMutation.isPending}
                        className="text-xs text-ink-tertiary hover:text-red-500 transition-colors px-1.5 py-0.5"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invite from friends */}
        {isAdmin && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">친구 초대</h4>
              <div className="relative">
                <select
                  className="appearance-none border border-surface-border rounded-lg px-2.5 py-1 pr-7 text-xs text-ink-secondary bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value as BoardRole)}
                >
                  <option value="member">멤버</option>
                  <option value="admin">관리자</option>
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-6 bg-surface-raised rounded-xl">
                <p className="text-xs text-ink-tertiary">친구가 없습니다. 대시보드에서 친구를 추가해주세요.</p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 bg-surface-raised rounded-xl p-2">
                {friends.map((friendship: Friendship) => {
                  const friend = getFriendProfile(friendship);
                  if (!friend) return null;
                  const isAlreadyMember = memberUserIds.has(friend.id);
                  const isPending = pendingInviteeIds.has(friend.id);
                  const grad = avatarGradient(friend.display_name);
                  return (
                    <div
                      key={friendship.id}
                      className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-surface-card/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                        >
                          {friend.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm text-ink-primary">{friend.display_name}</span>
                      </div>
                      {isAlreadyMember ? (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">멤버</span>
                      ) : isPending ? (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">초대됨</span>
                      ) : (
                        <button
                          onClick={() => inviteMutation.mutate(friend.email)}
                          disabled={inviteMutation.isPending}
                          className="px-3 py-1 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          초대
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Member list */}
        <div>
          <h4 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-2">
            멤버 ({members.length})
          </h4>
          <div className="space-y-1">
            {members.map((member) => {
              const grad = avatarGradient(member.profile?.display_name);
              return (
                <div key={member.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                    >
                      {member.profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-primary">
                        {member.profile?.display_name}
                        {member.user_id === profile?.id && (
                          <span className="text-xs text-ink-tertiary ml-1">(나)</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-tertiary">{member.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && member.role !== 'owner' ? (
                      <>
                        <div className="relative">
                          <select
                            className="appearance-none text-xs border border-surface-border rounded-lg px-2 py-1 pr-6 text-ink-secondary bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                            value={member.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                memberId: member.id,
                                newRole: e.target.value as BoardRole,
                              })
                            }
                          >
                            <option value="member">멤버</option>
                            <option value="admin">관리자</option>
                          </select>
                          <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <button
                          className="text-xs text-ink-tertiary hover:text-red-500 transition-colors px-1.5 py-0.5"
                          onClick={() => {
                            if (confirm('이 멤버를 제거하시겠습니까?')) {
                              removeMutation.mutate(member.id);
                            }
                          }}
                        >
                          제거
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        member.role === 'owner'
                          ? 'text-accent-600 bg-accent-50'
                          : member.role === 'admin'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-ink-tertiary bg-surface-raised'
                      }`}>
                        {member.role === 'owner' ? '소유자' : member.role === 'admin' ? '관리자' : '멤버'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
