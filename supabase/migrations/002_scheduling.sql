-- ============================================================
-- 002_scheduling.sql
-- TetradCare: appointment slots, facilities, measurement.
--
-- Run in Supabase SQL Editor AFTER supabase-migration.sql.
-- Safe to re-run: every statement is guarded.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Facilities
--
-- A hospital was a free text string on two different tables.
-- It has to be a row, because slots hang off it.
--
-- session_start / session_end are what stop us booking a 13:00
-- slot at a clinic that shuts at noon. Set them from the real
-- clinic timetable, not from what the website says.
-- ------------------------------------------------------------

create table if not exists facilities (
  id             uuid primary key default gen_random_uuid(),
  name           text        not null,
  lga            text        not null,
  state          text        not null default 'Lagos',
  session_start  time        not null default '08:00',
  session_end    time        not null default '14:00',
  active         boolean     not null default true,
  created_at     timestamptz not null default now(),
  unique (name, lga)
);

comment on column facilities.session_start is
  'Real clinic opening time, agreed with the facility. Slots outside this range are rejected.';


-- ------------------------------------------------------------
-- 2. Appointment slots
--
-- The single most important table in this migration.
--
-- Windows, not times: window_start 09:00, window_end 10:30.
-- We never promise a patient an exact minute, because Lagos
-- traffic makes that a promise we cannot keep.
--
-- distance_band is nullable. Null means anyone may book it.
-- Setting it reserves that window for patients travelling from
-- that band, which is how we stagger arrivals by journey length.
-- ------------------------------------------------------------

do $$ begin
  create type cadre_t as enum ('doctor', 'nurse', 'chew');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type distance_band_t as enum ('near', 'mid', 'far');
exception when duplicate_object then null;
end $$;

create table if not exists appointment_slots (
  id             uuid primary key default gen_random_uuid(),
  facility_id    uuid            not null references facilities(id) on delete cascade,
  slot_date      date            not null,
  window_start   time            not null,
  window_end     time            not null,
  cadre          cadre_t         not null default 'doctor',
  capacity       int             not null check (capacity > 0),
  booked_count   int             not null default 0 check (booked_count >= 0),
  distance_band  distance_band_t,
  created_at     timestamptz     not null default now(),

  constraint window_is_forward check (window_end > window_start),
  constraint not_overbooked    check (booked_count <= capacity),
  unique (facility_id, slot_date, window_start, cadre, distance_band)
);

create index if not exists idx_slots_lookup
  on appointment_slots (facility_id, slot_date, cadre)
  where booked_count < capacity;


-- ------------------------------------------------------------
-- 3. Case lifecycle and measurement columns
--
-- The old flow had two states, open and closed, and booking an
-- appointment set the case to closed. That lost the patient at
-- exactly the moment we needed to start following them, which
-- made our primary outcome measure unrecordable.
-- ------------------------------------------------------------

alter table triage_cases
  add column if not exists slot_id                 uuid references appointment_slots(id),
  add column if not exists actual_arrival_time     timestamptz,
  add column if not exists consultation_start_time timestamptz,
  add column if not exists consultation_end_time   timestamptz,
  add column if not exists attended                boolean,
  add column if not exists booked_by               text,
  add column if not exists travel_mode             text,
  add column if not exists origin_area             text;

do $$ begin
  alter table triage_cases
    add constraint booked_by_valid
    check (booked_by is null or booked_by in ('patient', 'clerk', 'clinician'));
exception when duplicate_object then null;
end $$;

-- Widen the status check to the full lifecycle.
alter table triage_cases drop constraint if exists triage_cases_status_check;
alter table triage_cases
  add constraint triage_cases_status_check
  check (status in ('open', 'scheduled', 'attended', 'no_show', 'closed'));

comment on column triage_cases.booked_by is
  'patient | clerk | clinician. Watching this shift from clerk to patient is our main adoption metric.';
comment on column triage_cases.actual_arrival_time is
  'When the patient actually reached the facility. Compare against slot window_start to measure arrival spread.';


-- ------------------------------------------------------------
-- 4. Booking, done inside the database
--
-- If two patients hit the last seat at the same moment,
-- checking capacity in application code lets both through.
-- The update below only succeeds while booked_count < capacity,
-- and the row lock makes that check atomic.
--
-- Never book by writing to appointment_slots directly.
-- ------------------------------------------------------------

