alter table if exists public.traders
  add column if not exists operator_status text default 'active',
  add column if not exists next_review_date date,
  add column if not exists journal_user_id text;
