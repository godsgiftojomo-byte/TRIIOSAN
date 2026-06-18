-- ============================================================
-- TRIIOSAN SCHEMA v2 MIGRATION
-- Run this in Supabase SQL Editor AFTER schema.sql
-- (If starting fresh, the full schema_v2.sql below is better)
-- ============================================================

-- Add missing columns to triage_cases
alter table public.triage_cases
  -- renamed from checklist: stores all Q&A pairs as JSON array
  add column if not exists checklist_qa jsonb default '[]'::jsonb,
  -- expanded assessment fields
  add column if not exists ai_assessment_detail text,
  add column if not exists immediate_action text,
  add column if not exists matched_protocol_id text,
  -- urgency_source needs to allow 'red-flag', 'protocol', 'fallback' in addition to 'ai'
  add column if not exists urgency_source_v2 text;

-- Migrate existing data: copy checklist → checklist_qa
update public.triage_cases set checklist_qa = checklist where checklist_qa is null;

-- Update urgency_source constraint to allow all values
-- (drop old check constraint and add a wider one)
alter table public.triage_cases drop constraint if exists triage_cases_urgency_source_check;
alter table public.triage_cases add constraint triage_cases_urgency_source_check
  check (urgency_source in ('ai', 'rule_override', 'red-flag', 'protocol', 'fallback'));

-- Add admin_users table (server-side only — never exposed via RLS)
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '8 hours'),
  created_at timestamptz default now()
);

-- Admin sessions are accessed server-side only via service role key
-- No RLS needed — this table is never queried client-side
