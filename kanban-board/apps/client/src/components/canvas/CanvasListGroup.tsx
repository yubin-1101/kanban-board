import { useState, useRef, useCallback } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useCanvasStore } from '../../stores/canvasStore';
import Button from '../ui/Button';
import type { ListWithCards } from '@kanban/shared';

interface CanvasListGroupProps {
  list: ListWithCards;
  onMoveList: (listId: string, x: number, y: number) => void;
  onCreateCard: (listId: string, title: string) => void;
  onUpdateTitle: (listId: string, title: string) => void;
  onDelete: (listId: string) => void;
}

export default function CanvasListGroup({
  list,
  onMoveList,
  onCreateCard,
  onUpdateTitle,
  onDelete,
}: CanvasListGroupProps) {
  const openCardModal = useUiStore((s) => s.openCardModal);
  const toolMode = useCanvasStore((s) => s.toolMode);
  const setDragging = useCanvasStore((s) => s.setDragging);

  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; listX: number; listY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const x = list.x_position ?? 100;
  const y = list.y_position ?? 100;

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onCreateCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAdding(false);
    }
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== list.title) {
      onUpdateTitle(list.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  // Header drag handlers for moving list
  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if (toolMode !== 'select') return;
    // Don't start drag if clicking on interactive elements
    if ((e.target as HTMLElement).closest('input, button')) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, listX: x, listY: y };
    hasDraggedRef.current = false;
    setDragging(list.id, 'list');
  }, [toolMode, x, y, list.id, setDragging]);

  const handleHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }
    // Move the entire list container
    const container = (e.currentTarget as HTMLElement).closest('[data-list-container]') as HTMLElement;
    if (container) {
      container.style.left = `${dragStartRef.current.listX + dx}px`;
      container.style.top = `${dragStartRef.current.listY + dy}px`;
    }
  }, []);

  const handleHeaderPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const newX = dragStartRef.current.listX + dx;
    const newY = dragStartRef.current.listY + dy;
    dragStartRef.current = null;
    setDragging(null, null);

    if (hasDraggedRef.current) {
      onMoveList(list.id, Math.max(0, newX), Math.max(0, newY));
    }
  }, [list.id, onMoveList, setDragging]);

  return (
    <div
      data-list-container
      className="absolute w-72 glass-column rounded-2xl flex flex-col max-h-[500px] border border-white/25 shadow-card select-none"
      style={{
        left: x,
        top: y,
        zIndex: toolMode === 'select' ? 20 : 5,
        pointerEvents: toolMode === 'select' ? 'auto' : 'none',
      }}
    >
      {/* List Header - draggable */}
      <div
        className="flex items-center justify-between px-3.5 py-3 cursor-grab active:cursor-grabbing"
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
      >
        {isEditing ? (
          <input
            className="flex-1 px-2.5 py-1 text-sm font-semibold bg-white border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="flex-1 flex items-center gap-2 text-[13px] font-semibold text-ink-primary px-1 cursor-text rounded-md hover:bg-black/[0.04] py-0.5 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditTitle(list.title);
            }}
          >
            {list.title}
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 bg-black/[0.06] rounded-full text-[11px] font-medium text-ink-tertiary px-1.5">
              {list.cards.length}
            </span>
          </h3>
        )}
        <div className="relative">
          <button
            className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink-secondary rounded-lg hover:bg-black/[0.06] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 bg-white rounded-xl shadow-raised border border-surface-border py-1.5 z-30 w-36 dropdown-panel">
              <button
                className="w-full text-left px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('이 리스트를 삭제하시겠습니까?')) {
                    onDelete(list.id);
                  }
                  setShowMenu(false);
                }}
              >
                리스트 삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-1.5 space-y-1.5 min-h-[4px] list-scrollbar">
        {list.cards.map((card) => (
          <div
            key={card.id}
            className="glass-card rounded-[10px] p-3 cursor-pointer border border-black/[0.06] hover:border-black/[0.1] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200"
            onClick={() => openCardModal(card.id)}
          >
            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {card.labels.map((cl) => cl.label && (
                  <span
                    key={cl.id}
                    className="inline-block h-[5px] min-w-[2rem] rounded-full opacity-90"
                    style={{ backgroundColor: cl.label.color }}
                  />
                ))}
              </div>
            )}
            <p className="text-[13px] text-ink-primary break-words leading-relaxed font-medium">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Add Card */}
      <div className="px-2 pb-2.5 pt-1">
        {isAdding ? (
          <div className="space-y-2 animate-fade-in">
            <textarea
              className="w-full p-3 text-sm bg-white border border-surface-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 placeholder:text-ink-tertiary"
              placeholder="카드 제목을 입력하세요..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard();
                }
                if (e.key === 'Escape') setIsAdding(false);
              }}
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard}>추가</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>취소</Button>
            </div>
          </div>
        ) : (
          <button
            className="w-full text-left text-sm text-ink-tertiary hover:text-ink-secondary hover:bg-black/[0.04] rounded-xl px-3 py-2 transition-all flex items-center gap-1.5"
            onClick={() => setIsAdding(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            카드 추가
          </button>
        )}
      </div>
    </div>
  );
}
