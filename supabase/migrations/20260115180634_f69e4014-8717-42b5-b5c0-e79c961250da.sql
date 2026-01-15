-- Allow updates to agent_state (for admin panel HP changes)
CREATE POLICY "Agent state can be updated"
ON public.agent_state
FOR UPDATE
USING (true)
WITH CHECK (true);