-- Migration: Phase 4 - Strict Row Level Security Policies
-- Description: Locks down the core hydrology tables using strict user_id matching and permits Edge Functions to bypass via service_role.

-- 1. Enable RLS on core tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydro_calculations ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- Policy Group: users can only manage rows matching their auth.uid()
-- -------------------------------------------------------------

-- SELECT Policies
CREATE POLICY "Users can view own projects" 
ON public.projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stations" 
ON public.stations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own hydro_calculations" 
ON public.hydro_calculations FOR SELECT USING (auth.uid() = user_id);

-- INSERT Policies
CREATE POLICY "Users can insert own projects" 
ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own stations" 
ON public.stations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own hydro_calculations" 
ON public.hydro_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE Policies
CREATE POLICY "Users can update own projects" 
ON public.projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stations" 
ON public.stations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hydro_calculations" 
ON public.hydro_calculations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE Policies
CREATE POLICY "Users can delete own projects" 
ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stations" 
ON public.stations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hydro_calculations" 
ON public.hydro_calculations FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- Policy Group: Service Role Bypass for Edge Functions
-- -------------------------------------------------------------
-- The service_role key used securely in the backend (e.g., inside Deno Edge Functions) 
-- will bypass RLS automatically for backend orchestration. However, we can explicitly define it
-- just to be thorough and explicit for certain tables if using anon keys with JWT manipulation.
-- Usually, service_role bypasses RLS by default in Supabase PostgreSQL, but for explicit clarity:

CREATE POLICY "Service Role Full Access projects" 
ON public.projects FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service Role Full Access stations" 
ON public.stations FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service Role Full Access hydro_calculations" 
ON public.hydro_calculations FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
