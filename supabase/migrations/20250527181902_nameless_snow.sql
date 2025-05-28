/*
  # Fix plan status tracking for users
  
  1. New Columns
    - Add plan_status column to users table if it doesn't exist
  
  2. Data Updates
    - Update existing Pro Plan users to have Trial status if no status set
    - Update users with subscription_end_date to have Active status
  
  3. Functions
    - Create/replace function to update plan status based on subscription dates
  
  4. Triggers
    - Create update trigger for plan status (with IF NOT EXISTS)
    - Drop and recreate insert trigger to avoid conflicts
*/

-- Add plan_status column if it doesn't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'Trial';

-- Update existing users with Pro Plan to have Trial status if they don't have a status yet
UPDATE public.users
SET plan_status = 'Trial'
WHERE plan = 'Pro Plan' 
  AND (plan_status IS NULL OR plan_status = '');

-- Update existing users with subscription_end_date to have Active status
UPDATE public.users
SET plan_status = 'Active'
WHERE plan = 'Pro Plan'
  AND subscription_end_date IS NOT NULL
  AND subscription_end_date > NOW();

-- Create function to update plan status based on subscription dates
CREATE OR REPLACE FUNCTION update_plan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If plan is changing or subscription dates are changing
  IF (TG_OP = 'INSERT') OR 
     (OLD.plan IS DISTINCT FROM NEW.plan) OR
     (OLD.subscription_start_date IS DISTINCT FROM NEW.subscription_start_date) OR
     (OLD.subscription_end_date IS DISTINCT FROM NEW.subscription_end_date) THEN
    
    -- Default to Trial for Pro Plan with no end date
    IF NEW.plan = 'Pro Plan' THEN
      IF NEW.subscription_end_date IS NULL THEN
        NEW.plan_status := 'Trial';
      ELSE
        -- If end date is in the future, it's Active
        IF NEW.subscription_end_date > NOW() THEN
          NEW.plan_status := 'Active';
        ELSE
          -- If end date is in the past, revert to Free Plan
          NEW.plan := 'Free Plan';
          NEW.plan_status := NULL;
        END IF;
      END IF;
    ELSE
      -- For Free Plan, clear status
      NEW.plan_status := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- First drop the existing trigger if it exists
DROP TRIGGER IF EXISTS set_plan_status_trigger ON public.users;

-- Create trigger for new users with IF NOT EXISTS
CREATE TRIGGER set_plan_status_trigger
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_plan_status();

-- Create or replace trigger for updating users
DROP TRIGGER IF EXISTS update_plan_status_trigger ON public.users;
CREATE TRIGGER update_plan_status_trigger
BEFORE UPDATE OF plan, subscription_end_date ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_plan_status();