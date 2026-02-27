import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createChecklistSchema, createChecklistItemSchema, updateChecklistItemSchema } from '@kanban/shared';
import * as checklistService from '../services/checklistService.js';

const router = Router();

// Create checklist
router.post('/:cardId', authMiddleware, validate(createChecklistSchema), async (req: AuthRequest, res, next) => {
  try {
    const checklist = await checklistService.createChecklist(req.params.cardId, req.body.title);
    res.status(201).json({ data: checklist });
  } catch (err) {
    next(err);
  }
});

// Delete checklist
router.delete('/:checklistId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await checklistService.deleteChecklist(req.params.checklistId);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// Create checklist item
router.post('/:checklistId/items', authMiddleware, validate(createChecklistItemSchema), async (req: AuthRequest, res, next) => {
  try {
    const item = await checklistService.createChecklistItem(req.params.checklistId, req.body.title);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
});

// Update checklist item
router.patch('/items/:itemId', authMiddleware, validate(updateChecklistItemSchema), async (req: AuthRequest, res, next) => {
  try {
    const item = await checklistService.updateChecklistItem(req.params.itemId, req.body);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

// Delete checklist item
router.delete('/items/:itemId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await checklistService.deleteChecklistItem(req.params.itemId);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
