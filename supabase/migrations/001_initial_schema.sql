-- Mafia Party Supabase Schema

-- Lobbies table
CREATE TABLE lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  max_players INTEGER DEFAULT 8,
  status TEXT DEFAULT 'waiting', -- waiting, active, completed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id),
  user_id TEXT, -- null for bots
  name TEXT NOT NULL,
  role TEXT, -- Godfather, Mafia, etc.
  is_alive BOOLEAN DEFAULT TRUE,
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id),
  player_id UUID REFERENCES players(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game actions (for on-chain proofs simulation)
CREATE TABLE game_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id),
  player_id UUID REFERENCES players(id),
  action_type TEXT NOT NULL, -- vote, night_action, etc.
  target_player_id UUID REFERENCES players(id),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);