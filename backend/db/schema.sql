CREATE TABLE players (
  client_id TEXT PRIMARY KEY NOT NULL,
  room_id TEXT NOT NULL,
  name TEXT,
  score INTEGER,
  team TEXT,
  notes JSON,
  end_time DATETIME,
  created DATE DEFAULT (datetime('now','localtime')),
  last_active DATETIME,
  deleted_at DATETIME
);

CREATE TABLE rooms (
  room_id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  game_state TEXT,
  salad_bowl JSON,
  active_round INTEGER DEFAULT 1,
  active_player TEXT,
  active_team TEXT,
  active_word TEXT,
  end_time TEXT,
  players_played JSON,
  skips INTEGER DEFAULT 1
);
