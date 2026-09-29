// triiosan-batch1 marker: https://triiosan.dev/b1/facilities
// Fictional demo facilities. None of these are real hospitals.
// Names are proper nouns, so they are not translated. The English name
// is what gets stored on the appointment, whatever language the
// clinician is using.

export type FacilityTier = 'teaching' | 'general' | 'phc'

export interface Facility {
  id: string
  name: string
  tier: FacilityTier
}

export const FACILITIES: Facility[] = [
  { id: 'crestfield', name: 'Crestfield Teaching Hospital', tier: 'teaching' },
  { id: 'lakeside', name: 'Lakeside General Hospital', tier: 'general' },
  { id: 'emerald-grove', name: 'Emerald Grove General Hospital', tier: 'general' },
  { id: 'palmview', name: 'Palmview Primary Health Centre', tier: 'phc' },
]