create or replace function book_slot(
  p_slot_id   uuid,
  p_case_id   uuid,
  p_booked_by text default 'clinician'
)
returns appointment_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot    appointment_slots;
  v_urgency text;
  v_status  text;
begin
  if p_booked_by not in ('patient', 'clerk', 'clinician') then
    raise exception 'INVALID_BOOKED_BY';
  end if;

  select urgency, status into v_urgency, v_status
    from triage_cases where id = p_case_id;

  if not found then
    raise exception 'CASE_NOT_FOUND';
  end if;

  -- Emergency cases never receive a slot. They are told to go now.
  -- This is enforced here as well as in the API so that no future
  -- caller can route around it.
  if v_urgency = 'emergency' then
    raise exception 'EMERGENCY_CANNOT_BE_SCHEDULED';
  end if;

  if v_status in ('closed', 'attended', 'no_show') then
    raise exception 'CASE_NOT_BOOKABLE';
  end if;

  update appointment_slots
     set booked_count = booked_count + 1
   where id = p_slot_id
     and booked_count < capacity
  returning * into v_slot;

  if not found then
    raise exception 'SLOT_FULL';
  end if;

  update triage_cases
     set slot_id   = p_slot_id,
         status    = 'scheduled',
         booked_by = p_booked_by,
         updated_at = now()
   where id = p_case_id;

  return v_slot;
end;
$$;


create or replace function release_slot(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_id uuid;
begin
  select slot_id into v_slot_id from triage_cases where id = p_case_id;

  if v_slot_id is null then
    return;
  end if;

  update appointment_slots
     set booked_count = greatest(booked_count - 1, 0)
   where id = v_slot_id;

  update triage_cases
     set slot_id = null,
         status  = 'open',
         updated_at = now()
   where id = p_case_id;
end;
$$;


-- ------------------------------------------------------------
-- 5. Test orders
--
-- recommended_tests already exists on triage_cases as a text
-- array, generated at triage. It has never been actionable.
-- This turns it into something a lab can work from.
--
-- A clinician must approve every order. The model proposes,
-- a human authorises. Do not relax this.
-- ------------------------------------------------------------

create table if not exists test_orders (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid        not null references triage_cases(id) on delete cascade,
  test_name   text        not null,
  ordered_by  uuid        not null references profiles(id),
  ordered_at  timestamptz not null default now(),
  status      text        not null default 'ordered'
                check (status in ('ordered', 'collected', 'resulted', 'cancelled'))
);

create index if not exists idx_test_orders_case on test_orders (case_id);


-- ------------------------------------------------------------
-- 6. Slot generator
--
-- Creates windows across a facility's real session hours for a
-- date range. Run it weekly, or wire it to a cron function.
--
-- Example: 90-minute windows, 12 doctor seats each, for the two
-- weeks from Monday:
--   select generate_slots(
--     (select id from facilities where name = 'General Hospital Ikorodu'),
--     current_date, current_date + 14, 90, 12, 'doctor'
--   );
-- ------------------------------------------------------------

create or replace function generate_slots(
  p_facility_id     uuid,
  p_from            date,
  p_to              date,
  p_window_minutes  int  default 90,
  p_capacity        int  default 12,
  p_cadre           cadre_t default 'doctor'
)
returns int
language plpgsql
as $$
declare
  v_day     date;
  v_start   time;
  v_end     time;
  v_cursor  time;
  v_created int := 0;
begin
  select session_start, session_end into v_start, v_end
    from facilities where id = p_facility_id;

  if not found then
    raise exception 'FACILITY_NOT_FOUND';
  end if;

  v_day := p_from;
  while v_day <= p_to loop
    -- Skip Sundays. Adjust if the facility runs a Sunday clinic.
    if extract(dow from v_day) <> 0 then
      v_cursor := v_start;
      while v_cursor + (p_window_minutes || ' minutes')::interval <= v_end loop
        insert into appointment_slots
          (facility_id, slot_date, window_start, window_end, cadre, capacity)
        values
          (p_facility_id, v_day, v_cursor,
           v_cursor + (p_window_minutes || ' minutes')::interval,
           p_cadre, p_capacity)
        on conflict do nothing;

        v_created := v_created + 1;
        v_cursor  := v_cursor + (p_window_minutes || ' minutes')::interval;
      end loop;
    end if;
    v_day := v_day + 1;
  end loop;

  return v_created;
end;
$$;
