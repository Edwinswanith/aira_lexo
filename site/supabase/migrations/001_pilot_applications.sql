create extension if not exists pgcrypto;

create table if not exists public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('doctor', 'clinic_owner', 'hospital_admin', 'other')),
  specialty text not null,
  organization text,
  city text not null check (city in ('chennai', 'bengaluru', 'hyderabad', 'mumbai', 'coimbatore', 'other')),
  other_city text,
  daily_patient_volume text not null check (daily_patient_volume in ('under_20', '20_40', '41_60', 'over_60')),
  documentation_method text not null check (documentation_method in ('paper', 'emr', 'dictation', 'mixed', 'other')),
  repeat_visit_share text not null check (repeat_visit_share in ('under_25', '25_50', 'over_50', 'unsure')),
  pilot_interest text check (char_length(pilot_interest) <= 600),
  application_status text not null default 'new' check (application_status in ('new', 'reviewed', 'shortlisted', 'waitlisted', 'contacted', 'closed')),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'retry')),
  access_track text not null check (access_track in ('received', 'future_access')),
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  privacy_policy_version text not null,
  consent_timestamp timestamptz not null
);

create index if not exists pilot_applications_email_created_idx on public.pilot_applications (email, created_at desc);
alter table public.pilot_applications enable row level security;

create table if not exists public.pilot_rate_limits (
  id bigint generated always as identity primary key,
  network_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists pilot_rate_limits_hash_created_idx on public.pilot_rate_limits (network_hash, created_at desc);
alter table public.pilot_rate_limits enable row level security;

create or replace function public.check_pilot_rate_limit(network_hash_input text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  delete from public.pilot_rate_limits where created_at < now() - interval '24 hours';
  perform pg_advisory_xact_lock(hashtext(network_hash_input));
  select count(*) into recent_count
  from public.pilot_rate_limits
  where network_hash = network_hash_input
    and created_at >= now() - interval '15 minutes';
  if recent_count >= 5 then
    return false;
  end if;
  insert into public.pilot_rate_limits (network_hash) values (network_hash_input);
  return true;
end;
$$;

revoke all on public.pilot_applications from anon, authenticated;
revoke all on public.pilot_rate_limits from anon, authenticated;
revoke execute on function public.check_pilot_rate_limit(text) from anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pilot_applications_updated_at on public.pilot_applications;
create trigger set_pilot_applications_updated_at
before update on public.pilot_applications
for each row execute function public.set_updated_at();
