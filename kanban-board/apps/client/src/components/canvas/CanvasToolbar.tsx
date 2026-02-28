import { useCanvasStore, type ToolMode } from '../../stores/canvasStore';
import type { DrawingCanvasHandle } from '../drawing/DrawingCanvas';

const COLORS = [
  { value: '#000000', label: '검정' },
  { value: '#ef4444', label: '빨강' },
  { value: '#3b82f6', label: '파랑' },
  { value: '#22c55e', label: '초록' },
  { value: '#a855f7', label: '보라' },
  { value: '#f97316', label: '주황' },
  { value: '#6b7280', label: '회색' },
  { value: '#ffffff', label: '흰색' },
];

const WIDTHS = [
  { value: 2, label: '가늘게' },
  { value: 4, label: '보통' },
  { value: 8, label: '굵게' },
];

interface CanvasToolbarProps {
  drawingRef: React.RefObject<DrawingCanvasHandle | null>;
  onAddCard: () => void;
  onAddList: () => void;
}

export default function CanvasToolbar({ drawingRef, onAddCard, onAddList }: CanvasToolbarProps) {
  const { toolMode, setToolMode, penColor, setPenColor, penWidth, setPenWidth } = useCanvasStore();

  const toolBtn = (mode: ToolMode, label: string, icon: React.ReactNode) => (
    <button
      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        toolMode === mode
          ? 'bg-accent-500 text-white shadow-sm'
          : 'bg-white/80 text-ink-secondary hover:bg-white'
      }`}
      onClick={() => setToolMode(mode)}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-raised border border-white/50">
      {/* Select tool */}
      {toolBtn('select', '선택',
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2z" />
        </svg>
      )}

      <div className="w-px h-5 bg-zinc-200 mx-0.5" />

      {/* Pen */}
      {toolBtn('pen', '펜',
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )}
      {/* Eraser */}
      {toolBtn('eraser', '지우개',
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5M14.5 3.5l6 6L11 19H5l-1-1 9.5-14.5z" />
        </svg>
      )}

      {/* Colors & Width - only show when pen/eraser active */}
      {(toolMode === 'pen' || toolMode === 'eraser') && (
        <>
          <div className="w-px h-5 bg-zinc-200 mx-0.5" />
          {toolMode === 'pen' && (
            <div className="flex gap-0.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`w-5 h-5 rounded-full transition-all ${
                    penColor === c.value
                      ? 'ring-2 ring-offset-1 ring-accent-400 scale-110'
                      : 'hover:scale-110'
                  } ${c.value === '#ffffff' ? 'border border-zinc-300' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => {
                    setPenColor(c.value);
                    setToolMode('pen');
                  }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          <div className="flex gap-0.5">
            {WIDTHS.map((w) => (
              <button
                key={w.value}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  penWidth === w.value
                    ? 'bg-zinc-200 ring-1 ring-accent-400'
                    : 'hover:bg-zinc-100'
                }`}
                onClick={() => setPenWidth(w.value)}
                title={w.label}
              >
                <div
                  className="rounded-full bg-ink-primary"
                  style={{ width: w.value * 1.5, height: w.value * 1.5 }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          {/* Undo / Clear */}
          <button
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/80 text-ink-secondary hover:bg-white transition-all"
            onClick={() => drawingRef.current?.undo()}
            title="되돌리기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
            </svg>
          </button>
          <button
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/80 text-ink-secondary hover:bg-white transition-all"
            onClick={() => drawingRef.current?.clear()}
            title="전체지우기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </>
      )}

      <div className="w-px h-5 bg-zinc-200 mx-0.5" />

      {/* Add card / list */}
      <button
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all"
        onClick={onAddCard}
        title="카드 추가"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        카드
      </button>
      <button
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
        onClick={onAddList}
        title="리스트 추가"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        리스트
      </button>
    </div>
  );
}
