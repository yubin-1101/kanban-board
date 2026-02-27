-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Helper function: check board membership
CREATE OR REPLACE FUNCTION is_board_member(board_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_members.board_id = $1
    AND board_members.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: users can read any profile, update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Boards: viewable/editable by members
CREATE POLICY "Boards viewable by members" ON boards
  FOR SELECT USING (is_board_member(id));

CREATE POLICY "Boards insertable by authenticated users" ON boards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Boards updatable by members" ON boards
  FOR UPDATE USING (is_board_member(id));

CREATE POLICY "Boards deletable by owner" ON boards
  FOR DELETE USING (auth.uid() = owner_id);

-- Board members
CREATE POLICY "Board members viewable by board members" ON board_members
  FOR SELECT USING (is_board_member(board_id));

CREATE POLICY "Board members insertable by admins" ON board_members
  FOR INSERT WITH CHECK (
    is_board_member(board_id)
    OR auth.uid() = user_id  -- allow self-insert on board creation
  );

CREATE POLICY "Board members deletable by admins" ON board_members
  FOR DELETE USING (is_board_member(board_id));

CREATE POLICY "Board members updatable by admins" ON board_members
  FOR UPDATE USING (is_board_member(board_id));

-- Lists
CREATE POLICY "Lists viewable by board members" ON lists
  FOR SELECT USING (is_board_member(board_id));

CREATE POLICY "Lists insertable by board members" ON lists
  FOR INSERT WITH CHECK (is_board_member(board_id));

CREATE POLICY "Lists updatable by board members" ON lists
  FOR UPDATE USING (is_board_member(board_id));

CREATE POLICY "Lists deletable by board members" ON lists
  FOR DELETE USING (is_board_member(board_id));

-- Cards (need to join through lists to get board_id)
CREATE OR REPLACE FUNCTION get_board_id_from_list(list_id UUID)
RETURNS UUID AS $$
  SELECT board_id FROM lists WHERE id = $1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Cards viewable by board members" ON cards
  FOR SELECT USING (is_board_member(get_board_id_from_list(list_id)));

CREATE POLICY "Cards insertable by board members" ON cards
  FOR INSERT WITH CHECK (is_board_member(get_board_id_from_list(list_id)));

CREATE POLICY "Cards updatable by board members" ON cards
  FOR UPDATE USING (is_board_member(get_board_id_from_list(list_id)));

CREATE POLICY "Cards deletable by board members" ON cards
  FOR DELETE USING (is_board_member(get_board_id_from_list(list_id)));

-- Labels
CREATE POLICY "Labels viewable by board members" ON labels
  FOR SELECT USING (is_board_member(board_id));

CREATE POLICY "Labels manageable by board members" ON labels
  FOR ALL USING (is_board_member(board_id));

-- Card labels
CREATE OR REPLACE FUNCTION get_board_id_from_card(card_id UUID)
RETURNS UUID AS $$
  SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Card labels viewable by board members" ON card_labels
  FOR SELECT USING (is_board_member(get_board_id_from_card(card_id)));

CREATE POLICY "Card labels manageable by board members" ON card_labels
  FOR ALL USING (is_board_member(get_board_id_from_card(card_id)));

-- Card assignees
CREATE POLICY "Card assignees viewable by board members" ON card_assignees
  FOR SELECT USING (is_board_member(get_board_id_from_card(card_id)));

CREATE POLICY "Card assignees manageable by board members" ON card_assignees
  FOR ALL USING (is_board_member(get_board_id_from_card(card_id)));

-- Comments
CREATE POLICY "Comments viewable by board members" ON comments
  FOR SELECT USING (is_board_member(get_board_id_from_card(card_id)));

CREATE POLICY "Comments insertable by board members" ON comments
  FOR INSERT WITH CHECK (is_board_member(get_board_id_from_card(card_id)));

CREATE POLICY "Comments updatable by author" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Comments deletable by author" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Checklists
CREATE POLICY "Checklists viewable by board members" ON checklists
  FOR SELECT USING (is_board_member(get_board_id_from_card(card_id)));

CREATE POLICY "Checklists manageable by board members" ON checklists
  FOR ALL USING (is_board_member(get_board_id_from_card(card_id)));

-- Checklist items
CREATE OR REPLACE FUNCTION get_card_id_from_checklist(checklist_id UUID)
RETURNS UUID AS $$
  SELECT card_id FROM checklists WHERE id = $1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Checklist items viewable by board members" ON checklist_items
  FOR SELECT USING (is_board_member(get_board_id_from_card(get_card_id_from_checklist(checklist_id))));

CREATE POLICY "Checklist items manageable by board members" ON checklist_items
  FOR ALL USING (is_board_member(get_board_id_from_card(get_card_id_from_checklist(checklist_id))));

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE lists;
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE card_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE card_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
