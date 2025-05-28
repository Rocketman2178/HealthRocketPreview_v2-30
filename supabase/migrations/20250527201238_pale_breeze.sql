/*
  # Update Boost Code Redemption Function

  1. Changes
    - Modify redeem_boost_code function to handle case-insensitive boost codes
    - Remove length restriction on boost codes
    - Improve error handling and validation
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS redeem_boost_code(uuid, text);

-- Create the updated function
CREATE OR REPLACE FUNCTION redeem_boost_code(
  p_user_id uuid,
  p_boost_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boost_code_id uuid;
  v_fp_amount integer;
  v_promotion text;
  v_is_active boolean;
  v_redemption_id uuid;
  v_result jsonb;
BEGIN
  -- Validate input
  IF p_boost_code IS NULL OR trim(p_boost_code) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Boost code is required'
    );
  END IF;

  -- Find the boost code (case insensitive)
  SELECT id, fp_amount, promotion, is_active
  INTO v_boost_code_id, v_fp_amount, v_promotion, v_is_active
  FROM boost_codes
  WHERE UPPER(boost_code) = UPPER(p_boost_code);
  
  -- Check if boost code exists
  IF v_boost_code_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid boost code'
    );
  END IF;
  
  -- Check if boost code is active
  IF NOT v_is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This boost code is no longer active'
    );
  END IF;
  
  -- Check if user has already redeemed this code
  IF EXISTS (
    SELECT 1 FROM boost_code_redemptions
    WHERE user_id = p_user_id AND boost_code_id = v_boost_code_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already redeemed this boost code'
    );
  END IF;
  
  -- Record the redemption
  INSERT INTO boost_code_redemptions (
    user_id,
    boost_code_id,
    fp_earned
  ) VALUES (
    p_user_id,
    v_boost_code_id,
    v_fp_amount
  )
  RETURNING id INTO v_redemption_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'fp_earned', v_fp_amount,
    'promotion', v_promotion
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION redeem_boost_code(uuid, text) TO public;