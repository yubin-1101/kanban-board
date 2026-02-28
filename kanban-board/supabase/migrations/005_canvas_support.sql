-- Canvas support: free-floating cards and x/y positioning

-- cards에 board_id 직접 참조 추가 (free-floating 카드용)
ALTER TABLE cards ADD COLUMN board_id UUID REFERENCES boards(id) ON DELETE CASCADE;
UPDATE cards SET board_id = lists.board_id FROM lists WHERE cards.list_id = lists.id;
ALTER TABLE cards ALTER COLUMN board_id SET NOT NULL;

-- cards의 list_id를 nullable로 변경 (free-floating 카드는 list 없이 존재)
ALTER TABLE cards ALTER COLUMN list_id DROP NOT NULL;

-- cards에 x/y 좌표 추가
ALTER TABLE cards ADD COLUMN x_position FLOAT;
ALTER TABLE cards ADD COLUMN y_position FLOAT;

-- lists에 x/y 좌표 추가
ALTER TABLE lists ADD COLUMN x_position FLOAT DEFAULT 100;
ALTER TABLE lists ADD COLUMN y_position FLOAT DEFAULT 100;

-- 기존 리스트 위치 보정 (가로로 320px 간격 배치)
UPDATE lists SET x_position = sub.x_pos, y_position = 100
FROM (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY board_id ORDER BY position) - 1) * 320 AS x_pos
  FROM lists
) AS sub
WHERE lists.id = sub.id;

-- board_id 인덱스 추가
CREATE INDEX idx_cards_board_id ON cards(board_id);

-- free-floating cards 조회용 인덱스
CREATE INDEX idx_cards_free_floating ON cards(board_id) WHERE list_id IS NULL;
