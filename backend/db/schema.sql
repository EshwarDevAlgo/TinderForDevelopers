CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  name             TEXT NOT NULL,
  role             TEXT NOT NULL,
  seniority        TEXT NOT NULL DEFAULT 'mid',
  bio              TEXT NOT NULL DEFAULT '',
  tech_stack       TEXT[] NOT NULL DEFAULT '{}',
  interests        TEXT[] NOT NULL DEFAULT '{}',
  looking_for      TEXT NOT NULL DEFAULT 'mixed',
  location         TEXT NOT NULL DEFAULT '',
  years_experience INT NOT NULL DEFAULT 0,
  github_url       TEXT NOT NULL DEFAULT '',
  avatar_url       TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_tech_stack ON users USING GIN (tech_stack);

CREATE TABLE IF NOT EXISTS swipes (
  swiper_id  INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  target_id  INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  liked      BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (swiper_id, target_id),
  CHECK (swiper_id <> target_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_target ON swipes (target_id) WHERE liked;

CREATE TABLE IF NOT EXISTS matches (
  id         SERIAL PRIMARY KEY,
  user_a     INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_b     INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches (user_b);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  match_id   INT NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  sender_id  INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_match_created ON messages (match_id, created_at);
