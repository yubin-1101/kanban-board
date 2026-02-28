export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Board {
  id: string;
  title: string;
  background_color: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export type BoardRole = 'owner' | 'admin' | 'member';

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardRole;
  created_at: string;
  profile?: Profile;
}

export interface List {
  id: string;
  board_id: string;
  title: string;
  position: number;
  x_position: number;
  y_position: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  list_id: string | null;
  board_id: string;
  title: string;
  description: string | null;
  position: number;
  x_position: number | null;
  y_position: number | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  labels?: CardLabel[];
  assignees?: CardAssignee[];
  checklists?: Checklist[];
  comment_count?: number;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CardLabel {
  id: string;
  card_id: string;
  label_id: string;
  label?: Label;
}

export interface CardAssignee {
  id: string;
  card_id: string;
  user_id: string;
  profile?: Profile;
}

export interface Comment {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Checklist {
  id: string;
  card_id: string;
  title: string;
  position: number;
  created_at: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

// Board invitation types
export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface BoardInvitation {
  id: string;
  board_id: string;
  inviter_id: string;
  invitee_id: string;
  role: string;
  status: InvitationStatus;
  created_at: string;
  board?: Board;
  inviter?: Profile;
  invitee?: Profile;
}

// Friend types
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  addressee?: Profile;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Board with related data
export interface BoardWithMembers extends Board {
  board_members: BoardMember[];
}

export interface BoardDetail extends Board {
  lists: ListWithCards[];
  free_cards: Card[];
  board_members: BoardMember[];
  labels: Label[];
}

export interface ListWithCards extends List {
  cards: Card[];
}
