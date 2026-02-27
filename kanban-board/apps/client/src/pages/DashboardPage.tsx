import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getBoards, createBoard, deleteBoard } from '../services/boardApi';
import { getReceivedInvitations, respondToInvitation } from '../services/memberApi';
import { getReceivedRequests } from '../services/friendApi';
import { avatarGradient, boardGradient } from '../lib/utils';
import { useRealtimeFriends } from '../hooks/useRealtimeFriends';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import FriendPanel from '../components/friends/FriendPanel';
import toast from 'react-hot-toast';
import type { BoardInvitation } from '@kanban/shared';

const BOARD_COLORS = [
  '#6d28d9', '#1d4ed8', '#0e7490', '#047857', '#b45309',
  '#be123c', '#a21caf', '#3730a3', '#475569',
];

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0]);
  const [showFriends, setShowFriends] = useState(false);

  useRealtimeFriends();

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['boardInvitations', 'received'],
    queryFn: getReceivedInvitations,
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friends', 'received'],
    queryFn: getReceivedRequests,
  });

  const createMutation = useMutation({
    mutationFn: () => createBoard({ title: newTitle, background_color: selectedColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setShowCreate(false);
      setNewTitle('');
      toast.success('보드가 생성되었습니다');
    },
    onError: () => toast.error('보드 생성에 실패했습니다'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('보드가 삭제되었습니다');
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
      respondToInvitation(id, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['boardInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success(action === 'accept' ? '초대를 수락했습니다' : '초대를 거절했습니다');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || '처리에 실패했습니다');
    },
  });

  const profileGrad = avatarGradient(profile?.display_name);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #f0f9ff 50%, #f0fdf4 100%)' }}>
      {/* Header */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-surface-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </div>
            <span className="text-lg font-bold text-ink-primary tracking-tight">Kanban</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFriends(true)}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-raised rounded-xl transition-all"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              친구
              {friendRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                  {friendRequests.length}
                </span>
              )}
            </button>
            <div className="w-px h-6 bg-surface-border mx-1" />
            <div className="flex items-center gap-2.5 pl-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ background: `linear-gradient(135deg, ${profileGrad.from}, ${profileGrad.to})` }}
              >
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium text-ink-secondary hidden sm:block">{profile?.display_name}</span>
            </div>
            <button
              onClick={signOut}
              className="ml-1 p-2 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-raised rounded-xl transition-all"
              title="로그아웃"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Board Invitations */}
        {invitations.length > 0 && (
          <div className="mb-10 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
              <h2 className="text-xs font-bold text-ink-tertiary uppercase tracking-widest">
                받은 초대
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {invitations.map((inv: BoardInvitation) => (
                <div
                  key={inv.id}
                  className="bg-surface-card rounded-2xl p-5 shadow-card border border-surface-border hover:shadow-raised transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
                      style={{ backgroundColor: inv.board?.background_color || '#7c3aed' }}
                    >
                      {inv.board?.title?.[0]?.toUpperCase() || 'B'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-primary truncate">
                        {inv.board?.title || '보드'}
                      </p>
                      <p className="text-xs text-ink-tertiary mt-0.5">
                        {inv.inviter?.display_name}님의 초대
                      </p>
                    </div>
                    <span className="text-[10px] text-ink-tertiary bg-surface-raised px-2 py-0.5 rounded-full font-medium uppercase">
                      {inv.role}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondMutation.mutate({ id: inv.id, action: 'accept' })}
                      disabled={respondMutation.isPending}
                      className="flex-1 px-3 py-2 bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ id: inv.id, action: 'reject' })}
                      disabled={respondMutation.isPending}
                      className="flex-1 px-3 py-2 bg-surface-raised hover:bg-zinc-200 text-ink-secondary text-sm font-medium rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Board List Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ink-primary">내 보드</h2>
          <Button onClick={() => setShowCreate(true)} size="md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 보드
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-surface-raised animate-pulse" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-5 bg-surface-raised rounded-3xl flex items-center justify-center">
              <svg className="w-10 h-10 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </div>
            <p className="text-ink-secondary text-base font-medium mb-1">아직 보드가 없습니다</p>
            <p className="text-ink-tertiary text-sm mb-5">새 보드를 만들어 프로젝트를 관리해보세요</p>
            <Button onClick={() => setShowCreate(true)}>첫 번째 보드 만들기</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {boards.map((board: any) => {
              const grad = boardGradient(board.background_color);
              return (
                <div
                  key={board.id}
                  className="group relative rounded-2xl h-28 cursor-pointer text-white overflow-hidden shadow-card hover:shadow-raised transition-all duration-200 hover:-translate-y-0.5 board-card-mesh"
                  style={{ background: grad.bg }}
                  onClick={() => navigate(`/board/${board.id}`)}
                >
                  <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                    <span className="text-[15px] font-bold drop-shadow-sm leading-snug">
                      {board.title}
                    </span>
                    {board.role && (
                      <span className="self-start text-[10px] bg-white/15 backdrop-blur-sm rounded-md px-2 py-0.5 font-medium uppercase tracking-wide border border-white/10">
                        {board.role === 'owner' ? '소유자' : board.role === 'admin' ? '관리자' : '멤버'}
                      </span>
                    )}
                  </div>
                  {board.role === 'owner' && (
                    <button
                      className="absolute z-10 top-2.5 right-2.5 w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20 hover:bg-black/40 rounded-lg backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 보드를 삭제하시겠습니까?')) {
                          deleteMutation.mutate(board.id);
                        }
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="새 보드 만들기">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-5"
        >
          <Input
            label="보드 이름"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="프로젝트 이름을 입력하세요"
            required
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2.5">배경 색상</label>
            <div className="flex gap-2.5 flex-wrap">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-8 rounded-xl transition-all duration-150 ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-accent-500 scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              취소
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              만들기
            </Button>
          </div>
        </form>
      </Modal>

      <FriendPanel isOpen={showFriends} onClose={() => setShowFriends(false)} />
    </div>
  );
}
