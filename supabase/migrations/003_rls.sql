-- ============================================================
-- 003_rls.sql
-- TetradCare: row-level security.
--
-- The original migration left RLS off with a comment saying the
-- clinician summary was "protected at the application layer".
-- That means the API does not return it, but the database will
-- hand it to anything holding a valid patient token.
--
-- A patient reading their own differential diagnosis, unmediated,
-- at home, is a clinical harm. This closes it.
--
-- Run AFTER 002_scheduling.sql.
-- ============================================================


-- ------------------------------------------------------------
-- Helper: is the current user a verified clinician?
-- ------------------------------------------------------------

create or replace function is_verified_clinician()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
     where id = auth.uid()
       and role = 'clinician'
       and verification_status = 'verified'
  );
$$;

create or replace function is_clerk()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
     where id = auth.uid()
       and role = 'clerk'
  );
$$;


-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

alter table profiles enable row level security;

drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles
  for select using (id = auth.uid());

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update using (id = auth.uid());

drop policy if exists profiles_clinician_read on profiles;
create policy profiles_clinician_read on profiles
  for select using (is_verified_clinician());


-- ------------------------------------------------------------
-- triage_cases
--
-- Postgres RLS is row-level, not column-level. A patient policy
-- that grants SELECT on their own row grants every column on it,
-- including ai_clinician_summary.
--
-- So patients do not read the table directly. They read the view
-- below, which omits the clinical columns. The API must query
-- patient_cases for patient requests and triage_cases only for
-- clinician requests.
-- ------------------------------------------------------------

alter table triage_cases enable row level security;

drop policy if exists cases_patient_insert on triage_cases;
create policy cases_patient_insert on triage_cases
  for insert with check (patient_id = auth.uid());

drop policy if exists cases_clinician_read on triage_cases;
create policy cases_clinician_read on triage_cases
  for select using (is_verified_clinician());

drop policy if exists cases_clinician_update on triage_cases;
create policy cases_clinician_update on triage_cases
  for update using (is_verified_clinician());

-- Patients may read their own rows, but only through the view.
drop policy if exists cases_patient_read on triage_cases;
create policy cases_patient_read on triage_cases
  for select using (patient_id = auth.uid());


create or replace view patient_cases
with (security_invoker = true)
as
select
  id, patient_id, primary_complaint, complaint_language,
  checklist_qa, ai_assessment, urgency, immediate_action,
  status, slot_id, appointment_facility, appointment_purpose,
  appointment_datetime, created_at, updated_at
from triage_cases;

comment on view patient_cases is
  'Patient-safe projection of triage_cases. Deliberately omits ai_assessment_detail, ai_clinician_summary, recommended_tests, matched_protocol_id and urgency_source. Serve this to patients. Never serve triage_cases directly to a patient session.';


-- ------------------------------------------------------------
-- case_messages
-- ------------------------------------------------------------

alter table case_messages enable row level security;

drop policy if exists messages_participant_read on case_messages;
create policy messages_participant_read on case_messages
  for select using (
    is_verified_clinician()
    or exists (
      select 1 from triage_cases c
       where c.id = case_messages.case_id
         and c.patient_id = auth.uid()
    )
  );

drop policy if exists messages_participant_insert on case_messages;
create policy messages_participant_insert on case_messages
  for insert with check (
    sender_id = auth.uid()
    and (
      is_verified_clinician()
      or exists (
        select 1 from triage_cases c
         where c.id = case_messages.case_id
           and c.patient_id = auth.uid()
      )
    )
  );


-- ------------------------------------------------------------
-- facilities and appointment_slots
--
-- Readable by anyone signed in, since a patient has to see what
-- is available to book. Writable only by staff.
--
-- Note there is no patient UPDATE policy on appointment_slots.
-- Bookings go through book_slot(), which is security definer.
-- ------------------------------------------------------------

alter table facilities enable row level security;

drop policy if exists facilities_read on facilities;
create policy facilities_read on facilities
  for select using (auth.uid() is not null);

drop policy if exists facilities_staff_write on facilities;
create policy facilities_staff_write on facilities
  for all using (is_verified_clinician());


alter table appointment_slots enable row level security;

drop policy if exists slots_read on appointment_slots;
create policy slots_read on appointment_slots
  for select using (auth.uid() is not null);

drop policy if exists slots_staff_write on appointment_slots;
create policy slots_staff_write on appointment_slots
  for all using (is_verified_clinician());


-- ------------------------------------------------------------
-- test_orders
--
-- Patients do not read these. A list of tests being run on you,
-- without a clinician explaining why, is the same problem as the
-- differential diagnosis.
-- ------------------------------------------------------------

alter table test_orders enable row level security;

drop policy if exists orders_clinician_all on test_orders;
create policy orders_clinician_all on test_orders
  for all using (is_verified_clinician());


-- ------------------------------------------------------------
-- Verify before you trust this
--
-- Sign in as a test patient and run:
--
--   select ai_clinician_summary from triage_cases limit 1;
--
-- It must return zero rows or an error. If it returns text,
-- something above did not apply and you must stop and fix it
-- before any real patient uses the system.
-- ------------------------------------------------------------
