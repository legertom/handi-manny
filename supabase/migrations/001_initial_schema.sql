-- Handi-Manny initial schema
-- Run this in the Supabase SQL editor after installing the integration.

-- ─── Profiles ────────────────────────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer'
    check (role in ('customer', 'manny')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "own_profile" on profiles
  for select using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ─── Bookings ────────────────────────────────────────────────────────────────

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),

  -- service
  service_id text not null,
  service_name text not null,
  price_dollars numeric(10,2) not null,
  duration_minutes integer not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,

  -- customer (flattened)
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_preferred_contact text not null default 'sms'
    check (customer_preferred_contact in ('sms', 'email')),

  -- address (flattened)
  address_line1 text not null,
  address_line2 text,
  address_city text not null default 'New York',
  address_borough text not null,
  address_zip text not null,
  address_access_notes text,

  -- job details
  task_details text,
  photos jsonb not null default '[]',
  intake_answers jsonb not null default '{}',
  selected_addon_ids text[] not null default array[]::text[],
  price_breakdown jsonb not null default '{}',

  -- status
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'declined', 'completed', 'canceled')),

  -- stripe
  stripe_payment_intent_id text,
  stripe_authorization_status text
    check (stripe_authorization_status is null or
           stripe_authorization_status in ('authorized', 'captured', 'voided', 'failed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-bump updated_at on every UPDATE.
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

create index idx_bookings_status on bookings(status);
create index idx_bookings_scheduled_start on bookings(scheduled_start);
create index idx_bookings_user_id on bookings(user_id);

alter table bookings enable row level security;

-- Helper: returns true when the authenticated user has role = 'manny'.
create or replace function is_manny()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'manny'
  );
$$ language sql security definer;

create policy "manny_all" on bookings
  for all using (is_manny());

create policy "customer_own_bookings" on bookings
  for select using (auth.uid() = user_id);

create policy "public_insert_bookings" on bookings
  for insert with check (true);


-- ─── Storage: booking photos ─────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', true)
on conflict (id) do nothing;

create policy "public_upload_photos" on storage.objects
  for insert with check (bucket_id = 'booking-photos');

create policy "public_read_photos" on storage.objects
  for select using (bucket_id = 'booking-photos');
