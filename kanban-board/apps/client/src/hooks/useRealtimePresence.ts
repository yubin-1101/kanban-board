import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RemoteCursorData {
  userId: string;
  displayName: string;
  x: number | null;
  y: number | null;
}

export function useRealtimePresence(boardId: string) {
  const profile = useAuthStore((s) => s.profile);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ x: number | null; y: number | null } | null>(null);
  const lastSentRef = useRef<number>(0);

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursorData>>(new Map());

  useEffect(() => {
    if (!boardId || !profile) return;

    const userId = profile.id;
    const displayName = profile.display_name ?? 'Unknown';

    const channel = supabase.channel(`presence:${boardId}`, {
      config: { broadcast: { self: false } },
    });

    // Presence: track online status
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const ids = new Set<string>();
      for (const key of Object.keys(state)) {
        for (const p of state[key]) {
          const uid = (p as unknown as { userId: string }).userId;
          if (uid !== userId) ids.add(uid);
        }
      }
      setOnlineUserIds(ids);
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const leftIds = leftPresences.map((p) => (p as unknown as { userId: string }).userId);
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        for (const id of leftIds) next.delete(id);
        return next;
      });
    });

    // Broadcast: receive cursor moves
    channel.on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
      const { userId: uid, displayName: name, x, y } = payload as {
        userId: string;
        displayName: string;
        x: number | null;
        y: number | null;
      };
      if (uid === userId) return;
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        if (x === null || y === null) {
          next.delete(uid);
        } else {
          next.set(uid, { userId: uid, displayName: name, x, y });
        }
        return next;
      });
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ userId, displayName });
      }
    });

    channelRef.current = channel;

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      channel.untrack();
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [boardId, profile]);

  const broadcastCursor = useCallback(
    (x: number | null, y: number | null) => {
      if (!channelRef.current || !profile) return;

      pendingCursorRef.current = { x, y };

      // For null (leave), send immediately
      if (x === null || y === null) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor-move',
          payload: {
            userId: profile.id,
            displayName: profile.display_name ?? 'Unknown',
            x: null,
            y: null,
          },
        });
        pendingCursorRef.current = null;
        return;
      }

      // Throttle with rAF (~16ms) + 50ms minimum interval
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const now = Date.now();
        if (now - lastSentRef.current < 50) return;
        lastSentRef.current = now;

        const pending = pendingCursorRef.current;
        if (!pending || !channelRef.current || !profile) return;
        pendingCursorRef.current = null;

        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor-move',
          payload: {
            userId: profile.id,
            displayName: profile.display_name ?? 'Unknown',
            x: pending.x,
            y: pending.y,
          },
        });
      });
    },
    [profile],
  );

  return { onlineUserIds, remoteCursors, broadcastCursor };
}
