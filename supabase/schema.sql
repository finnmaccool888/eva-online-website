-- Eva Soul Generator Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (linked to mock Twitter auth for now)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twitter_id TEXT UNIQUE,
  twitter_handle TEXT UNIQUE NOT NULL,
  twitter_name TEXT,
  twitter_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  personal_info JSONB DEFAULT '{}',
  social_profiles JSONB DEFAULT '[]',
  points INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Soul seeds table
CREATE TABLE soul_seeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  vibe TEXT CHECK (vibe IN ('ethereal', 'zen', 'cyber')) NOT NULL,
  level INTEGER DEFAULT 1,
  streak_count INTEGER DEFAULT 0,
  last_fed_at TIMESTAMP WITH TIME ZONE,
  offensive_count INTEGER DEFAULT 0,
  trust_penalty INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Memories/responses table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_seed_id UUID REFERENCES soul_seeds(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_category TEXT NOT NULL,
  user_response TEXT NOT NULL,
  analysis JSONB, -- Stores OpenAI analysis results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Earned traits table
CREATE TABLE earned_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_seed_id UUID REFERENCES soul_seeds(id) ON DELETE CASCADE,
  trait_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  trigger_answer TEXT,
  question_id TEXT,
  strength INTEGER DEFAULT 50,
  UNIQUE(soul_seed_id, trait_id)
);

-- Artifacts table
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soul_seed_id UUID REFERENCES soul_seeds(id) ON DELETE CASCADE,
  artifact_id TEXT NOT NULL,
  rarity TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Session analytics table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_users_twitter_handle ON users(twitter_handle);
CREATE INDEX idx_soul_seeds_user_id ON soul_seeds(user_id);
CREATE INDEX idx_memories_soul_seed_id ON memories(soul_seed_id);
CREATE INDEX idx_earned_traits_soul_seed_id ON earned_traits(soul_seed_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll tighten this when we add real auth)
CREATE POLICY "Public users table" ON users FOR ALL USING (true);
CREATE POLICY "Public user_profiles table" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Public soul_seeds table" ON soul_seeds FOR ALL USING (true);
CREATE POLICY "Public memories table" ON memories FOR ALL USING (true);
CREATE POLICY "Public earned_traits table" ON earned_traits FOR ALL USING (true);
CREATE POLICY "Public artifacts table" ON artifacts FOR ALL USING (true);
CREATE POLICY "Public analytics_events table" ON analytics_events FOR ALL USING (true);

-- Helper function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soul_seeds_updated_at BEFORE UPDATE ON soul_seeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 