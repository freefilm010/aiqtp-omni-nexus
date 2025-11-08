-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create portfolio table
CREATE TABLE public.portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  quantity NUMERIC(20, 8) NOT NULL CHECK (quantity >= 0),
  average_price NUMERIC(20, 8) NOT NULL CHECK (average_price >= 0),
  current_price NUMERIC(20, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_symbol)
);

-- Enable RLS on portfolio
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Portfolio policies
CREATE POLICY "Users can view their own portfolio"
  ON public.portfolio FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio items"
  ON public.portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio items"
  ON public.portfolio FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio items"
  ON public.portfolio FOR DELETE
  USING (auth.uid() = user_id);

-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
  price NUMERIC(20, 8) NOT NULL CHECK (price > 0),
  total NUMERIC(20, 8) NOT NULL CHECK (total > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Trades policies
CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create watchlist table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable RLS on watchlist
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Watchlist policies
CREATE POLICY "Users can view their own watchlist"
  ON public.watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items"
  ON public.watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items"
  ON public.watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Create lightning_channels table
CREATE TABLE public.lightning_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL UNIQUE,
  capacity NUMERIC(20, 8) NOT NULL CHECK (capacity > 0),
  local_balance NUMERIC(20, 8) NOT NULL CHECK (local_balance >= 0),
  remote_balance NUMERIC(20, 8) NOT NULL CHECK (remote_balance >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on lightning_channels
ALTER TABLE public.lightning_channels ENABLE ROW LEVEL SECURITY;

-- Lightning channels policies
CREATE POLICY "Users can view their own channels"
  ON public.lightning_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channels"
  ON public.lightning_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
  ON public.lightning_channels FOR UPDATE
  USING (auth.uid() = user_id);

-- Create lightning_transactions table
CREATE TABLE public.lightning_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'swap')),
  amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  destination TEXT,
  payment_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on lightning_transactions
ALTER TABLE public.lightning_transactions ENABLE ROW LEVEL SECURITY;

-- Lightning transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.lightning_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.lightning_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON public.portfolio
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_lightning_channels_updated_at
  BEFORE UPDATE ON public.lightning_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();