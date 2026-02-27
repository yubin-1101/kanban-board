import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { supabaseAdmin } from '../supabase.js';
import type { BoardRole } from '@kanban/shared';

export interface BoardRequest extends AuthRequest {
  boardId?: string;
  memberRole?: BoardRole;
}

export function requireBoardAccess(minRole?: BoardRole) {
  return async (req: BoardRequest, res: Response, next: NextFunction) => {
    const boardId = req.params.boardId || req.body.board_id;

    if (!boardId) {
      return res.status(400).json({ error: { message: '보드 ID가 필요합니다' } });
    }

    const { data: member } = await supabaseAdmin
      .from('board_members')
      .select('role')
      .eq('board_id', boardId)
      .eq('user_id', req.userId!)
      .single();

    if (!member) {
      return res.status(403).json({ error: { message: '이 보드에 접근 권한이 없습니다' } });
    }

    const roleHierarchy: Record<BoardRole, number> = {
      owner: 3,
      admin: 2,
      member: 1,
    };

    if (minRole && roleHierarchy[member.role as BoardRole] < roleHierarchy[minRole]) {
      return res.status(403).json({ error: { message: '권한이 부족합니다' } });
    }

    req.boardId = boardId;
    req.memberRole = member.role as BoardRole;
    next();
  };
}
