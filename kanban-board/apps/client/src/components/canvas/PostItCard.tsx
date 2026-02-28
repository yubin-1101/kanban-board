import { useRef, useCallback } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { avatarGradient } from '../../lib/utils';
import type { Card } from '@kanban/shared';

const POSTIT_COLORS = [
  'bg-yellow-100 border-yellow-300',
  'bg-pink-100 border-pink-300',
  'bg-blue-100 border-blue-300',
  'bg-green-100 border-green-300',
  'bg-purple-100 border-purple-300',
  'bg-orange-100 border-orange-300',
];

function getPostItColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return POSTIT_COLORS[Math.abs(hash) % POSTIT_COLORS.length];
}

interface PostItCardProps {
  card: Card;
  onMove: (cardId: string, x: number, y: number) => void;
}

export default function PostItCard({ card, onMove }: PostItCardProps) {
  const openCardModal = useUiStore((s) => s.openCardModal);
  const toolMode = useCanvasStore((s) => s.toolMode);
  const setDragging = useCanvasStore((s) => s.setDragging);
  const dragStartRef = useRef<{ startX: number; startY: number; cardX: number; cardY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const x = card.x_position ?? 200;
  const y = card.y_position ?? 200;
  const colorClass = getPostItColor(card.id);

  const labels = card.labels?.map((cl) => cl.label).filter(Boolean) ?? [];
  const hasDueDate = !!card.due_date;
  const isDuePast = hasDueDate && new Date(card.due_date!) < new Date();

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (toolMode !== 'select') return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, cardX: x, cardY: y };
    hasDraggedRef.current = false;
    setDragging(card.id, 'card');
  }, [toolMode, x, y, card.id, setDragging]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }
    const el = e.currentTarget as HTMLElement;
    el.style.left = `${dragStartRef.current.cardX + dx}px`;
    el.style.top = `${dragStartRef.current.cardY + dy}px`;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const newX = dragStartRef.current.cardX + dx;
    const newY = dragStartRef.current.cardY + dy;
    dragStartRef.current = null;
    setDragging(null, null);

    if (hasDraggedRef.current) {
      onMove(card.id, Math.max(0, newX), Math.max(0, newY));
    } else {
      openCardModal(card.id);
    }
  }, [card.id, onMove, openCardModal, setDragging]);

  return (
    <div
      className={`absolute w-48 ${colorClass} border rounded-lg shadow-md cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg select-none`}
      style={{
        left: x,
        top: y,
        transform: `rotate(${(parseInt(card.id.slice(-2), 16) % 5) - 2}deg)`,
        zIndex: toolMode === 'select' ? 20 : 5,
        pointerEvents: toolMode === 'select' ? 'auto' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="p-3">
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map((label) => (
              <span
                key={label!.id}
                className="inline-block h-[5px] min-w-[1.5rem] rounded-full opacity-90"
                style={{ backgroundColor: label!.color }}
              />
            ))}
          </div>
        )}

        <p className="text-sm text-gray-800 font-medium break-words leading-relaxed">{card.title}</p>

        {/* Badges */}
        {(hasDueDate || (card.assignees && card.assignees.length > 0)) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {hasDueDate && (
              <span className={`flex items-center gap-1 text-[10px] font-medium ${
                isDuePast ? 'text-red-500' : 'text-gray-500'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(card.due_date!).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex -space-x-1 ml-auto">
                {card.assignees.slice(0, 2).map((a) => {
                  const grad = avatarGradient(a.profile?.display_name);
                  return (
                    <div
                      key={a.id}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold ring-1 ring-white"
                      style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      title={a.profile?.display_name}
                    >
                      {a.profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
