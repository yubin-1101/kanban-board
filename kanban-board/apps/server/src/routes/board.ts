import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireBoardAccess, BoardRequest } from '../middleware/boardAccess.js';
import { validate } from '../middleware/validate.js';
import { createBoardSchema, updateBoardSchema } from '@kanban/shared';
import * as boardService from '../services/boardService.js';

const router = Router();

// Get user's boards
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const boards = await boardService.getUserBoards(req.userId!);
    res.json({ data: boards });
  } catch (err) {
    next(err);
  }
});

// Get board detail
router.get('/:boardId', authMiddleware, requireBoardAccess(), async (req: BoardRequest, res, next) => {
  try {
    const board = await boardService.getBoardDetail(req.boardId!);
    res.json({ data: board });
  } catch (err) {
    next(err);
  }
});

// Create board
router.post('/', authMiddleware, validate(createBoardSchema), async (req: AuthRequest, res, next) => {
  try {
    const board = await boardService.createBoard(req.userId!, req.body);
    res.status(201).json({ data: board });
  } catch (err) {
    next(err);
  }
});

// Update board
router.patch('/:boardId', authMiddleware, requireBoardAccess('admin'), validate(updateBoardSchema), async (req: BoardRequest, res, next) => {
  try {
    const board = await boardService.updateBoard(req.boardId!, req.body);
    res.json({ data: board });
  } catch (err) {
    next(err);
  }
});

// Delete board
router.delete('/:boardId', authMiddleware, requireBoardAccess('owner'), async (req: BoardRequest, res, next) => {
  try {
    await boardService.deleteBoard(req.boardId!);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
