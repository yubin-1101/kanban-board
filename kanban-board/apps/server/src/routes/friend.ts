import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendFriendRequestSchema, respondFriendRequestSchema } from '@kanban/shared';
import * as friendService from '../services/friendService.js';

const router = Router();

// Get accepted friends
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const friends = await friendService.getFriends(req.userId!);
    res.json({ data: friends });
  } catch (err) {
    next(err);
  }
});

// Get received pending requests
router.get('/requests/received', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const requests = await friendService.getPendingRequests(req.userId!);
    res.json({ data: requests });
  } catch (err) {
    next(err);
  }
});

// Get sent pending requests
router.get('/requests/sent', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const requests = await friendService.getSentRequests(req.userId!);
    res.json({ data: requests });
  } catch (err) {
    next(err);
  }
});

// Send friend request
router.post('/request', authMiddleware, validate(sendFriendRequestSchema), async (req: AuthRequest, res, next) => {
  try {
    const friendship = await friendService.sendFriendRequest(req.userId!, req.body.email);
    res.status(201).json({ data: friendship });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

// Respond to friend request (accept/reject)
router.patch('/:friendshipId/respond', authMiddleware, validate(respondFriendRequestSchema), async (req: AuthRequest, res, next) => {
  try {
    const friendship = await friendService.respondToRequest(
      req.params.friendshipId,
      req.userId!,
      req.body.action,
    );
    res.json({ data: friendship });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

// Remove friend
router.delete('/:friendshipId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await friendService.removeFriend(req.params.friendshipId, req.userId!);
    res.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

export default router;
