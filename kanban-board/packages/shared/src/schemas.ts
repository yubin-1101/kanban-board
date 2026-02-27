import { z } from 'zod';

// Board schemas
export const createBoardSchema = z.object({
  title: z.string().min(1, '보드 제목을 입력해주세요').max(100),
  background_color: z.string().default('#0079bf'),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  background_color: z.string().optional(),
});

// List schemas
export const createListSchema = z.object({
  title: z.string().min(1, '리스트 제목을 입력해주세요').max(100),
  board_id: z.string().uuid(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().optional(),
});

// Card schemas
export const createCardSchema = z.object({
  title: z.string().min(1, '카드 제목을 입력해주세요').max(500),
  list_id: z.string().uuid(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  position: z.number().optional(),
  list_id: z.string().uuid().optional(),
  due_date: z.string().nullable().optional(),
});

// Move schemas (for DnD)
export const moveCardSchema = z.object({
  card_id: z.string().uuid(),
  target_list_id: z.string().uuid(),
  position: z.number(),
});

export const moveListSchema = z.object({
  list_id: z.string().uuid(),
  position: z.number(),
});

// Member schemas
export const inviteMemberSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  role: z.enum(['admin', 'member']).default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, '댓글을 입력해주세요').max(5000),
});

// Label schemas
export const createLabelSchema = z.object({
  name: z.string().max(50).default(''),
  color: z.string(),
  board_id: z.string().uuid(),
});

// Checklist schemas
export const createChecklistSchema = z.object({
  title: z.string().min(1, '체크리스트 제목을 입력해주세요').max(200),
});

export const createChecklistItemSchema = z.object({
  title: z.string().min(1).max(500),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  is_completed: z.boolean().optional(),
});

// Friend schemas
export const sendFriendRequestSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
});

export const respondFriendRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

// Board invitation schemas
export const respondBoardInvitationSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

// Type exports from schemas
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type MoveListInput = z.infer<typeof moveListSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
export type RespondBoardInvitationInput = z.infer<typeof respondBoardInvitationSchema>;
