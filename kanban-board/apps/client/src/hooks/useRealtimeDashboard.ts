import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

/**
 * board_invitations / board_members 테이블을 실시간 구독해서
 * 대시보드의 초대 목록·보드 목록을 자동 갱신합니다.
 */
export function useRealtimeDashboard() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!profile?.id) return;

    // 내게 온 초대가 생기거나 변경되면 초대 목록 갱신
    const invitationChannel = supabase
      .channel(`dash-inv:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_invitations',
          filter: `invitee_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['boardInvitations'] });
        },
      )
      .subscribe();

    // 내가 보낸 초대가 수락/거절되면 초대 목록 갱신
    const sentInvChannel = supabase
      .channel(`dash-sent-inv:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_invitations',
          filter: `inviter_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['boardInvitations'] });
        },
      )
      .subscribe();

    // 내가 멤버로 추가/제거되면 보드 목록 갱신
    const memberChannel = supabase
      .channel(`dash-mem:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['boards'] });
        },
      )
      .subscribe();

    return () => {
      invitationChannel.unsubscribe();
      sentInvChannel.unsubscribe();
      memberChannel.unsubscribe();
    };
  }, [profile?.id, queryClient]);
}
