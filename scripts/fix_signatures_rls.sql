-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage signatures" ON signatures;

-- Create new RLS policy that checks admin status properly
CREATE POLICY "Admins can manage signatures"
  ON signatures FOR ALL
  USING (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- Allow inserting for authenticated admin users
CREATE POLICY "Admins can insert signatures"
  ON signatures FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- Allow updating own signatures for authenticated admin users
CREATE POLICY "Admins can update signatures"
  ON signatures FOR UPDATE
  USING (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- Allow deleting own signatures for authenticated admin users
CREATE POLICY "Admins can delete signatures"
  ON signatures FOR DELETE
  USING (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );
