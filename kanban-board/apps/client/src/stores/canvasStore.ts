import { create } from 'zustand';

export type ToolMode = 'select' | 'pen' | 'eraser';

interface CanvasState {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;

  penColor: string;
  setPenColor: (color: string) => void;

  penWidth: number;
  setPenWidth: (width: number) => void;

  panX: number;
  panY: number;
  zoom: number;
  setPan: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;

  draggingId: string | null;
  draggingType: 'card' | 'list' | null;
  setDragging: (id: string | null, type: 'card' | 'list' | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  toolMode: 'select',
  setToolMode: (mode) => set({ toolMode: mode }),

  penColor: '#000000',
  setPenColor: (color) => set({ penColor: color }),

  penWidth: 4,
  setPenWidth: (width) => set({ penWidth: width }),

  panX: 0,
  panY: 0,
  zoom: 1,
  setPan: (x, y) => set({ panX: x, panY: y }),
  setZoom: (zoom) => set({ zoom }),

  draggingId: null,
  draggingType: null,
  setDragging: (id, type) => set({ draggingId: id, draggingType: type }),
}));
