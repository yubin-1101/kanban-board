import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoard } from '../hooks/useBoard';
import { useRealtimeBoard } from '../hooks/useRealtimeBoard';
import { boardGradient } from '../lib/utils';
import CanvasBoard from '../components/canvas/CanvasBoard';
import CardDetailModal from '../components/card/CardDetailModal';
import MemberPanel from '../components/invite/MemberPanel';
import Button from '../components/ui/Button';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [showMembers, setShowMembers] = useState(false);

  const {
    board,
    isLoading,
    error,
    createList,
    updateList,
    deleteList,
    createCard,
    createFreeCard,
    moveCardCanvas,
    moveListCanvas,
  } = useBoard(boardId!);

  useRealtimeBoard(boardId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-72 rounded-2xl animate-pulse" style={{ height: `${320 + i * 40}px` }}>
              <div className="h-full bg-white/60 rounded-2xl backdrop-blur-sm border border-white/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 bg-surface-base">
        <div className="w-16 h-16 bg-surface-raised rounded-2xl flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-ink-secondary font-medium">보드를 찾을 수 없습니다</p>
        <Button onClick={() => navigate('/')}>대시보드로 돌아가기</Button>
      </div>
    );
  }

  const grad = boardGradient(board.background_color);

  return (
    <div
      className="h-screen flex flex-col board-bg"
      style={{ background: grad.bg }}
    >
      {/* Board Header */}
      <header className="flex items-center justify-between px-5 h-14 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-all rounded-lg hover:bg-white/10 px-2.5 py-1.5"
            onClick={() => navigate('/')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            보드 목록
          </button>
          <div className="w-px h-4 bg-white/15" />
          <h1 className="text-[15px] font-semibold text-white/95 tracking-tight">{board.title}</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {board.board_members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border-[1.5px] border-white/25 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-transparent hover:ring-white/20 transition-all"
                title={m.profile?.display_name}
              >
                {m.profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            ))}
            {board.board_members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm border-[1.5px] border-white/20 flex items-center justify-center text-white/70 text-[10px] font-medium">
                +{board.board_members.length - 4}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-[13px] font-medium bg-white/8 hover:bg-white/15 rounded-lg px-3 py-1.5 transition-all border border-white/10"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            멤버
          </button>
        </div>
      </header>

      {/* Canvas Board */}
      <div className="flex-1 relative overflow-hidden">
        <CanvasBoard
          boardId={boardId!}
          board={board}
          onCreateFreeCard={(title, x, y) => createFreeCard({ title, x, y })}
          onCreateListCard={(listId, title) => createCard({ listId, title })}
          onMoveCardCanvas={(cardId, x, y) =>
            moveCardCanvas({ card_id: cardId, x_position: x, y_position: y, list_id: null })
          }
          onMoveListCanvas={(listId, x, y) => moveListCanvas({ listId, x, y })}
          onCreateList={createList}
          onUpdateListTitle={(listId, title) => updateList({ listId, title })}
          onDeleteList={deleteList}
        />
      </div>

      <CardDetailModal
        boardId={boardId!}
        boardMembers={board.board_members}
        boardLabels={board.labels}
      />

      <MemberPanel
        boardId={boardId!}
        members={board.board_members}
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
      />
    </div>
  );
}
