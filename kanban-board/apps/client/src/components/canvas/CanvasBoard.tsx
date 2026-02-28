import { useRef, useState, useCallback } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useRealtimeDrawing } from '../../hooks/useRealtimeDrawing';
import DrawingCanvas, { type DrawingCanvasHandle } from '../drawing/DrawingCanvas';
import CanvasToolbar from './CanvasToolbar';
import PostItCard from './PostItCard';
import CanvasListGroup from './CanvasListGroup';
import type { BoardDetail, Card, ListWithCards } from '@kanban/shared';

interface CanvasBoardProps {
  boardId: string;
  board: BoardDetail;
  onCreateFreeCard: (title: string, x: number, y: number) => void;
  onCreateListCard: (listId: string, title: string) => void;
  onMoveCardCanvas: (cardId: string, x: number, y: number) => void;
  onMoveListCanvas: (listId: string, x: number, y: number) => void;
  onCreateList: (title: string) => void;
  onUpdateListTitle: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
}

export default function CanvasBoard({
  boardId,
  board,
  onCreateFreeCard,
  onCreateListCard,
  onMoveCardCanvas,
  onMoveListCanvas,
  onCreateList,
  onUpdateListTitle,
  onDeleteList,
}: CanvasBoardProps) {
  const drawingRef = useRef<DrawingCanvasHandle>(null);
  const { toolMode } = useCanvasStore();
  const penColor = useCanvasStore((s) => s.penColor);
  const penWidth = useCanvasStore((s) => s.penWidth);

  // Real-time drawing sync
  const { onStrokeComplete, onUndoStroke, onClearStrokes } = useRealtimeDrawing(boardId, drawingRef);

  const [addingCardAt, setAddingCardAt] = useState<{ x: number; y: number } | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const freeCards: Card[] = board.free_cards ?? [];
  const lists: ListWithCards[] = board.lists ?? [];

  const findEmptySpot = useCallback(() => {
    const occupied = [
      ...freeCards.map((c) => ({ x: c.x_position ?? 0, y: c.y_position ?? 0 })),
      ...lists.map((l) => ({ x: l.x_position ?? 0, y: l.y_position ?? 0 })),
    ];
    let x = 100;
    let y = 100;
    let found = false;
    while (!found) {
      const collision = occupied.some(
        (o) => Math.abs(o.x - x) < 220 && Math.abs(o.y - y) < 100,
      );
      if (!collision) {
        found = true;
      } else {
        x += 220;
        if (x > 1600) { x = 100; y += 150; }
      }
    }
    return { x, y };
  }, [freeCards, lists]);

  const handleAddCard = () => {
    const spot = findEmptySpot();
    setAddingCardAt(spot);
    setNewCardTitle('');
  };

  const handleConfirmAddCard = () => {
    if (!newCardTitle.trim() || !addingCardAt) return;
    onCreateFreeCard(newCardTitle.trim(), addingCardAt.x, addingCardAt.y);
    setAddingCardAt(null);
    setNewCardTitle('');
  };

  const handleAddList = () => {
    setAddingList(true);
    setNewListTitle('');
  };

  const handleConfirmAddList = () => {
    if (!newListTitle.trim()) return;
    onCreateList(newListTitle.trim());
    setAddingList(false);
    setNewListTitle('');
  };

  const isDrawing = toolMode === 'pen' || toolMode === 'eraser';

  return (
    <div className="relative w-full h-full overflow-auto">
      {/* z-10: Drawing canvas background */}
      <div className="absolute inset-0 z-10" style={{ pointerEvents: isDrawing ? 'auto' : 'none' }}>
        <DrawingCanvas
          ref={drawingRef}
          className="w-full h-full"
          hideToolbar
          externalTool={isDrawing ? (toolMode as 'pen' | 'eraser') : undefined}
          externalColor={penColor}
          externalLineWidth={penWidth}
          interactive={isDrawing}
          onStrokeComplete={onStrokeComplete}
          onUndoStroke={onUndoStroke}
          onClearStrokes={onClearStrokes}
        />
      </div>

      {/* z-20: Cards and lists layer */}
      <div
        className="absolute inset-0 z-20"
        style={{ pointerEvents: isDrawing ? 'none' : 'auto' }}
      >
        {freeCards.map((card) => (
          <PostItCard key={card.id} card={card} onMove={onMoveCardCanvas} />
        ))}
        {lists.map((list) => (
          <CanvasListGroup
            key={list.id}
            list={list}
            onMoveList={onMoveListCanvas}
            onCreateCard={onCreateListCard}
            onUpdateTitle={onUpdateListTitle}
            onDelete={onDeleteList}
          />
        ))}

        {/* Add card input overlay */}
        {addingCardAt && (
          <div
            className="absolute bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg p-3 w-48 z-30"
            style={{ left: addingCardAt.x, top: addingCardAt.y }}
          >
            <textarea
              className="w-full p-2 text-sm bg-white/80 border border-yellow-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
              placeholder="카드 제목..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirmAddCard(); }
                if (e.key === 'Escape') setAddingCardAt(null);
              }}
              rows={2}
              autoFocus
            />
            <div className="flex gap-1 mt-2">
              <button className="px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-md hover:bg-yellow-600" onClick={handleConfirmAddCard}>추가</button>
              <button className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700" onClick={() => setAddingCardAt(null)}>취소</button>
            </div>
          </div>
        )}
      </div>

      {/* z-30: Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <CanvasToolbar drawingRef={drawingRef} onAddCard={handleAddCard} onAddList={handleAddList} />
      </div>

      {/* Add list modal */}
      {addingList && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl p-5 shadow-raised border border-surface-border w-80 animate-fade-in">
            <h3 className="text-sm font-semibold text-ink-primary mb-3">리스트 추가</h3>
            <input
              className="w-full px-3.5 py-2.5 text-sm border border-surface-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 placeholder:text-ink-tertiary"
              placeholder="리스트 이름을 입력하세요..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmAddList();
                if (e.key === 'Escape') setAddingList(false);
              }}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-1.5 text-sm font-medium bg-accent-500 text-white rounded-lg hover:bg-accent-600" onClick={handleConfirmAddList}>추가</button>
              <button className="px-3 py-1.5 text-sm font-medium text-ink-secondary hover:text-ink-primary" onClick={() => setAddingList(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
