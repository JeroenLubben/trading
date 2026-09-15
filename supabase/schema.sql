-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query) for a fresh project.

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trade_date date not null,
  trade_time time,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  position_size numeric,
  entry_price numeric,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  risk_amount numeric,
  fees numeric,
  realized_pnl numeric,
  created_at timestamptz not null default now()
);

create index if not exists trades_user_id_trade_date_idx on trades (user_id, trade_date desc);

-- Row-level security: every row is scoped to the signed-in user (auth.uid()).
-- Even with the public anon key exposed in the client bundle, nobody can read
-- or write another user's rows because these policies are enforced by Postgres itself.
alter table trades enable row level security;

create policy "Users can view their own trades"
  on trades for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trades"
  on trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trades"
  on trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own trades"
  on trades for delete
  using (auth.uid() = user_id);
