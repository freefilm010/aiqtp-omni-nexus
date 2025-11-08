-- Add missing DELETE and UPDATE RLS policies for complete data management

-- Lightning Channels: Add DELETE policy
CREATE POLICY "Users can delete their own channels"
  ON lightning_channels
  FOR DELETE
  USING (auth.uid() = user_id);

-- Lightning Transactions: Add UPDATE and DELETE policies
CREATE POLICY "Users can update their own transactions"
  ON lightning_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON lightning_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trades: Add UPDATE and DELETE policies
CREATE POLICY "Users can update their own trades"
  ON trades
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
  ON trades
  FOR DELETE
  USING (auth.uid() = user_id);

-- Watchlist: Add UPDATE policy
CREATE POLICY "Users can update their own watchlist items"
  ON watchlist
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Profiles: Add DELETE policy for account deletion
CREATE POLICY "Users can delete their own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);