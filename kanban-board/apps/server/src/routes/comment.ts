import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCommentSchema } from '@kanban/shared';
import * as commentService from '../services/commentService.js';

const router = Router();

// Get comments for a card
router.get('/:cardId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const comments = await commentService.getComments(req.params.cardId);
    res.json({ data: comments });
  } catch (err) {
    next(err);
  }
});

// Create comment
router.post('/:cardId', authMiddleware, validate(createCommentSchema), async (req: AuthRequest, res, next) => {
  try {
    const comment = await commentService.createComment(req.params.cardId, req.userId!, req.body.content);
    res.status(201).json({ data: comment });
  } catch (err) {
    next(err);
  }
});

// Delete comment
router.delete('/:commentId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await commentService.deleteComment(req.params.commentId, req.userId!);
    res.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

export default router;
