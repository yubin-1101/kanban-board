import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireBoardAccess, BoardRequest } from '../middleware/boardAccess.js';
import { validate } from '../middleware/validate.js';
import { inviteMemberSchema, updateMemberRoleSchema, respondBoardInvitationSchema } from '@kanban/shared';
import * as memberService from '../services/memberService.js';

const router = Router();

// Get received invitations (for current user)
router.get('/invitations/received', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const invitations = await memberService.getReceivedInvitations(req.userId!);
    res.json({ data: invitations });
  } catch (err) {
    next(err);
  }
});

// Get sent invitations for a board
router.get('/invitations/:boardId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const invitations = await memberService.getSentInvitations(req.params.boardId);
    res.json({ data: invitations });
  } catch (err) {
    next(err);
  }
});

// Respond to invitation (accept/reject)
router.patch('/invitations/:invitationId/respond', authMiddleware, validate(respondBoardInvitationSchema), async (req: AuthRequest, res, next) => {
  try {
    const invitation = await memberService.respondToInvitation(
      req.params.invitationId,
      req.userId!,
      req.body.action,
    );
    res.json({ data: invitation });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

// Cancel invitation
router.delete('/invitations/:invitationId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await memberService.cancelInvitation(req.params.invitationId, req.userId!);
    res.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

// Get board members
router.get('/:boardId', authMiddleware, requireBoardAccess(), async (req: BoardRequest, res, next) => {
  try {
    const members = await memberService.getBoardMembers(req.boardId!);
    res.json({ data: members });
  } catch (err) {
    next(err);
  }
});

// Invite member (now creates invitation, not direct member)
router.post('/:boardId', authMiddleware, requireBoardAccess('admin'), validate(inviteMemberSchema), async (req: BoardRequest, res, next) => {
  try {
    const invitation = await memberService.inviteMember(req.boardId!, req.userId!, req.body.email, req.body.role);
    res.status(201).json({ data: invitation });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

// Update member role
router.patch('/role/:memberId', authMiddleware, validate(updateMemberRoleSchema), async (req: BoardRequest, res, next) => {
  try {
    const member = await memberService.updateMemberRole(req.params.memberId, req.body.role);
    res.json({ data: member });
  } catch (err) {
    next(err);
  }
});

// Remove member
router.delete('/:memberId', authMiddleware, async (req: BoardRequest, res, next) => {
  try {
    await memberService.removeMember(req.params.memberId);
    res.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next(err);
  }
});

export default router;
