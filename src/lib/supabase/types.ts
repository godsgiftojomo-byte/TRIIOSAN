// Replaces src/lib/supabase/types.ts in full.

export type UserRole = 'patient' | 'clinician' | 'clerk'
export type Language = 'en' | 'yo' | 'ha' | 'ig' | 'pcm'
export type VerificationStatus = 'pending' | 'verified'
export type Urgency = 'emergency' | 'urgent' | 'routine'
export type UrgencySource = 'ai' | 'red-flag' | 'protocol' | 'fallback'

/**
 * Booking a slot no longer ends the case. It moves it to
 * 'scheduled', and it stays there until the patient either turns
 * up ('attended') or does not ('no_show').
 *
 * Without those two states we cannot measure the one thing the
 * whole pilot is trying to measure.
 */
export type CaseStatus =
  | 'open'
  | 'scheduled'
  | 'attended'
  | 'no_show'
  | 'closed'

export type Cadre = 'doctor' | 'nurse' | 'chew'
export type DistanceBand = 'near' | 'mid' | 'far'
export type BookedBy = 'patient' | 'clerk' | 'clinician'

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

export interface Facility {
  id: string
  name: string
  lga: string
  state: string
  session_start: string
  session_end: string
  active: boolean
  created_at: string
}

export interface AppointmentSlot {
  id: string
  facility_id: string
  slot_date: string
  window_start: string
  window_end: string
  cadre: Cadre
  capacity: number
  booked_count: number
  distance_band: DistanceBand | null
  created_at: string
}

/** A slot joined to its facility, as returned by the slots endpoint. */
export interface AvailableSlot extends AppointmentSlot {
  facility_name: string
  seats_left: number
}

export interface TestOrder {
  id: string
  case_id: string
  test_name: string
  ordered_by: string
  ordered_at: string
  status: 'ordered' | 'collected' | 'resulted' | 'cancelled'
}

export interface TriageCase {
  id: string
  patient_id: string
  primary_complaint: string
  complaint_language: string
  checklist_qa: ChecklistItem[]
  ai_assessment: string | null
  ai_assessment_detail: string | null
  urgency: Urgency | null
  urgency_source: UrgencySource | null
  recommended_tests: string[]
  immediate_action: string | null
  matched_protocol_id: string | null
  status: CaseStatus
  assigned_clinician_id: string | null

  // Booking
  slot_id: string | null
  booked_by: BookedBy | null

  // Legacy free-text appointment fields. Kept so old rows still
  // render. Do not write to them in new code, write slot_id.
  appointment_facility: string | null
  appointment_purpose: string | null
  appointment_datetime: string | null

  // Measurement. These are the pilot's primary outcome.
  actual_arrival_time: string | null
  consultation_start_time: string | null
  consultation_end_time: string | null
  attended: boolean | null

  // Collected at signup, used for distance-banded slot assignment.
  travel_mode: string | null
  origin_area: string | null

  created_at: string
  updated_at: string
}

/**
 * Patient-safe projection, backed by the `patient_cases` view.
 * Omits ai_assessment_detail, ai_clinician_summary,
 * recommended_tests, matched_protocol_id and urgency_source.
 *
 * Serve this shape to patient sessions. Never serve TriageCase.
 */
export type PatientCase = Pick<
  TriageCase,
  | 'id'
  | 'patient_id'
  | 'primary_complaint'
  | 'complaint_language'
  | 'checklist_qa'
  | 'ai_assessment'
  | 'urgency'
  | 'immediate_action'
  | 'status'
  | 'slot_id'
  | 'appointment_facility'
  | 'appointment_purpose'
  | 'appointment_datetime'
  | 'created_at'
  | 'updated_at'
>

export interface CaseMessage {
  id: string
  case_id: string
  sender_id: string
  sender_role: UserRole
  message: string
  read_at: string | null
  created_at: string
}

export type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; role: UserRole; full_name: string }
        Update: Partial<Profile>
        Relationships: GenericRelationship[]
      }
      facilities: {
        Row: Facility
        Insert: Partial<Facility> & { name: string; lga: string }
        Update: Partial<Facility>
        Relationships: GenericRelationship[]
      }
      appointment_slots: {
        Row: AppointmentSlot
        Insert: Partial<AppointmentSlot> & {
          facility_id: string
          slot_date: string
          window_start: string
          window_end: string
          capacity: number
        }
        Update: Partial<AppointmentSlot>
        Relationships: GenericRelationship[]
      }
      triage_cases: {
        Row: TriageCase
        Insert: Partial<TriageCase> & { patient_id: string; primary_complaint: string }
        Update: Partial<TriageCase>
        Relationships: GenericRelationship[]
      }
      test_orders: {
        Row: TestOrder
        Insert: Partial<TestOrder> & {
          case_id: string
          test_name: string
          ordered_by: string
        }
        Update: Partial<TestOrder>
        Relationships: GenericRelationship[]
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
        Relationships: GenericRelationship[]
      }
    }
    Views: {
      patient_cases: {
        Row: PatientCase
        Relationships: GenericRelationship[]
      }
    }
    Functions: {
      book_slot: {
        Args: { p_slot_id: string; p_case_id: string; p_booked_by?: BookedBy }
        Returns: AppointmentSlot
      }
      release_slot: {
        Args: { p_case_id: string }
        Returns: undefined
      }
    }
  }
}
