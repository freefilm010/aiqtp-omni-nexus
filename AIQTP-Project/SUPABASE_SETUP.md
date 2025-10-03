# Supabase Setup Guide for AIQTP

## Connecting Supabase

### Step 1: Enable Lovable Cloud
1. Open project on **desktop browser**
2. Click green **"Supabase"** button in top-right corner
3. Click **"Enable Lovable Cloud"**
4. Wait for automatic backend provisioning

### Step 2: Database Schema

Once connected, create these tables:

#### Users Table (extends Supabase auth.users)
```sql
-- Profiles table for extended user data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Trading Data Tables

```sql
-- Portfolio holdings
CREATE TABLE portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  symbol TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  avg_price DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio"
  ON portfolio FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio"
  ON portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
  ON portfolio FOR UPDATE
  USING (auth.uid() = user_id);

-- Trade history
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL, -- 'buy' or 'sell'
  amount DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  total DECIMAL NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Watchlist
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  symbol TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id);
```

#### Lightning Vault Tables

```sql
-- Lightning channels
CREATE TABLE lightning_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  channel_id TEXT UNIQUE NOT NULL,
  capacity BIGINT NOT NULL,
  local_balance BIGINT NOT NULL,
  remote_balance BIGINT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE lightning_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels"
  ON lightning_channels FOR SELECT
  USING (auth.uid() = user_id);

-- Lightning transactions
CREATE TABLE lightning_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL, -- 'send', 'receive', 'swap'
  amount BIGINT NOT NULL,
  fee BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE lightning_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON lightning_transactions FOR SELECT
  USING (auth.uid() = user_id);
```

### Step 3: Authentication Setup

Enable these auth providers in Supabase dashboard:
- ✅ Email/Password
- ✅ Google OAuth (optional)
- ✅ GitHub OAuth (optional)

### Step 4: Storage Buckets

Create storage buckets:
```sql
-- User avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Profile verification documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);
```

Storage policies:
```sql
-- Avatar upload policy
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatar view policy
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

### Step 5: Edge Functions

Create these edge functions for backend logic:

1. **market-data** - Fetch real-time market prices
2. **execute-trade** - Process trading orders
3. **lightning-payment** - Handle Lightning transactions
4. **ai-signals** - Generate AI trading signals
5. **portfolio-analytics** - Calculate portfolio metrics

### Step 6: Secrets Management

Add these secrets in Lovable Cloud:
- API keys for market data providers
- Lightning Network credentials
- AI/ML service API keys
- Payment processor keys (if needed)

### Step 7: Real-time Subscriptions

Enable real-time for live data:
```typescript
// Subscribe to portfolio updates
supabase
  .channel('portfolio-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'portfolio' },
    (payload) => console.log(payload)
  )
  .subscribe()
```

## Testing Checklist

After setup, test:
- [ ] User registration/login
- [ ] Profile creation/update
- [ ] Portfolio data CRUD
- [ ] Trade execution
- [ ] Lightning transactions
- [ ] Real-time updates
- [ ] File uploads
- [ ] Edge function calls

## Resources

- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)
- [Supabase Documentation](https://supabase.com/docs)
- Project in Lovable: Use Manage Cloud button
