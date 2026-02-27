import { useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import CardItem from '../card/CardItem';
import Button from '../ui/Button';
import type { ListWithCards } from '@kanban/shared';

interface ListColumnProps {
  list: ListWithCards;
  onCreateCard: (listId: string, title: string) => void;
  onUpdateTitle: (listId: string, title: string) => void;
  onDelete: (listId: string) => void;
  isDragOverlay?: boolean;
}

export default function ListColumn({
  list,
  onCreateCard,
  onUpdateTitle,
  onDelete,
  isDragOverlay,
}: ListColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: { type: 'list', list },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: list.id,
    data: { type: 'list' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

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

  const cardIds = list.cards.map((c) => c.id);

  return (
    <div
      ref={isDragOverlay ? undefined : setSortableRef}
      style={isDragOverlay ? undefined : style}
      className={`flex-shrink-0 w-72 glass-column rounded-2xl flex flex-col max-h-[calc(100vh-120px)] border shadow-card ${
        isDragOverlay
          ? 'shadow-float rotate-2 scale-105 border-white/40'
          : 'border-white/25 hover:border-white/35 transition-colors'
      }`}
    >
      {/* List Header */}
      <div
        className="flex items-center justify-between px-3.5 py-3 cursor-grab active:cursor-grabbing"
        {...(isDragOverlay ? {} : attributes)}
        {...(isDragOverlay ? {} : listeners)}
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
            <div className="absolute right-0 top-9 bg-white rounded-xl shadow-raised border border-surface-border py-1.5 z-10 w-36 dropdown-panel">
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
      <div ref={setDroppableRef} className="flex-1 overflow-y-auto px-2 pb-1.5 space-y-1.5 min-h-[4px] list-scrollbar">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy} id={list.id}>
          {list.cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>
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
