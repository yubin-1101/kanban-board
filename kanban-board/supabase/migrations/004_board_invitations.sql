-- Board invitations table
CREATE TABLE board_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(board_id, invitee_id)
);

CREATE INDEX idx_board_invitations_invitee ON board_invitations(invitee_id);
CREATE INDEX idx_board_invitations_board ON board_invitations(board_id);

ALTER TABLE board_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invitations" ON board_invitations
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Board admins can create invitations" ON board_invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitee can update invitation" ON board_invitations
  FOR UPDATE USING (auth.uid() = invitee_id);

CREATE POLICY "Related users can delete invitation" ON board_invitations
  FOR DELETE USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
