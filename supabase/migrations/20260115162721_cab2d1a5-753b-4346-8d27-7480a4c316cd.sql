-- Create agent_state table for tracking Octo's HP
CREATE TABLE public.agent_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hp INTEGER NOT NULL DEFAULT 180,
  is_dead BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read
ALTER TABLE public.agent_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent state is publicly readable" 
ON public.agent_state 
FOR SELECT 
USING (true);

-- Enable realtime for agent_state
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_state;

-- Insert initial state
INSERT INTO public.agent_state (hp, is_dead) VALUES (180, false);

-- Create writings table for Octo's writings
CREATE TABLE public.writings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  life_state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read
ALTER TABLE public.writings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Writings are publicly readable" 
ON public.writings 
FOR SELECT 
USING (true);

CREATE POLICY "Edge functions can insert writings" 
ON public.writings 
FOR INSERT 
WITH CHECK (true);

-- Create transaction_history table
CREATE TABLE public.transaction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  amount_sol NUMERIC NOT NULL,
  hp_added INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transactions are publicly readable" 
ON public.transaction_history 
FOR SELECT 
USING (true);