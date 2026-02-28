import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getDrawing, saveDrawing } from '../services/drawingApi';
import type { DrawingCanvasHandle, Stroke } from '../components/drawing/DrawingCanvas';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeDrawing(
  boardId: string | undefined,
  drawingRef: React.RefObject<DrawingCanvasHandle | null>,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const boardIdRef = useRef(boardId);
  boardIdRef.current = boardId;

  // Immediate save (no debounce)
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!boardIdRef.current || !drawingRef.current || !dirtyRef.current) return;
    dirtyRef.current = false;
    const strokes = drawingRef.current.getStrokes();
    if (strokes) {
      saveDrawing(boardIdRef.current, strokes).catch(console.error);
    }
  }, [drawingRef]);

  // Debounced save to DB
  const debouncedSave = useCallback(() => {
    if (!boardIdRef.current || !drawingRef.current) return;
    dirtyRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      dirtyRef.current = false;
      const strokes = drawingRef.current?.getStrokes();
      if (strokes && boardIdRef.current) {
        saveDrawing(boardIdRef.current, strokes).catch(console.error);
      }
    }, 1500);
  }, [drawingRef]);

  // Load initial strokes from DB
  useEffect(() => {
    if (!boardId) return;

    getDrawing(boardId)
      .then((data) => {
        if (data.strokes && data.strokes.length > 0 && drawingRef.current) {
          drawingRef.current.setAllStrokes(data.strokes as Stroke[]);
        }
      })
      .catch(console.error);
  }, [boardId, drawingRef]);

  // Set up Supabase Broadcast channel
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase.channel(`drawing:${boardId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'stroke-add' }, (payload) => {
        drawingRef.current?.addRemoteStroke(payload.payload as Stroke);
      })
      .on('broadcast', { event: 'stroke-undo' }, () => {
        drawingRef.current?.removeLastStroke();
      })
      .on('broadcast', { event: 'stroke-clear' }, () => {
        drawingRef.current?.clearAllStrokes();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [boardId, drawingRef]);

  // On unmount: flush pending save immediately
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      // If there are unsaved changes, save synchronously via sendBeacon or fire-and-forget
      if (dirtyRef.current && boardIdRef.current && drawingRef.current) {
        const strokes = drawingRef.current.getStrokes();
        if (strokes) {
          saveDrawing(boardIdRef.current, strokes).catch(console.error);
        }
        dirtyRef.current = false;
      }
    };
  }, [drawingRef]);

  const onStrokeComplete = useCallback(
    (stroke: Stroke) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stroke-add',
        payload: stroke,
      });
      debouncedSave();
    },
    [debouncedSave],
  );

  const onUndoStroke = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'stroke-undo',
      payload: {},
    });
    debouncedSave();
  }, [debouncedSave]);

  const onClearStrokes = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'stroke-clear',
      payload: {},
    });
    if (boardIdRef.current) {
      dirtyRef.current = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      saveDrawing(boardIdRef.current, []).catch(console.error);
    }
  }, []);

  return { onStrokeComplete, onUndoStroke, onClearStrokes };
}
