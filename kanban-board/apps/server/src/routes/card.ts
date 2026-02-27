import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCardSchema, updateCardSchema, moveCardSchema } from '@kanban/shared';
import * as cardService from '../services/cardService.js';

const router = Router();

// Get card detail
router.get('/:cardId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const card = await cardService.getCard(req.params.cardId);
    res.json({ data: card });
  } catch (err) {
    next(err);
  }
});

// Create card
router.post('/', authMiddleware, validate(createCardSchema), async (req: AuthRequest, res, next) => {
  try {
    const card = await cardService.createCard(req.body.list_id, req.body.title, req.userId!);
    res.status(201).json({ data: card });
  } catch (err) {
    next(err);
  }
});

// Update card
router.patch('/:cardId', authMiddleware, validate(updateCardSchema), async (req: AuthRequest, res, next) => {
  try {
    const card = await cardService.updateCard(req.params.cardId, req.body);
    res.json({ data: card });
  } catch (err) {
    next(err);
  }
});

// Move card (DnD)
router.post('/move', authMiddleware, validate(moveCardSchema), async (req: AuthRequest, res, next) => {
  try {
    const card = await cardService.moveCard(req.body.card_id, req.body.target_list_id, req.body.position);
    res.json({ data: card });
  } catch (err) {
    next(err);
  }
});

// Add assignee
router.post('/:cardId/assignees', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await (await import('../supabase.js')).supabaseAdmin
      .from('card_assignees')
      .insert({ card_id: req.params.cardId, user_id: req.body.user_id })
      .select('*, profiles(*)')
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// Remove assignee
router.delete('/:cardId/assignees/:userId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { error } = await (await import('../supabase.js')).supabaseAdmin
      .from('card_assignees')
      .delete()
      .eq('card_id', req.params.cardId)
      .eq('user_id', req.params.userId);
    if (error) throw error;
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// Delete card
router.delete('/:cardId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await cardService.deleteCard(req.params.cardId);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
