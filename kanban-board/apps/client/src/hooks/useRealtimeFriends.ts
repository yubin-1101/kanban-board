import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * friendships 테이블을 실시간 구독해서 친구 관련 쿼리를 자동으로 갱신합니다.
 * 상대방이 요청을 수락/거절/삭제해도 즉시 반영됩니다.
 */
export function useRealtimeFriends() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    };

    // requester 로 참여한 friendship 변화 감지
    const requesterChannel = supabase
      .channel(`friends-req:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${profile.id}`,
        },
        invalidateAll,
      )
      .subscribe();

    // addressee 로 참여한 friendship 변화 감지
    const addresseeChannel = supabase
      .channel(`friends-addr:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${profile.id}`,
        },
        invalidateAll,
      )
      .subscribe();

    channelRef.current = requesterChannel;

    return () => {
      requesterChannel.unsubscribe();
      addresseeChannel.unsubscribe();
    };
  }, [profile?.id, queryClient]);
}
