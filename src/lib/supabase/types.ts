// Hand-written types matching supabase/schema.sql.
// If you change the schema, update these to match.

export type UserRole = 'patient' | 'clinician'
export type Language = 'en' | 'yo' | 'ha' | 'ig' | 'pcm'
export type VerificationStatus = 'pending' | 'verified'
export type Urgency = 'emergency' | 'urgent' | 'routine'
export type UrgencySource = 'ai' | 'rule_override'
export type CaseStatus = 'open' | 'closed'

export interface ChecklistItem {
  question: string
  answer: string
}

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  specialty: string | null
  facility: string | null
  verification_status: VerificationStatus | null
  preferred_language: Language
  created_at: string
}

export interface TriageCase {
  id: string
  patient_id: string
  primary_complaint: string
  complaint_language: string
  checklist: ChecklistItem[]
  ai_assessment: string | null
  urgency: Urgency | null
  urgency_source: UrgencySource | null
  recommended_tests: string[]
  status: CaseStatus
  assigned_clinician_id: string | null
  appointment_facility: string | null
  appointment_purpose: string | null
  appointment_datetime: string | null
  created_at: string
  updated_at: string
}

export interface CaseMessage {
  id: string
  case_id: string
  sender_id: string
  sender_role: UserRole
  message: string
  created_at: string
}

// Minimal Database type for Supabase client typing.
// Not exhaustive (no Functions/Enums sections) but enough
// for typed table access via .from('table_name').
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; role: UserRole; full_name: string }
        Update: Partial<Profile>
      }
      triage_cases: {
        Row: TriageCase
        Insert: Partial<TriageCase> & { patient_id: string; primary_complaint: string }
        Update: Partial<TriageCase>
      }
      case_messages: {
        Row: CaseMessage
        Insert: Partial<CaseMessage> & {
          case_id: string
          sender_id: string
          sender_role: UserRole
          message: string
        }
        Update: Partial<CaseMessage>
      }
    }
  }
}
