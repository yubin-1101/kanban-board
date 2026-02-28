import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export interface DrawingCanvasHandle {
  undo: () => void;
  clear: () => void;
  getDataUrl: () => string | null;
  hasStrokes: () => boolean;
  // Real-time sync methods
  addRemoteStroke: (stroke: Stroke) => void;
  removeLastStroke: () => void;
  clearAllStrokes: () => void;
  setAllStrokes: (strokes: Stroke[]) => void;
  getStrokes: () => Stroke[];
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onSave?: (dataUrl: string) => void;
  initialData?: string;
  // External control props (for canvas board integration)
  externalTool?: 'pen' | 'eraser';
  externalColor?: string;
  externalLineWidth?: number;
  hideToolbar?: boolean;
  interactive?: boolean;
  // Real-time callbacks
  onStrokeComplete?: (stroke: Stroke) => void;
  onUndoStroke?: () => void;
  onClearStrokes?: () => void;
}

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

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas(
  {
    width,
    height,
    className = '',
    onSave,
    initialData,
    externalTool,
    externalColor,
    externalLineWidth,
    hideToolbar = false,
    interactive = true,
    onStrokeComplete,
    onUndoStroke,
    onClearStrokes,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  const [canvasSize, setCanvasSize] = useState({ w: width || 800, h: height || 400 });
  const [, forceUpdate] = useState(0);

  const activeTool = externalTool ?? tool;
  const activeColor = externalColor ?? color;
  const activeLineWidth = externalLineWidth ?? lineWidth;

  useEffect(() => {
    if (width && height) {
      setCanvasSize({ w: width, h: height });
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width: cw, height: ch } = entry.contentRect;
        if (cw > 0 && ch > 0) {
          setCanvasSize({ w: Math.floor(cw), h: Math.floor(ch) });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height]);

  useEffect(() => {
    if (initialData && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [initialData]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#f4f4f5' : stroke.color;
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => redraw());
    return () => cancelAnimationFrame(id);
  }, [canvasSize, redraw]);

  const handleUndo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    redraw();
    forceUpdate((n) => n + 1);
    onUndoStroke?.();
  }, [redraw, onUndoStroke]);

  const handleClear = useCallback(() => {
    strokesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    forceUpdate((n) => n + 1);
    onClearStrokes?.();
  }, [onClearStrokes]);

  // Methods for real-time sync (called from outside, no callbacks fired)
  const addRemoteStroke = useCallback((stroke: Stroke) => {
    strokesRef.current.push(stroke);
    redraw();
    forceUpdate((n) => n + 1);
  }, [redraw]);

  const removeLastStroke = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    redraw();
    forceUpdate((n) => n + 1);
  }, [redraw]);

  const clearAllStrokes = useCallback(() => {
    strokesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    forceUpdate((n) => n + 1);
  }, []);

  const setAllStrokes = useCallback((strokes: Stroke[]) => {
    strokesRef.current = [...strokes];
    redraw();
    forceUpdate((n) => n + 1);
  }, [redraw]);

  useImperativeHandle(ref, () => ({
    undo: handleUndo,
    clear: handleClear,
    getDataUrl: () => canvasRef.current?.toDataURL('image/png') ?? null,
    hasStrokes: () => strokesRef.current.length > 0,
    addRemoteStroke,
    removeLastStroke,
    clearAllStrokes,
    setAllStrokes,
    getStrokes: () => [...strokesRef.current],
  }), [handleUndo, handleClear, addRemoteStroke, removeLastStroke, clearAllStrokes, setAllStrokes]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const point = getPoint(e);
    currentStrokeRef.current = { points: [point], color: activeColor, width: activeLineWidth, tool: activeTool };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'eraser' ? '#f4f4f5' : activeColor;
      ctx.lineWidth = activeTool === 'eraser' ? activeLineWidth * 3 : activeLineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.moveTo(point.x, point.y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const point = getPoint(e);
    currentStrokeRef.current.points.push(point);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      strokesRef.current.push(currentStrokeRef.current);
      onStrokeComplete?.(currentStrokeRef.current);
      forceUpdate((n) => n + 1);
    }
    currentStrokeRef.current = null;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.globalCompositeOperation = 'source-over';
  };

  const handleExport = () => {
    if (!canvasRef.current || !onSave) return;
    onSave(canvasRef.current.toDataURL('image/png'));
  };

  const hasStrokes = strokesRef.current.length > 0;

  return (
    <div className={`flex flex-col ${className}`} style={!interactive ? { pointerEvents: 'none' } : undefined}>
      {!hideToolbar && (
        <div className="flex items-center gap-1 p-2 bg-white/90 backdrop-blur-sm border-b border-zinc-200 rounded-t-xl flex-wrap">
          <button
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${tool === 'pen' ? 'bg-accent-500 text-white shadow-sm' : 'bg-zinc-100 text-ink-secondary hover:bg-zinc-200'}`}
            onClick={() => setTool('pen')}
            title="펜"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${tool === 'eraser' ? 'bg-accent-500 text-white shadow-sm' : 'bg-zinc-100 text-ink-secondary hover:bg-zinc-200'}`}
            onClick={() => setTool('eraser')}
            title="지우개"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5M14.5 3.5l6 6L11 19H5l-1-1 9.5-14.5z" />
            </svg>
          </button>
          <div className="w-px h-5 bg-zinc-200 mx-1" />
          <div className="flex gap-0.5">
            {COLORS.map((c) => (
              <button
                key={c.value}
                className={`w-5 h-5 rounded-full transition-all ${color === c.value && tool === 'pen' ? 'ring-2 ring-offset-1 ring-accent-400 scale-110' : 'hover:scale-110'} ${c.value === '#ffffff' ? 'border border-zinc-300' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => { setColor(c.value); setTool('pen'); }}
                title={c.label}
              />
            ))}
          </div>
          <div className="w-px h-5 bg-zinc-200 mx-1" />
          <div className="flex gap-0.5">
            {WIDTHS.map((w) => (
              <button
                key={w.value}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${lineWidth === w.value ? 'bg-zinc-200 ring-1 ring-accent-400' : 'hover:bg-zinc-100'}`}
                onClick={() => setLineWidth(w.value)}
                title={w.label}
              >
                <div className="rounded-full bg-ink-primary" style={{ width: w.value * 1.5, height: w.value * 1.5 }} />
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-zinc-200 mx-1" />
          <button className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-ink-secondary hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleUndo} disabled={!hasStrokes} title="되돌리기">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
          </button>
          <button className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-ink-secondary hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleClear} disabled={!hasStrokes} title="전체삭제">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          {onSave && (
            <>
              <div className="w-px h-5 bg-zinc-200 mx-1" />
              <button className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent-500 text-white hover:bg-accent-600 transition-all disabled:opacity-40" onClick={handleExport} disabled={!hasStrokes} title="저장">저장</button>
            </>
          )}
        </div>
      )}
      <div
        ref={containerRef}
        className={`flex-1 ${hideToolbar ? '' : 'bg-zinc-50 rounded-b-xl'} overflow-hidden`}
        style={width && height ? { width, height } : { minHeight: 200 }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="touch-none"
          style={{ cursor: activeTool === 'eraser' ? 'cell' : 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
});

export default DrawingCanvas;
