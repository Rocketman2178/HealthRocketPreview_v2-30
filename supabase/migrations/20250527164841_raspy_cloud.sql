/*
  # Fix Player Messages Migration

  1. Tables
    - `player_messages` - Stores notification messages for users
    - `player_message_dismissals` - Tracks which messages users have dismissed
  
  2. Function
    - `get_active_player_messages` - Returns active messages for a user based on conditions
    
  3. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing messages
*/

-- Create player_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  action_text TEXT NOT NULL DEFAULT 'Go There',
  action_target TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT NOT NULL,
  condition_value JSONB NOT NULL DEFAULT '{}',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create player_message_dismissals table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_message_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES player_messages(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Add unique constraint to prevent duplicate dismissals (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'player_message_dismissals_user_id_message_id_key'
  ) THEN
    ALTER TABLE player_message_dismissals 
      ADD CONSTRAINT player_message_dismissals_user_id_message_id_key 
      UNIQUE (user_id, message_id);
  END IF;
END $$;

-- Enable RLS on player_messages
ALTER TABLE player_messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on player_message_dismissals
ALTER TABLE player_message_dismissals ENABLE ROW LEVEL SECURITY;

-- Create policies for player_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Anyone can view active player messages'
    AND polrelid = 'player_messages'::regclass
  ) THEN
    CREATE POLICY "Anyone can view active player messages"
      ON player_messages FOR SELECT
      USING (is_active = true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Only admins can insert player messages'
    AND polrelid = 'player_messages'::regclass
  ) THEN
    CREATE POLICY "Only admins can insert player messages"
      ON player_messages FOR INSERT
      WITH CHECK (is_admin = true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Only admins can update player messages'
    AND polrelid = 'player_messages'::regclass
  ) THEN
    CREATE POLICY "Only admins can update player messages"
      ON player_messages FOR UPDATE
      USING (is_admin = true);
  END IF;
END $$;

-- Create policies for player_message_dismissals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert their own dismissals'
    AND polrelid = 'player_message_dismissals'::regclass
  ) THEN
    CREATE POLICY "Users can insert their own dismissals"
      ON player_message_dismissals FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can view their own dismissals'
    AND polrelid = 'player_message_dismissals'::regclass
  ) THEN
    CREATE POLICY "Users can view their own dismissals"
      ON player_message_dismissals FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_active_player_messages(UUID);

-- Create function to get active messages for a user
CREATE OR REPLACE FUNCTION get_active_player_messages(p_user_id UUID)
RETURNS SETOF player_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_has_boosts_today BOOLEAN;
  v_has_active_challenges BOOLEAN;
  v_has_active_contests BOOLEAN;
  v_has_active_quests BOOLEAN;
  v_can_update_health BOOLEAN;
  v_level INTEGER;
  v_days_since_fp INTEGER;
