-- ============================================================
-- seed/ikorodu.sql
-- Pilot facility and its first fortnight of slots.
--
-- BEFORE RUNNING: replace session_start and session_end with the
-- real clinic hours from Ikorodu. Do not guess them. If the
-- booked window falls outside the working session, patients
-- arrive to a closed clinic and the pilot is over in a week.
--
-- The 10:00 start is deliberate. A Lagos study of 4,005 women
-- found the time of day you travel predicts whether the journey
-- takes over an hour, more than distance does. Booking off-peak
-- buys back travel time and spreads arrivals at the same time.
-- If Ikorodu's session ends at noon, this needs renegotiating,
-- not quietly shifting back to 08:00.
-- ============================================================

insert into facilities (name, lga, state, session_start, session_end)
values ('General Hospital Ikorodu', 'Ikorodu', 'Lagos', '10:00', '14:00')
on conflict (name, lga) do update
  set session_start = excluded.session_start,
      session_end   = excluded.session_end;


-- Doctor slots: 90-minute windows, 12 seats each, next 14 days.
select generate_slots(
  (select id from facilities where name = 'General Hospital Ikorodu'),
  current_date,
  current_date + 14,
  90,
  12,
  'doctor'
);

-- Nurse slots run alongside. Routine cases route here, which is
-- what frees doctor capacity for cases that actually need it.
select generate_slots(
  (select id from facilities where name = 'General Hospital Ikorodu'),
  current_date,
  current_date + 14,
  90,
  20,
  'nurse'
);


-- ------------------------------------------------------------
-- Distance banding
--
-- Reserve the earliest window for patients living close, and the
-- latest for those travelling furthest. One field at signup,
-- large effect on whether people can hit their window.
--
-- Apply after generating, so the bands sit on real rows.
-- ------------------------------------------------------------

update appointment_slots s
   set distance_band = 'near'
 where s.facility_id = (select id from facilities where name = 'General Hospital Ikorodu')
   and s.window_start = '10:00';

update appointment_slots s
   set distance_band = 'far'
 where s.facility_id = (select id from facilities where name = 'General Hospital Ikorodu')
   and s.window_start >= '12:30';


-- ------------------------------------------------------------
-- Sanity check. Run this and eyeball the output before booking
-- a single patient.
-- ------------------------------------------------------------

-- select slot_date, window_start, window_end, cadre, capacity, distance_band
--   from appointment_slots
--  where facility_id = (select id from facilities where name = 'General Hospital Ikorodu')
--    and slot_date = current_date + 1
--  order by window_start, cadre;
