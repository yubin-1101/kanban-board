import { useState, useEffect } from 'react';
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { ListWithCards, Card } from '@kanban/shared';

// Calculate new position between two items
export function calcPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 65536;
  if (before === null) return after! / 2;
  if (after === null) return before + 65536;
  return (before + after) / 2;
}

interface UseDragAndDropProps {
  lists: ListWithCards[];
  onMoveCard: (input: { card_id: string; target_list_id: string; position: number }) => void;
  onMoveList: (input: { listId: string; position: number }) => void;
}

export function useDragAndDrop({ lists, onMoveCard, onMoveList }: UseDragAndDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'card' | 'list' | null>(null);
  const [localLists, setLocalLists] = useState<ListWithCards[]>(lists);

  // Keep local state in sync with server
  useEffect(() => {
    if (!activeId) {
      setLocalLists(lists);
    }
  }, [lists, activeId]);

  function findCardList(cardId: string): ListWithCards | undefined {
    return localLists.find((l) => l.cards.some((c) => c.id === cardId));
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);

    if (active.data.current?.type === 'list') {
      setActiveType('list');
    } else {
      setActiveType('card');
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || activeType !== 'card') return;

    const activeListId = active.data.current?.sortable?.containerId || findCardList(active.id as string)?.id;
    let overListId = over.data.current?.sortable?.containerId;

    // If dropping over a list container directly
    if (over.data.current?.type === 'list') {
      overListId = over.id as string;
    }

    if (!activeListId || !overListId || activeListId === overListId) return;

    setLocalLists((prev) => {
      const sourceList = prev.find((l) => l.id === activeListId);
      const destList = prev.find((l) => l.id === overListId);
      if (!sourceList || !destList) return prev;

      const card = sourceList.cards.find((c) => c.id === active.id);
      if (!card) return prev;

      return prev.map((l) => {
        if (l.id === activeListId) {
          return { ...l, cards: l.cards.filter((c) => c.id !== active.id) };
        }
        if (l.id === overListId) {
          const overIndex = l.cards.findIndex((c) => c.id === over.id);
          const newCards = [...l.cards];
          const insertIdx = overIndex >= 0 ? overIndex : newCards.length;
          newCards.splice(insertIdx, 0, { ...card, list_id: overListId! });
          return { ...l, cards: newCards };
        }
        return l;
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    if (activeType === 'list') {
      const oldIndex = localLists.findIndex((l) => l.id === active.id);
      const newIndex = localLists.findIndex((l) => l.id === over.id);
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(localLists, oldIndex, newIndex);
        setLocalLists(reordered);

        const before = newIndex > 0 ? reordered[newIndex - 1].position : null;
        const after = newIndex < reordered.length - 1 ? reordered[newIndex + 1].position : null;
        const newPosition = calcPosition(before, after);

        onMoveList({ listId: active.id as string, position: newPosition });
      }
      return;
    }

    // Card drag end
    const activeList = localLists.find((l) => l.cards.some((c) => c.id === active.id));
    if (!activeList) return;

    const cards = activeList.cards;
    const oldIdx = cards.findIndex((c) => c.id === active.id);
    const newIdx = cards.findIndex((c) => c.id === over.id);

    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      const reordered = arrayMove(cards, oldIdx, newIdx);
      setLocalLists((prev) =>
        prev.map((l) => (l.id === activeList.id ? { ...l, cards: reordered } : l)),
      );

      const before = newIdx > 0 ? reordered[newIdx - 1].position : null;
      const after = newIdx < reordered.length - 1 ? reordered[newIdx + 1].position : null;
      const newPosition = calcPosition(before, after);

      onMoveCard({
        card_id: active.id as string,
        target_list_id: activeList.id,
        position: newPosition,
      });
    } else if (oldIdx === -1) {
      // Cross-list drop already handled in dragOver
      const cardIdx = cards.findIndex((c) => c.id === active.id);
      if (cardIdx === -1) return;

      const before = cardIdx > 0 ? cards[cardIdx - 1].position : null;
      const after = cardIdx < cards.length - 1 ? cards[cardIdx + 1].position : null;
      const newPosition = calcPosition(before, after);

      onMoveCard({
        card_id: active.id as string,
        target_list_id: activeList.id,
        position: newPosition,
      });
    }
  }

  const activeCard: Card | undefined = activeId && activeType === 'card'
    ? localLists.flatMap((l) => l.cards).find((c) => c.id === activeId)
    : undefined;

  const activeList: ListWithCards | undefined = activeId && activeType === 'list'
    ? localLists.find((l) => l.id === activeId)
    : undefined;

  return {
    localLists,
    activeId,
    activeType,
    activeCard,
    activeList,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
