-- Rentala schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Every table is owned by a user (user_id) and locked down with row level security.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  business_address text,
  phone text,
  logo_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------- properties
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null default '',
  province text not null default '',
  type text not null default 'residential' check (type in ('residential','commercial','mixed')),
  units integer not null default 1 check (units >= 0),
  description text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- tenants
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  rent numeric(12,2) not null default 0,
  lease_start date not null,
  lease_end date not null,
  status text not null default 'active' check (status in ('active','inactive','pending')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_date date not null,
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer','cash','card','eft')),
  reference text,
  notes text,
  status text not null default 'completed' check (status in ('completed','pending','overdue')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- maintenance
create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  issue text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  due_date date,
  completed_date date,
  cost numeric(12,2) default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  amount numeric(12,2) not null,
  description text,
  status text not null default 'draft' check (status in ('draft','sent','paid')),
  sent_at timestamptz,
  paid_date date,
  last_reminder_at timestamptz,
  reminder_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

-- ----------------------------------------------------------------- vendors
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null,
  due_date date not null,
  paid_date date,
  status text not null default 'due' check (status in ('due','paid')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------ tenant screenings
-- A manual log of screening requests and outcomes. Live credit-bureau checks
-- need a bureau API account and a server-side function; see README.
create table if not exists public.screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  applicant_name text not null,
  applicant_email text,
  applicant_phone text,
  monthly_income numeric(12,2),
  status text not null default 'requested' check (status in ('requested','approved','declined')),
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ indexes
create index if not exists idx_properties_user on public.properties(user_id);
create index if not exists idx_tenants_user on public.tenants(user_id);
create index if not exists idx_tenants_property on public.tenants(property_id);
create index if not exists idx_payments_user_date on public.payments(user_id, payment_date);
create index if not exists idx_maintenance_user on public.maintenance(user_id);
create index if not exists idx_invoices_user_due on public.invoices(user_id, due_date);
create index if not exists idx_expenses_user_due on public.expenses(user_id, due_date);

-- ------------------------------------------------------ row level security
alter table public.profiles enable row level security;
drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array[
    'properties','tenants','payments','maintenance',
    'invoices','vendors','expenses','screenings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_own" on public.%I', t, t);
    execute format(
      'create policy "%s_own" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t
    );
  end loop;
end $$;
