-- Octo Claude HP System Database Schema
-- CANONICAL IMPLEMENTATION

-- Agent State Table (singleton - only one row)
CREATE TABLE IF NOT EXISTS agent_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row
  hp INTEGER NOT NULL DEFAULT 10,
  is_dead BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial state
INSERT INTO agent_state (hp, is_dead, updated_at)
VALUES (10, FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Transaction History Table
CREATE TABLE IF NOT EXISTS transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL UNIQUE,
  amount_sol DECIMAL(18, 9) NOT NULL,
  hp_added INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Writings Table
CREATE TABLE IF NOT EXISTS writings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  life_state TEXT NOT NULL CHECK (life_state IN ('alive', 'starving', 'dying', 'dead')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_writings_created_at ON writings(created_at DESC);

-- Function to update agent_state.updated_at automatically
CREATE OR REPLACE FUNCTION update_agent_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS agent_state_timestamp_trigger ON agent_state;
CREATE TRIGGER agent_state_timestamp_trigger
BEFORE UPDATE ON agent_state
FOR EACH ROW
EXECUTE FUNCTION update_agent_state_timestamp();

-- Enable Row Level Security
ALTER TABLE agent_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE writings ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Allow public read agent_state" ON agent_state FOR SELECT USING (true);
CREATE POLICY "Allow public read transaction_history" ON transaction_history FOR SELECT USING (true);
CREATE POLICY "Allow public read writings" ON writings FOR SELECT USING (true);

-- Policies for service role write access
CREATE POLICY "Allow service write agent_state" ON agent_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service write transaction_history" ON transaction_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service write writings" ON writings FOR ALL USING (true) WITH CHECK (true);
