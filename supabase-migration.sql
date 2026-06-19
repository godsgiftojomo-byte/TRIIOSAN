-- Migration: add ai_clinician_summary column to triage_cases
-- Run this in your Supabase SQL editor before deploying the updated assess route.
--
-- This column stores the AI's full clinical reasoning (differential diagnosis,
-- red flags, clinical rationale) for clinician review only.
-- It is saved server-side and NEVER sent to the patient-facing API response.

ALTER TABLE triage_cases
  ADD COLUMN IF NOT EXISTS ai_clinician_summary text DEFAULT NULL;

-- Optional: restrict patient-role reads via RLS if you have row-level security.
-- Clinicians should be able to SELECT this column; patients should not.
-- Example (adjust to your actual RLS policy structure):
--
-- CREATE POLICY "Clinicians can view clinician_summary"
--   ON triage_cases FOR SELECT
--   USING (
--     auth.uid() = patient_id  -- patient can read their own case but NOT this column
--     OR EXISTS (
--       SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'clinician'
--     )
--   );
--
-- For now, the column is protected at the application layer (not returned in API response).
