-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_id on public.subscriptions(stripe_subscription_id);
create index if not exists idx_subscriptions_env on public.subscriptions(environment);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

create policy "Admins can view all subscriptions"
  on public.subscriptions for select
  using (public.has_role(auth.uid(), 'admin'));

-- Deposit transactions table (one-time deposits credited to platform_wallets)
create table if not exists public.deposit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_usd numeric(20,2) not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  environment text not null default 'sandbox',
  credited_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_deposits_user_id on public.deposit_transactions(user_id);
create index if not exists idx_deposits_session_id on public.deposit_transactions(stripe_session_id);

alter table public.deposit_transactions enable row level security;

create policy "Users can view own deposits"
  on public.deposit_transactions for select
  using (auth.uid() = user_id);

create policy "Service role can manage deposits"
  on public.deposit_transactions for all
  using (auth.role() = 'service_role');

create policy "Admins can view all deposits"
  on public.deposit_transactions for select
  using (public.has_role(auth.uid(), 'admin'));

-- Helper function to check active platform access
create or replace function public.has_active_subscription(
  user_uuid uuid,
  check_env text default 'live'
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
    and environment = check_env
    and (
      (status in ('active', 'trialing') and (current_period_end is null or current_period_end > now()))
      or (status = 'past_due' and (current_period_end is null or current_period_end > now()))
      or (status = 'canceled' and current_period_end > now())
    )
  );
$$;

-- Updated_at trigger for subscriptions
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.update_updated_at_column();