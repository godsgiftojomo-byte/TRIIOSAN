-- ============================================================
-- TRIIOSAN DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor (one paste, one run)
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'clinician')),
  full_name text not null,
  phone text,
  -- Clinician-only fields
  specialty text,
  facility text,
  verification_status text check (verification_status in ('pending', 'verified')) default 'pending',
  -- Common
  preferred_language text default 'en' check (preferred_language in ('en', 'yo', 'ha', 'ig', 'pcm')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Clinicians can view patient profiles (needed to show patient name on case)
create policy "Clinicians can view patient profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'clinician'
    )
  );


-- ------------------------------------------------------------
-- 2. TRIAGE CASES
-- ------------------------------------------------------------
create table public.triage_cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,

  -- Step 1: free-text primary complaint
  primary_complaint text not null,
  complaint_language text default 'en',

  -- Step 2: AI-generated checklist + patient answers (stored as JSON)
  -- Shape: [{ "question": "...", "answer": "..." }, ...]
  checklist jsonb default '[]'::jsonb,

  -- Step 3: Triage results
  ai_assessment text,              -- LLM's free-text reasoning/summary
  urgency text check (urgency in ('emergency', 'urgent', 'routine')),
  urgency_source text check (urgency_source in ('ai', 'rule_override')),
  recommended_tests jsonb default '[]'::jsonb,  -- e.g. ["Malaria RDT", "FBC"]

  -- Case lifecycle
  status text not null default 'open' check (status in ('open', 'closed')),
  assigned_clinician_id uuid references public.profiles(id) on delete set null,

  -- Appointment (set when clinician closes the case)
  appointment_facility text,
  appointment_purpose text,        -- e.g. "Lab tests: Malaria RDT, FBC" or "Consultation: General Medicine"
  appointment_datetime timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.triage_cases enable row level security;

-- Patients can view their own cases
create policy "Patients can view own cases"
  on public.triage_cases for select
  using (auth.uid() = patient_id);

-- Patients can create their own cases
create policy "Patients can create own cases"
  on public.triage_cases for insert
  with check (auth.uid() = patient_id);

-- Patients can update their own cases (e.g. adding checklist answers)
-- Restricted in practice by application logic to only allow updates while status = 'open'
create policy "Patients can update own open cases"
  on public.triage_cases for update
  using (auth.uid() = patient_id);

-- Verified clinicians can view all open cases (queue) + cases assigned to them
create policy "Clinicians can view cases"
  on public.triage_cases for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
        and p.verification_status = 'verified'
    )
  );

-- Verified clinicians can update cases (claim, respond, close)
create policy "Clinicians can update cases"
  on public.triage_cases for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
        and p.verification_status = 'verified'
    )
  );


-- ------------------------------------------------------------
-- 3. CASE MESSAGES (back-and-forth thread)
-- ------------------------------------------------------------
create table public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.triage_cases(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('patient', 'clinician')),
  message text not null,
  created_at timestamptz default now()
);

alter table public.case_messages enable row level security;

-- Patients can view messages on their own cases
create policy "Patients can view own case messages"
  on public.case_messages for select
  using (
    exists (
      select 1 from public.triage_cases c
      where c.id = case_id and c.patient_id = auth.uid()
    )
  );

-- Patients can send messages on their own cases
create policy "Patients can send messages on own cases"
  on public.case_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.triage_cases c
      where c.id = case_id and c.patient_id = auth.uid()
    )
  );

-- Verified clinicians can view all case messages
create policy "Clinicians can view case messages"
  on public.case_messages for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
        and p.verification_status = 'verified'
    )
  );

-- Verified clinicians can send messages
create policy "Clinicians can send case messages"
  on public.case_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
        and p.verification_status = 'verified'
    )
  );


-- ------------------------------------------------------------
-- 4. INDEXES for performance
-- ------------------------------------------------------------
create index idx_triage_cases_patient on public.triage_cases(patient_id);
create index idx_triage_cases_status on public.triage_cases(status);
create index idx_triage_cases_urgency on public.triage_cases(urgency);
create index idx_case_messages_case on public.case_messages(case_id);


-- ------------------------------------------------------------
-- 5. updated_at trigger for triage_cases
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_triage_cases_updated_at
  before update on public.triage_cases
  for each row
  execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 6. ENABLE REALTIME (for live updates)
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.triage_cases;
alter publication supabase_realtime add table public.case_messages;


-- ============================================================
-- SEED DATA: Pre-verified demo clinician accounts
-- ============================================================
-- NOTE: This part does NOT create auth users (that requires the
-- Supabase Auth API, not plain SQL). Instead:
--   1. Sign up normally through the app as a clinician
--      (e.g. dr.adebayo@triiosan.demo)
--   2. Then run the UPDATE below, replacing the email, to flip
--      that account to "verified" so it shows up properly in
--      the clinician dashboard for the demo.
--
-- update public.profiles
-- set verification_status = 'verified'
-- where id = (select id from auth.users where email = 'dr.adebayo@triiosan.demo');
-- ============================================================
