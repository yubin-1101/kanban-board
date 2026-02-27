import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createLabelSchema } from '@kanban/shared';
import * as labelService from '../services/labelService.js';

const router = Router();

// Get board labels
router.get('/board/:boardId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const labels = await labelService.getBoardLabels(req.params.boardId);
    res.json({ data: labels });
  } catch (err) {
    next(err);
  }
});

// Create label
router.post('/', authMiddleware, validate(createLabelSchema), async (req: AuthRequest, res, next) => {
  try {
    const label = await labelService.createLabel(req.body.board_id, req.body.name, req.body.color);
    res.status(201).json({ data: label });
  } catch (err) {
    next(err);
  }
});

// Delete label
router.delete('/:labelId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await labelService.deleteLabel(req.params.labelId);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// Add label to card
router.post('/card/:cardId/:labelId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const cardLabel = await labelService.addCardLabel(req.params.cardId, req.params.labelId);
    res.status(201).json({ data: cardLabel });
  } catch (err) {
    next(err);
  }
});

// Remove label from card
router.delete('/card/:cardId/:labelId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await labelService.removeCardLabel(req.params.cardId, req.params.labelId);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
