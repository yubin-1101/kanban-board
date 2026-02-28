import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import * as drawingService from '../services/drawingService.js';

const router = Router();

// Get drawing for a board
router.get('/:boardId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const drawing = await drawingService.getDrawing(req.params.boardId);
    res.json({ data: drawing });
  } catch (err) {
    next(err);
  }
});

// Save drawing for a board
router.put('/:boardId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const drawing = await drawingService.saveDrawing(req.params.boardId, req.body.strokes);
    res.json({ data: drawing });
  } catch (err) {
    next(err);
  }
});

export default router;