BEGIN
  -- Get user data
  SELECT * INTO v_user_record FROM users WHERE id = p_user_id;
  
  -- Check if user has completed boosts today
  SELECT EXISTS (
    SELECT 1 FROM completed_boosts 
    WHERE user_id = p_user_id AND completed_date = CURRENT_DATE
  ) INTO v_has_boosts_today;
  
  -- Check if user has active challenges
  SELECT EXISTS (
    SELECT 1 FROM challenges 
    WHERE user_id = p_user_id AND status = 'active' AND category != 'Contests'
  ) INTO v_has_active_challenges;
  
  -- Check if user has active contests
  SELECT EXISTS (
    SELECT 1 FROM challenges 
    WHERE user_id = p_user_id AND status = 'active' AND category = 'Contests'
  ) INTO v_has_active_contests;
  
  -- Check if user has active quests
  SELECT EXISTS (
    SELECT 1 FROM quests 
    WHERE user_id = p_user_id AND status = 'active'
  ) INTO v_has_active_quests;
  
  -- Check if user can update health assessment
  SELECT (
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM health_assessments 
        WHERE user_id = p_user_id
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM health_assessments 
        WHERE user_id = p_user_id 
        AND created_at < (now() - interval '30 days')
      ) THEN true
      ELSE false
    END
  ) INTO v_can_update_health;
  
  -- Get user level and days since FP
  v_level := v_user_record.level;
  v_days_since_fp := v_user_record.days_since_fp;
  
  -- Return active messages based on conditions
  RETURN QUERY
  SELECT m.*
  FROM player_messages m
  WHERE m.is_active = true
  AND NOT EXISTS (
    -- Exclude dismissed messages that haven't expired
    SELECT 1 FROM player_message_dismissals d
    WHERE d.message_id = m.id
    AND d.user_id = p_user_id
    AND (d.expires_at IS NULL OR d.expires_at > now())
  )
  AND (
    -- Admin messages always show
    (m.is_admin = true)
    
    -- No boosts today message
    OR (m.condition_type = 'no_boosts_today' AND NOT v_has_boosts_today)
    
    -- No active challenges message
    OR (m.condition_type = 'no_active_challenges' AND NOT v_has_active_challenges)
    
    -- No active contests message
    OR (m.condition_type = 'no_active_contests' AND NOT v_has_active_contests)
    
    -- Health assessment ready message
    OR (m.condition_type = 'health_assessment_ready' AND v_can_update_health)
    
    -- Level up message
    OR (m.condition_type = 'level_up' AND 
        (m.condition_value->>'level')::integer = v_level)
    
    -- Days since FP message
    OR (m.condition_type = 'days_since_fp' AND 
        v_days_since_fp >= (m.condition_value->>'days')::integer)
    
    -- Always show message
    OR (m.condition_type = 'always')
  )
  ORDER BY m.priority DESC, m.created_at DESC;
END;
$$;

-- Insert default messages if they don't exist
DO $$
BEGIN
  -- Only insert if the table is empty
  IF NOT EXISTS (SELECT 1 FROM player_messages LIMIT 1) THEN
    INSERT INTO player_messages (title, content, action_text, action_target, priority, condition_type, condition_value, is_admin, is_active)
    VALUES
      ('Complete a Daily Boost', 'Keep your Burn Streak alive by completing at least one Daily Boost today.', 'Go There', 'boosts', 100, 'no_boosts_today', '{}', false, true),
      ('Launch a Challenge', 'Start a 21-day Challenge to earn 50+ Fuel Points and improve your health.', 'Go There', 'challenges', 90, 'no_active_challenges', '{}', false, true),
      ('Join a Contest', 'Compete against other players in skill-based Contests to win rewards.', 'Go There', 'contests', 80, 'no_active_contests', '{}', false, true),
      ('Health Assessment Ready', 'Your monthly Health Assessment is now available. Update your metrics to track your progress.', 'Update Now', 'rocket', 70, 'health_assessment_ready', '{}', false, true),
      ('Welcome to Level 2!', 'Congratulations on reaching Level 2! Check out your rank on the Leaderboard.', 'View Leaderboard', 'leaderboard', 110, 'level_up', '{"level": 2}', false, true),
      ('Welcome to Level 3!', 'Congratulations on reaching Level 3! Check out your rank on the Leaderboard.', 'View Leaderboard', 'leaderboard', 110, 'level_up', '{"level": 3}', false, true),
      ('Welcome to Level 4!', 'Congratulations on reaching Level 4! Check out your rank on the Leaderboard.', 'View Leaderboard', 'leaderboard', 110, 'level_up', '{"level": 4}', false, true),
      ('Welcome to Level 5!', 'Congratulations on reaching Level 5! Check out your rank on the Leaderboard.', 'View Leaderboard', 'leaderboard', 110, 'level_up', '{"level": 5}', false, true),
      ('Fuel Points Needed!', 'It has been 3+ days since you earned Fuel Points. Complete a Daily Boost to maintain your progress!', 'Go to Boosts', 'boosts', 120, 'days_since_fp', '{"days": 3}', false, true);
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_active_player_messages TO public;