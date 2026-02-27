import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireBoardAccess, BoardRequest } from '../middleware/boardAccess.js';
import { validate } from '../middleware/validate.js';
import { createListSchema, moveListSchema } from '@kanban/shared';
import * as listService from '../services/listService.js';

const router = Router();

// Create list
router.post('/', authMiddleware, validate(createListSchema), requireBoardAccess(), async (req: BoardRequest, res, next) => {
  try {
    const list = await listService.createList(req.boardId!, req.body.title);
    res.status(201).json({ data: list });
  } catch (err) {
    next(err);
  }
});

// Update list title
router.patch('/:listId', authMiddleware, async (req: BoardRequest, res, next) => {
  try {
    const list = await listService.updateList(req.params.listId, req.body.title);
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

// Move list
router.patch('/:listId/move', authMiddleware, async (req: BoardRequest, res, next) => {
  try {
    const list = await listService.moveList(req.params.listId, req.body.position);
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

// Delete list
router.delete('/:listId', authMiddleware, async (req: BoardRequest, res, next) => {
  try {
    await listService.deleteList(req.params.listId);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
