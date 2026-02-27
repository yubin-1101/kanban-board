import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { avatarGradient } from '../../lib/utils';
import {
  getFriends,
  getReceivedRequests,
  getSentRequests,
  sendFriendRequest,
  respondToRequest,
  removeFriend,
} from '../../services/friendApi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import type { Friendship } from '@kanban/shared';

type Tab = 'friends' | 'received' | 'sent' | 'add';

interface FriendPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendPanel({ isOpen, onClose }: FriendPanelProps) {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('friends');
  const [email, setEmail] = useState('');

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    enabled: isOpen,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ['friends', 'received'],
    queryFn: getReceivedRequests,
    enabled: isOpen,
  });

  const { data: sentRequests = [] } = useQuery({
    queryKey: ['friends', 'sent'],
    queryFn: getSentRequests,
    enabled: isOpen,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendFriendRequest(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      setEmail('');
      toast.success('친구 요청을 보냈습니다');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || '친구 요청에 실패했습니다');
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
      respondToRequest(id, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success(action === 'accept' ? '친구 요청을 수락했습니다' : '친구 요청을 거절했습니다');
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('친구를 삭제했습니다');
    },
  });

  function getFriendProfile(friendship: Friendship) {
    return friendship.requester_id === profile?.id ? friendship.addressee : friendship.requester;
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'friends', label: '친구 목록' },
    { key: 'received', label: '받은 요청', count: receivedRequests.length },
    { key: 'sent', label: '보낸 요청', count: sentRequests.length },
    { key: 'add', label: '친구 추가' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="친구" size="md">
      <div className="space-y-4">
        {/* Pill-style Tabs */}
        <div className="flex gap-1 bg-surface-raised p-1 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`relative flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-surface-card text-ink-primary shadow-sm'
                  : 'text-ink-tertiary hover:text-ink-secondary'
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {(t.count ?? 0) > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Friends List */}
        {tab === 'friends' && (
          <div className="space-y-1">
            {friends.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-surface-raised rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-ink-secondary">아직 친구가 없습니다</p>
                <p className="text-xs text-ink-tertiary mt-1">친구 추가 탭에서 친구를 추가해보세요</p>
              </div>
            ) : (
              friends.map((friendship: Friendship) => {
                const friend = getFriendProfile(friendship);
                const grad = avatarGradient(friend?.display_name);
                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-raised transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      >
                        {friend?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-primary">
                          {friend?.display_name}
                        </p>
                        <p className="text-xs text-ink-tertiary">{friend?.email}</p>
                      </div>
                    </div>
                    <button
                      className="text-xs text-ink-tertiary hover:text-red-500 transition-colors px-2 py-1 rounded"
                      onClick={() => {
                        if (confirm('이 친구를 삭제하시겠습니까?')) {
                          removeMutation.mutate(friendship.id);
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Received Requests */}
        {tab === 'received' && (
          <div className="space-y-1">
            {receivedRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-surface-raised rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm text-ink-secondary">받은 요청이 없습니다</p>
              </div>
            ) : (
              receivedRequests.map((request: Friendship) => {
                const grad = avatarGradient(request.requester?.display_name);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-raised transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      >
                        {request.requester?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-primary">
                          {request.requester?.display_name}
                        </p>
                        <p className="text-xs text-ink-tertiary">{request.requester?.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => respondMutation.mutate({ id: request.id, action: 'accept' })}
                        disabled={respondMutation.isPending}
                        className="px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => respondMutation.mutate({ id: request.id, action: 'reject' })}
                        disabled={respondMutation.isPending}
                        className="px-3 py-1.5 bg-surface-raised hover:bg-zinc-200 text-ink-secondary text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Sent Requests */}
        {tab === 'sent' && (
          <div className="space-y-1">
            {sentRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-surface-raised rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <p className="text-sm text-ink-secondary">보낸 요청이 없습니다</p>
              </div>
            ) : (
              sentRequests.map((request: Friendship) => {
                const grad = avatarGradient(request.addressee?.display_name);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface-raised transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      >
                        {request.addressee?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-primary">
                          {request.addressee?.display_name}
                        </p>
                        <p className="text-xs text-ink-tertiary">{request.addressee?.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                      대기중
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Add Friend */}
        {tab === 'add' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMutation.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div>
              <p className="text-sm text-ink-secondary mb-3">이메일 주소로 친구를 추가할 수 있습니다.</p>
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                autoFocus
              />
            </div>
            <Button type="submit" isLoading={sendMutation.isPending} className="w-full">
              요청 보내기
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
