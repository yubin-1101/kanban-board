-- Board drawings: persist canvas strokes per board
CREATE TABLE board_drawings (
  board_id UUID PRIMARY KEY REFERENCES boards(id) ON DELETE CASCADE,
  strokes JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE board_drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can view drawings"
  ON board_drawings FOR SELECT
  USING (is_board_member(board_id));

CREATE POLICY "Board members can insert drawings"
  ON board_drawings FOR INSERT
  WITH CHECK (is_board_member(board_id));

CREATE POLICY "Board members can update drawings"
  ON board_drawings FOR UPDATE
  USING (is_board_member(board_id));
