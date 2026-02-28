import api from '../lib/api';

export interface StrokeData {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export async function getDrawing(boardId: string): Promise<{ strokes: StrokeData[] }> {
  const { data } = await api.get(`/drawings/${boardId}`);
  return data.data;
}

export async function saveDrawing(boardId: string, strokes: StrokeData[]): Promise<void> {
  await api.put(`/drawings/${boardId}`, { strokes });
}
