/*
  # Player Messages System

  1. New Tables
    - `player_messages`
      - `id` (uuid, primary key)
      - `title` (text, message title)
      - `content` (text, message content)
      - `action_text` (text, button text)
      - `action_target` (text, section to navigate to)
      - `priority` (integer, display order)
      - `condition_type` (text, when to show message)
      - `condition_value` (jsonb, condition parameters)
      - `is_admin` (boolean, if created by admin)
      - `is_active` (boolean, if message is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `player_message_dismissals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `message_id` (uuid, references player_messages)
      - `dismissed_at` (timestamp)
      - `expires_at` (timestamp, when dismissal expires)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for proper access control
*/

-- Create player_messages table
CREATE TABLE IF NOT EXISTS public.player_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  action_text text NOT NULL DEFAULT 'Go There',
  action_target text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  condition_type text NOT NULL,
  condition_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create player_message_dismissals table
CREATE TABLE IF NOT EXISTS public.player_message_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.player_messages(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE public.player_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_message_dismissals ENABLE ROW LEVEL SECURITY;

-- Create policies for player_messages
CREATE POLICY "Anyone can view active player messages" 
  ON public.player_messages FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Only admins can insert player messages" 
  ON public.player_messages FOR INSERT 
  WITH CHECK (is_admin = true);

CREATE POLICY "Only admins can update player messages" 
  ON public.player_messages FOR UPDATE 
  USING (is_admin = true);

-- Create policies for player_message_dismissals
CREATE POLICY "Users can view their own dismissals" 
  ON public.player_message_dismissals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissals" 
  ON public.player_message_dismissals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to get active messages for a user
CREATE OR REPLACE FUNCTION get_active_player_messages(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  action_text text,
  action_target text,
  priority integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.title,
    pm.content,
    pm.action_text,
    pm.action_target,
    pm.priority
  FROM 
    player_messages pm
  WHERE 
    pm.is_active = true
    -- Exclude messages that have been dismissed and dismissal hasn't expired
    AND NOT EXISTS (
      SELECT 1 
      FROM player_message_dismissals pmd 
      WHERE pmd.message_id = pm.id 
        AND pmd.user_id = p_user_id
        AND (pmd.expires_at IS NULL OR pmd.expires_at > now())
    )
    -- Check conditions
    AND (
      -- No boosts completed today
      (pm.condition_type = 'no_boosts_today' AND NOT EXISTS (
        SELECT 1 
        FROM completed_boosts cb 
        WHERE cb.user_id = p_user_id 
          AND cb.completed_date = CURRENT_DATE
      ))
      -- No active challenges
      OR (pm.condition_type = 'no_active_challenges' AND NOT EXISTS (
        SELECT 1 
        FROM challenges c 
        WHERE c.user_id = p_user_id 
          AND c.status = 'active'
      ))
      -- No active contests
      OR (pm.condition_type = 'no_active_contests' AND NOT EXISTS (
        SELECT 1 
        FROM active_contests ac 
        WHERE ac.user_id = p_user_id 
          AND ac.status = 'active'
      ))
      -- Health assessment ready
      OR (pm.condition_type = 'health_assessment_ready' AND EXISTS (
        SELECT 1 
        FROM health_assessments ha
        WHERE ha.user_id = p_user_id
        ORDER BY ha.created_at DESC
        LIMIT 1
      ) AND (
        SELECT EXTRACT(DAY FROM (now() - ha.created_at)) >= 30
        FROM health_assessments ha
        WHERE ha.user_id = p_user_id
        ORDER BY ha.created_at DESC
        LIMIT 1
      ))
      -- Level up notification
      OR (pm.condition_type = 'level_up' AND (
        SELECT jsonb_path_query_first(pm.condition_value, '$.level') = to_jsonb(u.level)
        FROM users u
        WHERE u.id = p_user_id
      ))
      -- Admin message (always show if active)
      OR (pm.condition_type = 'admin' AND pm.is_admin = true)
      -- Always show
      OR (pm.condition_type = 'always')
    )
  ORDER BY 
    pm.priority DESC;
END;
$$;

-- Insert default messages
INSERT INTO public.player_messages 
  (title, content, action_text, action_target, priority, condition_type, condition_value, is_admin)
VALUES
  ('Complete a Daily Boost', 'Keep your Burn Streak alive by completing at least one Daily Boost today.', 'Go There', 'boosts', 100, 'no_boosts_today', '{}'::jsonb, false),
  ('Start a Challenge', 'Join or continue a Challenge to earn 50+ Fuel Points and improve your health.', 'Go There', 'challenges', 90, 'no_active_challenges', '{}'::jsonb, false),
  ('Join a Contest', 'Compete with other players in Contests to win rewards and Fuel Points.', 'Go There', 'contests', 80, 'no_active_contests', '{}'::jsonb, false),
  ('Update Health Assessment', 'Your monthly Health Assessment is now available. Update to see your progress!', 'Go There', 'health', 70, 'health_assessment_ready', '{}'::jsonb, false);