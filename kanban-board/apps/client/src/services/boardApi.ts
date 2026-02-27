import api from '../lib/api';
import type {
  Board,
  BoardDetail,
  CreateBoardInput,
  UpdateBoardInput,
} from '@kanban/shared';

export async function getBoards(): Promise<Board[]> {
  const { data } = await api.get('/boards');
  return data.data;
}

export async function getBoardDetail(boardId: string): Promise<BoardDetail> {
  const { data } = await api.get(`/boards/${boardId}`);
  return data.data;
}

export async function createBoard(input: CreateBoardInput): Promise<Board> {
  const { data } = await api.post('/boards', input);
  return data.data;
}

export async function updateBoard(boardId: string, input: UpdateBoardInput): Promise<Board> {
  const { data } = await api.patch(`/boards/${boardId}`, input);
  return data.data;
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/boards/${boardId}`);
}
