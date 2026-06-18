import type { Language } from '@/lib/supabase/types'

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'yo', label: 'Yoruba', nativeLabel: 'Yorùbá' },
  { code: 'ha', label: 'Hausa', nativeLabel: 'Hausa' },
  { code: 'ig', label: 'Igbo', nativeLabel: 'Igbo' },
  { code: 'pcm', label: 'Pidgin', nativeLabel: 'Naija Pidgin' },
]

// Translation dictionary. Keys are dot-namespaced by area of the app.
// NOTE: Yoruba/Igbo/Hausa/Pidgin translations are provided as a working
// starting point for the demo. For anything beyond a pilot, these should
// be reviewed by native-speaking clinicians/linguists, especially medical
// terminology where precision matters.
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // App-wide
    'app.name': 'Triiosan',
    'app.tagline': 'Know what to do next, before you reach the hospital.',

    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.newCase': 'New check-in',
    'nav.history': 'My history',
    'nav.signOut': 'Sign out',
    'nav.queue': 'Patient queue',

    // Dashboard
    'dashboard.openCaseBanner': 'You have an open case — continue the conversation',

    // Auth
    'auth.login': 'Log in',
    'auth.signup': 'Create account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full name',
    'auth.phone': 'Phone number',
    'auth.iAmA': 'I am a',
    'auth.patient': 'Patient',
    'auth.clinician': 'Clinician',
    'auth.specialty': 'Specialty',
    'auth.facility': 'Facility / Hospital',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.loginCta': 'Log in',
    'auth.signupCta': 'Sign up',
    'auth.signupSuccess': 'Account created. You can now log in.',
    'auth.error.generic': 'Something went wrong. Please try again.',
    'auth.pendingBanner':
      'Your clinician account is pending verification. Some features may be limited until an administrator verifies your account.',

    // Landing
    'landing.heroTitle': 'A guided first step, before you reach the clinic.',
    'landing.heroSubtitle':
      'Describe how you feel in your own words. Triiosan helps you understand how urgent it is, what tests might help, and connects you with a clinician — in English, Yorùbá, Hausa, Igbo, or Pidgin.',
    'landing.ctaPatient': 'Check my symptoms',
    'landing.ctaClinician': 'Clinician sign in',
    'landing.disclaimer':
      'Triiosan supports — it does not replace — professional medical care. In a medical emergency, go to the nearest hospital immediately.',

    // New case / symptom checker
    'case.step1Title': "Tell us what's going on",
    'case.step1Prompt':
      'Describe your symptoms in your own words — as you would explain to a doctor. Write in any language you feel most comfortable with.',
    'case.step1Placeholder':
      'For example: I have had a fever and headache since yesterday, and I feel very weak...',
    'case.continue': 'Continue',
    'case.generatingChecklist': 'Reviewing what you told us...',
    'case.step2Title': 'A few more details',
    'case.step2Prompt':
      'These follow-up questions are based on what you described. Answer as best you can — you can skip any you are unsure about.',
    'case.submit': 'Submit',
    'case.skip': 'Not sure / skip',
    'case.analyzing': 'Assessing your information...',
    'case.resultTitle': 'Your assessment',
    'case.recommendedTests': 'Tests that may help',
    'case.assessmentSummary': 'Summary',
    'case.goToCase': 'View full case & talk to a clinician',
    'case.urgency.emergency': 'Emergency',
    'case.urgency.urgent': 'Urgent',
    'case.urgency.routine': 'Routine',
    'case.urgency.emergencyDesc':
      'This may need urgent medical attention. Please go to the nearest hospital or emergency department as soon as possible.',
    'case.urgency.urgentDesc':
      'This should be looked at by a clinician soon — ideally within the next day. A clinician has been notified about your case.',
    'case.urgency.routineDesc':
      'This looks manageable, but a clinician will review your case and respond with guidance.',

    // Case detail / thread
    'thread.title': 'Case conversation',
    'thread.placeholder': 'Type a message...',
    'thread.send': 'Send',
    'thread.waitingForClinician': 'Waiting for a clinician to review your case...',
    'thread.statusOpen': 'Open',
    'thread.statusClosed': 'Closed',
    'thread.appointmentTitle': 'Appointment scheduled',
    'thread.appointmentAt': 'at',
    'thread.appointmentFor': 'For',
    'thread.yourComplaint': 'Your complaint',
    'thread.checklist': 'Additional details',
    'thread.aiAssessment': "Triiosan's assessment",
    'thread.recommendedTests': 'Recommended tests',
    'thread.newCaseNote': 'This case is closed. Start a new check-in for a new concern.',

    // History
    'history.title': 'My history',
    'history.empty': "You haven't started a check-in yet.",
    'history.startNew': 'Start a new check-in',

    // Clinician dashboard
    'clinician.queueTitle': 'Patient queue',
    'clinician.queueEmpty': 'No open cases right now.',
    'clinician.filterAll': 'All',
    'clinician.respond': 'Open case',
    'clinician.scheduleAppointment': 'Schedule appointment & close case',
    'clinician.appointmentFacility': 'Facility',
    'clinician.appointmentPurpose': 'Purpose of visit',
    'clinician.appointmentPurposePlaceholder':
      'e.g. Lab tests: Malaria RDT, FBC — or Consultation: General Medicine',
    'clinician.appointmentDate': 'Date & time',
    'clinician.confirmClose': 'Schedule & close case',
    'clinician.patientInfo': 'Patient',
    'clinician.submittedAt': 'Submitted',

    // Facilities (placeholder list)
    'facility.ooutch': 'OOU Teaching Hospital, Sagamu',
    'facility.ghIkenne': 'General Hospital, Ikenne',
    'facility.ghSagamu': 'General Hospital, Sagamu',
    'facility.phcRemo': 'Primary Health Centre, Remo North',

    // Misc
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong.',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'case.next': 'Next',
    'case.aiFollowUp': 'AI Follow-up',
    'case.answerPlaceholder': 'Your answer...',
    'case.analyzingDetail': 'Comparing against clinical guidelines...',
    'case.immediateAction': 'What to do now',
    'case.aiUnavailableNotice': 'AI assessment was unavailable. Your urgency level was determined by our clinical rule system. A clinician will review your case.',
    'thread.noMessages': 'No messages yet. The clinician will respond here.',
    'thread.closedNotice': 'This case is closed. Start a new check-in for any new concern.',
    'landing.howItWorks': 'How it works',
    'landing.step1Title': 'Describe symptoms',
    'landing.step1Desc': 'Tell us what you feel in your own language.',
    'landing.step2Title': 'Get your result',
    'landing.step2Desc': 'AI and clinical rules assess your urgency level in seconds.',
    'landing.step3Title': 'See a clinician',
    'landing.step3Desc': 'Your case goes to a verified clinician who reviews and responds in real time.',
    'landing.triagePreviewTitle': 'Three urgency levels, instantly classified',
    'landing.clinicianCta': 'Are you a clinician?',
    'landing.clinicianCtaDesc': 'Join the Triiosan clinician network and review patient cases.',
    'common.required': 'Required',
  },

  yo: {
    'app.name': 'Triiosan',
    'app.tagline': 'Mọ ohun tí o yẹ kí o ṣe, kí o tó dé ilé ìwòsàn.',

    'nav.dashboard': 'Dashboard',
    'nav.newCase': 'Ìbẹ̀rẹ̀ tuntun',
    'nav.history': 'Ìtàn mi',
    'nav.signOut': 'Jáde',
    'nav.queue': 'Àtòjọ àwọn aláìsàn',

    // Dashboard
    'dashboard.openCaseBanner': 'O ní ọ̀ràn tí ó ṣì ṣí — tẹ̀síwájú ìfọ̀rọ̀wérọ̀ náà',

    'auth.login': 'Wọlé',
    'auth.signup': 'Ṣẹ̀dá àkáǔnti',
    'auth.email': 'Ímeèlì',
    'auth.password': 'Ọ̀rọ̀ìgbaniwọlé',
    'auth.fullName': 'Orúkọ kíkún',
    'auth.phone': 'Nọ́mbà fóònù',
    'auth.iAmA': 'Èmi jẹ́',
    'auth.patient': 'Aláìsàn',
    'auth.clinician': 'Dókítà',
    'auth.specialty': 'Ẹ̀ka ìmọ̀',
    'auth.facility': 'Ilé ìwòsàn',
    'auth.noAccount': 'O kò ní àkáǔnti?',
    'auth.haveAccount': 'O ti ní àkáǔnti?',
    'auth.loginCta': 'Wọlé',
    'auth.signupCta': 'Forúkọsílẹ̀',
    'auth.signupSuccess': 'A ṣẹ̀dá àkáǔnti rẹ. O lè wọlé báyìí.',
    'auth.error.generic': 'Àṣìṣe kan ṣẹlẹ̀. Jọ̀wọ́ tún gbìyànjú.',
    'auth.pendingBanner':
      'Àkáǔnti rẹ gẹ́gẹ́ bí dókítà ń dúró fún ìfọwọ́sí. Àwọn ẹ̀yà kan le má sí títí tí alábòójútó bá fọwọ́sí àkáǔnti rẹ.',

    'landing.heroTitle': 'Ìgbésẹ̀ àkọ́kọ́ tó dán mọ́rán, kí o tó dé ilé ìwòsàn.',
    'landing.heroSubtitle':
      'Ṣàpèjúwe bí ara rẹ ti rí ní ọ̀rọ̀ tìrẹ. Triiosan yóò ràn ọ́ lọ́wọ́ láti mọ bí ipò náà ṣe pọn dandan, àwọn àyẹ̀wò tí ó lè ṣe ìrànlọ́wọ́, kí ó sì so ọ́ pọ̀ pẹ̀lú dókítà — ní èdè Gẹ̀ẹ́sì, Yorùbá, Hausa, Igbo, tàbí Pidgin.',
    'landing.ctaPatient': 'Ṣàyẹ̀wò àwọn àmì àìsàn mi',
    'landing.ctaClinician': 'Ìwọlé dókítà',
    'landing.disclaimer':
      'Triiosan jẹ́ ìrànlọ́wọ́ — kò sì rọ́pò ìtọ́jú ìṣègùn tó dán mọ́rán. Bí ìpọ̀njú pàjáwìrì bá wáyé, lọ sí ilé ìwòsàn tó sún mọ́ ọ lẹ́sẹ̀kẹsẹ̀.',

    'case.step1Title': 'Sọ ohun tí ó ń ṣẹlẹ̀',
    'case.step1Prompt':
      'Ṣàpèjúwe àwọn àmì àìsàn rẹ ní ọ̀rọ̀ tìrẹ — gẹ́gẹ́ bí o ṣe máa ṣàlàyé fún dókítà. Kọ̀wé ní èdè èyíkéyìí tí ó tẹ́ ọ lọ́rùn jùlọ.',
    'case.step1Placeholder':
      'Fún àpẹẹrẹ: Mo ti ní ibà àti ẹ̀fọ́rí láti àná, mo sì ń rí ara mi pé kò lágbára...',
    'case.continue': 'Tẹ̀síwájú',
    'case.generatingChecklist': 'Ń ṣàyẹ̀wò ohun tí o sọ...',
    'case.step2Title': 'Àwọn kúkúrú alàyé síi',
    'case.step2Prompt':
      'Àwọn ìbéèrè wọ̀nyí dá lórí ohun tí o ti sọ. Dáhùn bí ó ti yẹ — o lè fò lórí èyíkéyìí tí o kò bá dájú nípa rẹ̀.',
    'case.submit': 'Fi ránṣẹ́',
    'case.skip': 'Mi ò dájú / Fò',
    'case.analyzing': 'Ń ṣàyẹ̀wò àlàyé rẹ...',
    'case.resultTitle': 'Àyẹ̀wò rẹ',
    'case.recommendedTests': 'Àwọn àyẹ̀wò tí ó lè ràn ọ́ lọ́wọ́',
    'case.assessmentSummary': 'Àkótán',
    'case.goToCase': 'Wo gbogbo ọ̀rọ̀ náà kí o sì bá dókítà sọ̀rọ̀',
    'case.urgency.emergency': 'Pàjáwìrì',
    'case.urgency.urgent': 'Kánjúkánjú',
    'case.urgency.routine': 'Ojoojúmọ́',
    'case.urgency.emergencyDesc':
      'Èyí lè nílò ìtọ́jú ìṣègùn kánjúkánjú. Jọ̀wọ́ lọ sí ilé ìwòsàn tàbí ẹ̀ka pàjáwìrì tó sún mọ́ ọ ní kíákíá.',
    'case.urgency.urgentDesc':
      'Dókítà gbọdọ̀ wo èyí láìpẹ́ — bóyá láàrin ọjọ́ tó ń bọ̀. A ti fi to dókítà kan létí nípa ọ̀rọ̀ rẹ.',
    'case.urgency.routineDesc':
      'Èyí dà bí ohun tí a lè kojú, ṣùgbọ́n dókítà yóò wo ọ̀rọ̀ rẹ kí ó sì dáhùn pẹ̀lú ìmọ̀ràn.',

    'thread.title': 'Ìfọ̀rọ̀wérọ̀ nípa ọ̀rọ̀ rẹ',
    'thread.placeholder': 'Kọ ọ̀rọ̀ rẹ...',
    'thread.send': 'Fi ránṣẹ́',
    'thread.waitingForClinician': 'A ń dúró de dókítà láti wo ọ̀rọ̀ rẹ...',
    'thread.statusOpen': 'Ṣíṣí',
    'thread.statusClosed': 'Ti pa',
    'thread.appointmentTitle': 'Ìpàdé ti di ṣíṣe',
    'thread.appointmentAt': 'ní',
    'thread.appointmentFor': 'Fún',
    'thread.yourComplaint': 'Ohun tí o sọ',
    'thread.checklist': 'Àlàyé síi',
    'thread.aiAssessment': 'Àyẹ̀wò Triiosan',
    'thread.recommendedTests': 'Àwọn àyẹ̀wò tí a gbà níyànjú',
    'thread.newCaseNote': 'Ọ̀rọ̀ yìí ti pa. Bẹ̀rẹ̀ ìbẹ̀rẹ̀ tuntun fún àìsàn mìíràn.',

    'history.title': 'Ìtàn mi',
    'history.empty': 'O kò tí ì bẹ̀rẹ̀ ìbẹ̀rẹ̀ kankan.',
    'history.startNew': 'Bẹ̀rẹ̀ ìbẹ̀rẹ̀ tuntun',

    'clinician.queueTitle': 'Àtòjọ àwọn aláìsàn',
    'clinician.queueEmpty': 'Kò sí ọ̀rọ̀ tí ó ṣí lọ́wọ́lọ́wọ́.',
    'clinician.filterAll': 'Gbogbo',
    'clinician.respond': 'Ṣí ọ̀rọ̀',
    'clinician.scheduleAppointment': 'Ṣètò ìpàdé kí o sì pa ọ̀rọ̀',
    'clinician.appointmentFacility': 'Ilé ìwòsàn',
    'clinician.appointmentPurpose': 'Ìdí ìpàdé',
    'clinician.appointmentPurposePlaceholder':
      'f.a. Àyẹ̀wò: Malaria RDT, FBC — tàbí Ìmọ̀ràn: Ìṣègùn gbogbogbòò',
    'clinician.appointmentDate': 'Ọjọ́ àti àkókò',
    'clinician.confirmClose': 'Ṣètò kí o sì pa ọ̀rọ̀',
    'clinician.patientInfo': 'Aláìsàn',
    'clinician.submittedAt': 'Fi ránṣẹ́ ní',

    'facility.ooutch': 'Ilé Ìwòsàn Ẹ̀kọ́ OOU, Sagamu',
    'facility.ghIkenne': 'Ilé Ìwòsàn Gbogbogbòò, Ikenne',
    'facility.ghSagamu': 'Ilé Ìwòsàn Gbogbogbòò, Sagamu',
    'facility.phcRemo': 'Ilé Ìwòsàn Alákọ́ọ̀bẹ̀rẹ̀, Remo North',

    'common.loading': 'Ń kò...',
    'common.error': 'Àṣìṣe kan ṣẹlẹ̀.',
    'common.back': 'Padà',
    'common.cancel': 'Fagilé',
    'common.save': 'Fipamọ́',
    'case.next': 'Tẹ̀lé',
    'case.aiFollowUp': 'Ìbéèrè AI',
    'case.answerPlaceholder': 'Ìdáhùn rẹ...',
    'case.analyzingDetail': 'Ń fiwéra pẹ̀lú àwọn ìlànà ìwòsàn...',
    'case.immediateAction': 'Kí ni o gbọdọ̀ ṣe báyìí',
    'case.aiUnavailableNotice': 'AI kò sí. Ìwọ̀n pàtàkì rẹ ni a pinnu nípasẹ̀ ètò ìlànà wa. Dókítà yóò ṣàgbéyẹ̀wò ọ̀ràn rẹ.',
    'thread.noMessages': 'Ìwé ọ̀rọ̀ kankan níbí tí. Dókítà yóò dáhùn níbí.',
    'thread.closedNotice': 'Ọ̀ràn yìí ti di. Bẹ̀rẹ̀ ìṣàyẹ̀wò tuntun fún ìṣòro tuntun.',
    'landing.howItWorks': 'Bí ó ṣe n ṣiṣẹ̀',
    'landing.step1Title': 'Ṣàpèjúwe àmì àìsàn',
    'landing.step1Desc': 'Sọ fún wa ohun tí o ní ìmọ̀lára ní èdè rẹ.',
    'landing.step2Title': 'Gba àbájáde rẹ',
    'landing.step2Desc': 'AI àti àwọn ìlànà ìwòsàn ń ṣàyẹ̀wò ìwọ̀n pàtàkì rẹ ní ìsẹjú.',
    'landing.step3Title': 'Bẹ̀rẹ̀ pẹ̀lú dókítà',
    'landing.step3Desc': 'Ọ̀ràn rẹ lọ sí dókítà tó jẹ́rìí, tí ó ń ṣàgbéyẹ̀wò tí ó sì ń dáhùn ní àkókò gidi.',
    'landing.triagePreviewTitle': 'Ìwọ̀n pàtàkì mẹ́ta, tí a tò lẹ́sẹ̀kẹsẹ̀',
    'landing.clinicianCta': 'Ṣé o jẹ́ dókítà?',
    'landing.clinicianCtaDesc': 'Darapọ̀ mọ̀ nẹ́tìwọọkì dókítà Triiosan kí o sì ṣàgbéyẹ̀wò àwọn ọ̀ràn àwọn aláìsàn.',
    'common.required': 'Pàtàkì',
  },

  ha: {
    'app.name': 'Triiosan',
    'app.tagline': 'Sani abin yi na gaba, kafin ka kai asibiti.',

    'nav.dashboard': 'Dashboard',
    'nav.newCase': 'Sabuwar bincike',
    'nav.history': 'Tarihina',
    'nav.signOut': 'Fita',
    'nav.queue': 'Jerin marasa lafiya',

    // Dashboard
    'dashboard.openCaseBanner': "Kana da shari'ar da ke buɗe — ci gaba da tattaunawar",

    'auth.login': 'Shiga',
    'auth.signup': 'Yi rajista',
    'auth.email': 'Imel',
    'auth.password': 'Kalmar sirri',
    'auth.fullName': 'Cikakken suna',
    'auth.phone': 'Lambar waya',
    'auth.iAmA': 'Ni',
    'auth.patient': 'Mara lafiya',
    'auth.clinician': 'Likita',
    'auth.specialty': 'Fanin ƙwarewa',
    'auth.facility': 'Asibiti',
    'auth.noAccount': 'Ba ka da asusu?',
    'auth.haveAccount': 'Kana da asusu?',
    'auth.loginCta': 'Shiga',
    'auth.signupCta': 'Yi rajista',
    'auth.signupSuccess': 'An ƙirƙiri asusu. Yanzu za ka iya shiga.',
    'auth.error.generic': 'Akwai matsala. Don Allah a sake gwadawa.',
    'auth.pendingBanner':
      'Asusun likitan ku na jiran tabbatarwa. Wasu sifofi za su iyakanta har sai mai gudanarwa ya tabbatar da asusun ku.',

    'landing.heroTitle': 'Mataki na farko mai kyau, kafin ka kai asibiti.',
    'landing.heroSubtitle':
      'Bayyana yadda jikinka yake da kalmominka. Triiosan zai taimaka maka gane matakin gaggawa, gwaje-gwajen da za su taimaka, kuma ya haɗa ka da likita — cikin Turanci, Yarbanci, Hausa, Igbo, ko Pidgin.',
    'landing.ctaPatient': 'Bincika alamomina',
    'landing.ctaClinician': 'Shigar likita',
    'landing.disclaimer':
      'Triiosan yana taimakawa — ba ya maye gurbin kulawar likita ta ƙwararru. A cikin gaggawa ta lafiya, je asibiti mafi kusa nan take.',

    'case.step1Title': 'Faɗa mana abin da ke faruwa',
    'case.step1Prompt':
      'Bayyana alamomin cutarka da kalmominka — kamar yadda za ka bayyana wa likita. Rubuta cikin kowace harshe da ka ji daɗi da ita.',
    'case.step1Placeholder':
      'Misali: Ina da zazzaɓi da ciwon kai tun jiya, kuma ina jin rauni sosai...',
    'case.continue': 'Ci gaba',
    'case.generatingChecklist': 'Ana duba abin da ka faɗa...',
    'case.step2Title': 'Ƴan tambayoyi ƴan kari',
    'case.step2Prompt':
      'Waɗannan tambayoyin sun dogara ne akan abin da ka bayyana. Amsa yadda ya fi dacewa — za ka iya tsallake duk wanda ba ka tabbata ba.',
    'case.submit': 'Aika',
    'case.skip': 'Ban tabbata / Tsallake',
    'case.analyzing': 'Ana nazarin bayanan ka...',
    'case.resultTitle': 'Bincikenku',
    'case.recommendedTests': 'Gwaje-gwajen da za su taimaka',
    'case.assessmentSummary': 'Taƙaitawa',
    'case.goToCase': 'Duba cikakken bayani kuma yi magana da likita',
    'case.urgency.emergency': 'Gaggawa',
    'case.urgency.urgent': 'Da Sauri',
    'case.urgency.routine': 'Na Yau da Kullum',
    'case.urgency.emergencyDesc':
      'Wannan na iya buƙatar kulawar likita ta gaggawa. Don Allah je asibiti ko sashin gaggawa mafi kusa da wuri-wuri.',
    'case.urgency.urgentDesc':
      'Wannan ya kamata likita ya duba da sauri — mafi alheri cikin kwana ɗaya. An sanar da likita game da lamarinku.',
    'case.urgency.routineDesc':
      'Wannan yana kama da abin da za a iya sarrafa, amma likita zai duba lamarinku ya kuma amsa da shawara.',

    'thread.title': 'Tattaunawar lamarin',
    'thread.placeholder': 'Rubuta saƙo...',
    'thread.send': 'Aika',
    'thread.waitingForClinician': 'Ana jiran likita ya duba lamarinku...',
    'thread.statusOpen': 'A Buɗe',
    'thread.statusClosed': 'An Rufe',
    'thread.appointmentTitle': 'An shirya alƙawari',
    'thread.appointmentAt': 'a',
    'thread.appointmentFor': 'Don',
    'thread.yourComplaint': 'Korafinku',
    'thread.checklist': 'Ƙarin bayani',
    'thread.aiAssessment': 'Binciken Triiosan',
    'thread.recommendedTests': 'Gwaje-gwajen da aka shawarta',
    'thread.newCaseNote': 'An rufe wannan lamarin. Fara sabuwar bincike don sabon damuwa.',

    'history.title': 'Tarihina',
    'history.empty': 'Ba ka fara bincike ba tukuna.',
    'history.startNew': 'Fara sabuwar bincike',

    'clinician.queueTitle': 'Jerin marasa lafiya',
    'clinician.queueEmpty': 'Babu lamuran da suka buɗe a yanzu.',
    'clinician.filterAll': 'Duka',
    'clinician.respond': 'Buɗe lamari',
    'clinician.scheduleAppointment': 'Shirya alƙawari kuma rufe lamari',
    'clinician.appointmentFacility': 'Asibiti',
    'clinician.appointmentPurpose': 'Dalilin ziyara',
    'clinician.appointmentPurposePlaceholder':
      'misali: Gwaje-gwaje: Malaria RDT, FBC — ko Shawara: Likitancin Gaba ɗaya',
    'clinician.appointmentDate': 'Kwanan wata da lokaci',
    'clinician.confirmClose': 'Shirya kuma rufe lamari',
    'clinician.patientInfo': 'Mara lafiya',
    'clinician.submittedAt': 'An aika',

    'facility.ooutch': 'Asibitin Koyarwa na OOU, Sagamu',
    'facility.ghIkenne': 'Babban Asibiti, Ikenne',
    'facility.ghSagamu': 'Babban Asibiti, Sagamu',
    'facility.phcRemo': 'Cibiyar Kiwon Lafiya ta Farko, Remo North',

    'common.loading': 'Ana lodawa...',
    'common.error': 'Akwai matsala.',
    'common.back': 'Baya',
    'common.cancel': 'Soke',
    'common.save': 'Ajiye',
    'case.next': 'Na gaba',
    'case.aiFollowUp': 'Tambaya AI',
    'case.answerPlaceholder': 'Amsar ku...',
    'case.analyzingDetail': 'Ana kwatanta da jagororin asibiti...',
    'case.immediateAction': 'Abin da za ku yi yanzu',
    'case.aiUnavailableNotice': "AI bai samuwa ba. An ƙaddara matakan gaggawa ta hanyar tsarin ƙa'idodinmu. Likita zai duba kayanku.",
    'thread.noMessages': 'Babu sakonni tukuna. Likita zai amsa anan.',
    'thread.closedNotice': "An rufe wannan shari'ar. Fara sabon shiga don kowane sabon damuwa.",
    'landing.howItWorks': 'Yadda yake aiki',
    'landing.step1Title': 'Bayyana alamomi',
    'landing.step1Desc': 'Gaya mana abin da kake ji cikin yarhenku.',
    'landing.step2Title': 'Sami sakamakonka',
    'landing.step2Desc': "AI da ƙa'idodin asibiti suna kimanta matakan gaggawa cikin daƙiƙoƙi.",
    'landing.step3Title': 'Ga likita',
    'landing.step3Desc': 'Kayanku yana zuwa wani likita da aka tabbatar wanda ke bitar su kuma yana amsa a lokaci na gaske.',
    'landing.triagePreviewTitle': 'Matakan gaggawa guda uku, an rarraba su nan take',
    'landing.clinicianCta': 'Shin likita ne ku?',
    'landing.clinicianCtaDesc': 'Shiga cibiyar sadarwa ta likita ta Triiosan ku duba kayanku na marasa lafiya.',
    'common.required': 'Wajibi',
  },

  ig: {
    'app.name': 'Triiosan',
    'app.tagline': 'Mata ihe ị ga-eme ọzọ, tupu ị ruo ụlọ ọgwụ.',

    'nav.dashboard': 'Dashboard',
    'nav.newCase': 'Nyocha ọhụrụ',
    'nav.history': 'Akụkọ m',
    'nav.signOut': 'Pụọ',
    'nav.queue': 'Ndepụta ndị ọrịa',

    // Dashboard
    'dashboard.openCaseBanner': "Ị nwere okwu mepere emepe — gaa n'ihu na mkparịta ụka ahụ",

    'auth.login': 'Banye',
    'auth.signup': 'Mepụta akaụntụ',
    'auth.email': 'Email',
    'auth.password': 'Okwuntughe',
    'auth.fullName': 'Aha zuru oke',
    'auth.phone': 'Nọmba ekwentị',
    'auth.iAmA': 'Abụ m',
    'auth.patient': 'Onye ọrịa',
    'auth.clinician': 'Dọkịta',
    'auth.specialty': 'Ngalaba ọkachamara',
    'auth.facility': 'Ụlọ ọgwụ',
    'auth.noAccount': 'Ị nweghị akaụntụ?',
    'auth.haveAccount': 'Ị nwerela akaụntụ?',
    'auth.loginCta': 'Banye',
    'auth.signupCta': 'Debanye aha',
    'auth.signupSuccess': 'Emepụtara akaụntụ. Ị nwere ike banye ugbu a.',
    'auth.error.generic': 'Ihe ọjọọ mere. Biko nwaa ọzọ.',
    'auth.pendingBanner':
      'Akaụntụ dọkịta gị na-eche nkwado. Ụfọdụ akụrụngwa nwere ike ịdị oke ruo mgbe onye nlekọta kwadoro akaụntụ gị.',

    'landing.heroTitle': 'Nzọụkwụ mbụ kwesịrị ekwesị, tupu ị ruo ụlọ ọgwụ.',
    'landing.heroSubtitle':
      'Kọwaa otú ahụ́ gị dị n’okwu nke gị. Triiosan ga-enyere gị aka ịghọta ọkwa mberede ya, ule nwere ike inye aka, ma jikọta gị na dọkịta — n’asụsụ Bekee, Yoruba, Hausa, Igbo, ma ọ bụ Pidgin.',
    'landing.ctaPatient': 'Lelee mgbaàmà m',
    'landing.ctaClinician': 'Nbanye dọkịta',
    'landing.disclaimer':
      'Triiosan na-enyere aka — ọ naghị anọchi anata ọgwụgwọ ndị ọkachamara. Ọ bụrụ na ọ bụ ihe mberede ahụike, gaa ụlọ ọgwụ kacha nso ozugbo.',

    'case.step1Title': 'Gwa anyị ihe na-eme',
    'case.step1Prompt':
      'Kọwaa mgbaàmà ọrịa gị n’okwu nke gị — dị ka ị ga-akọwara dọkịta. Dee n’asụsụ ọ bụla masịrị gị.',
    'case.step1Placeholder':
      'Dịka ọmụmaatụ: Enwere m ahụ̀ ọkụ na isi ọwụwa kemgbe ụnyaahụ, ahụ́ adịghịkwa m ike...',
    'case.continue': 'Gaa n’ihu',
    'case.generatingChecklist': 'Na-elele ihe ị kwuru...',
    'case.step2Title': 'Nkọwa ole na ole ọzọ',
    'case.step2Prompt':
      'Ajụjụ ndị a dabere n’ihe ị kọwara. Zaa ka ọ dị mma — ị nwere ike ịhapụ nke ọ bụla ị na-amaghị nke ọma.',
    'case.submit': 'Zipu',
    'case.skip': 'Amaghị m / Hapụ',
    'case.analyzing': 'Na-enyocha ozi gị...',
    'case.resultTitle': 'Nyocha gị',
    'case.recommendedTests': 'Ule nwere ike inye aka',
    'case.assessmentSummary': 'Nchịkọta',
    'case.goToCase': 'Lelee okwu zuru oke ma gwa dọkịta okwu',
    'case.urgency.emergency': 'Mberede',
    'case.urgency.urgent': 'Ngwa Ngwa',
    'case.urgency.routine': 'Nke Kwa Ụbọchị',
    'case.urgency.emergencyDesc':
      'Nke a nwere ike chọọ enyemaka ahụike ngwa ngwa. Biko gaa ụlọ ọgwụ ma ọ bụ ngalaba mberede kacha nso ozugbo.',
    'case.urgency.urgentDesc':
      'Dọkịta kwesịrị ilele nke a n’oge na-adịghị anya — ọ kachasị n’ime otu ụbọchị. A gwala dọkịta banyere okwu gị.',
    'case.urgency.routineDesc':
      'Nke a yiri ihe enwere ike ijikwa, ma dọkịta ga-elele okwu gị ma zaghachi na ndụmọdụ.',

    'thread.title': 'Mkparịta ụka okwu',
    'thread.placeholder': 'Dee ozi...',
    'thread.send': 'Zipu',
    'thread.waitingForClinician': 'Na-eche ka dọkịta lelee okwu gị...',
    'thread.statusOpen': 'Mepere Emepe',
    'thread.statusClosed': 'Emechiri',
    'thread.appointmentTitle': 'Edobere oge nzukọ',
    'thread.appointmentAt': 'na',
    'thread.appointmentFor': 'Maka',
    'thread.yourComplaint': 'Mkpesa gị',
    'thread.checklist': 'Nkọwa ọzọ',
    'thread.aiAssessment': 'Nyocha Triiosan',
    'thread.recommendedTests': 'Ule a tụrụ aro',
    'thread.newCaseNote': 'Okwu a emechiri. Malite nyocha ọhụrụ maka nsogbu ọhụrụ.',

    'history.title': 'Akụkọ m',
    'history.empty': 'Ị bidobeghị nyocha ọ bụla.',
    'history.startNew': 'Malite nyocha ọhụrụ',

    'clinician.queueTitle': 'Ndepụta ndị ọrịa',
    'clinician.queueEmpty': 'Enweghị okwu mepere emepe ugbu a.',
    'clinician.filterAll': 'Niile',
    'clinician.respond': 'Mepee okwu',
    'clinician.scheduleAppointment': 'Hazie nzukọ ma mechie okwu',
    'clinician.appointmentFacility': 'Ụlọ ọgwụ',
    'clinician.appointmentPurpose': 'Ebumnobi nleta',
    'clinician.appointmentPurposePlaceholder':
      'ọmụmaatụ: Ule: Malaria RDT, FBC — ma ọ bụ Ndụmọdụ: Ọgwụgwọ Izugbe',
    'clinician.appointmentDate': 'Ụbọchị na oge',
    'clinician.confirmClose': 'Hazie ma mechie okwu',
    'clinician.patientInfo': 'Onye ọrịa',
    'clinician.submittedAt': 'Ezipụrụ',

    'facility.ooutch': 'Ụlọ Ọgwụ Nkuzi OOU, Sagamu',
    'facility.ghIkenne': 'Ụlọ Ọgwụ Izugbe, Ikenne',
    'facility.ghSagamu': 'Ụlọ Ọgwụ Izugbe, Sagamu',
    'facility.phcRemo': 'Ebe Nlekọta Ahụike Mbụ, Remo North',

    'common.loading': 'Na-ebu...',
    'common.error': 'Ihe ọjọọ mere.',
    'common.back': 'Laghachi',
    'common.cancel': 'Kagbuo',
    'common.save': 'Chekwaa',
    'case.next': 'Ọzọ',
    'case.aiFollowUp': 'Ajụjụ AI',
    'case.answerPlaceholder': 'Azịza gị...',
    'case.analyzingDetail': 'Na-atụnyere ya na nduzi ọgwụ...',
    'case.immediateAction': 'Ihe i ga-eme ugbu a',
    'case.aiUnavailableNotice': 'AI enweghị ike. E chekwapụtara ọkwa nsogbu gị site na usoro iwu anyị. Dọkịta ga-elele okwu gị.',
    'thread.noMessages': 'Ọ dịghị ozi ọ bụla. Dọkịta ga-azaghachi ebe a.',
    'thread.closedNotice': 'Okwu a mechiri. Bido nlele ọhụrụ maka ọ bụla nsogbu ọhụrụ.',
    'landing.howItWorks': 'Otu ọ si arụ ọrụ',
    'landing.step1Title': 'Kọwaa ihe ọ bụla',
    'landing.step1Desc': "Kọọ anyị ihe i na-enwe n'asụsụ gị.",
    'landing.step2Title': 'Nweta nsonaazụ gị',
    'landing.step2Desc': "AI na usoro ọgwụ na-nleba ọkwa nsogbu gị n'ime sekọnd.",
    'landing.step3Title': 'Hụ dọkịta',
    'landing.step3Desc': "Okwu gị na-aga na dọkịta nkwenye nke na-elele ma zaghachi n'oge n'oge.",
    'landing.triagePreviewTitle': 'Ọkwa nsogbu atọ, akpọpụtara ozugbo',
    'landing.clinicianCta': 'Ị bụ dọkịta?',
    'landing.clinicianCtaDesc': 'Sonyere netwọkụ dọkịta Triiosan ma lele okwu ndị ọrịa.',
    'common.required': 'Achọrọ',
  },

  pcm: {
    'app.name': 'Triiosan',
    'app.tagline': 'Know wetin to do next, before you reach hospital.',

    'nav.dashboard': 'Dashboard',
    'nav.newCase': 'New check-in',
    'nav.history': 'My history',
    'nav.signOut': 'Sign out',
    'nav.queue': 'Patient queue',

    'auth.login': 'Log in',

    // Dashboard
    'dashboard.openCaseBanner': 'You get case wey still open — continue the gist',
    'auth.signup': 'Create account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full name',
    'auth.phone': 'Phone number',
    'auth.iAmA': 'I be',
    'auth.patient': 'Patient',
    'auth.clinician': 'Doctor / Clinician',
    'auth.specialty': 'Specialty',
    'auth.facility': 'Hospital / Facility',
    'auth.noAccount': 'You no get account?',
    'auth.haveAccount': 'You already get account?',
    'auth.loginCta': 'Log in',
    'auth.signupCta': 'Sign up',
    'auth.signupSuccess': 'Account don set. You fit log in now.',
    'auth.error.generic': 'Something no work well. Abeg try again.',
    'auth.pendingBanner':
      'Your clinician account dey wait for verification. Some features fit dey limited until admin verify your account.',

    'landing.heroTitle': 'Better first step, before you reach clinic.',
    'landing.heroSubtitle':
      'Tell us how your body dey feel, your own way. Triiosan go help you understand how serious e be, wetin test fit help, and connect you to doctor — for English, Yoruba, Hausa, Igbo, or Pidgin.',
    'landing.ctaPatient': 'Check my symptoms',
    'landing.ctaClinician': 'Clinician sign in',
    'landing.disclaimer':
      'Triiosan dey support — e no dey replace professional medical care. If na emergency, go nearest hospital sharp sharp.',

    'case.step1Title': 'Tell us wetin dey happen',
    'case.step1Prompt':
      'Describe your symptoms your own way — like how you go explain to doctor. Write for any language wey you comfortable with.',
    'case.step1Placeholder':
      'For example: I dey feel fever and headache since yesterday, and my body weak well well...',
    'case.continue': 'Continue',
    'case.generatingChecklist': 'We dey check wetin you talk...',
    'case.step2Title': 'Few more details',
    'case.step2Prompt':
      'These follow-up questions dey based on wetin you talk. Answer as you fit — you fit skip any wey you no sure about.',
    'case.submit': 'Submit',
    'case.skip': 'I no sure / Skip',
    'case.analyzing': 'We dey check your info...',
    'case.resultTitle': 'Your assessment',
    'case.recommendedTests': 'Tests wey fit help',
    'case.assessmentSummary': 'Summary',
    'case.goToCase': 'See full case & talk to clinician',
    'case.urgency.emergency': 'Emergency',
    'case.urgency.urgent': 'Urgent',
    'case.urgency.routine': 'Routine',
    'case.urgency.emergencyDesc':
      'This one fit need urgent medical attention. Abeg go nearest hospital or emergency department sharp sharp.',
    'case.urgency.urgentDesc':
      'Clinician suppose check this one soon — better within next day. Clinician don get notification about your case.',
    'case.urgency.routineDesc':
      'This one look like something wey we fit manage, but clinician go review your case and reply with guidance.',

    'thread.title': 'Case conversation',
    'thread.placeholder': 'Type message...',
    'thread.send': 'Send',
    'thread.waitingForClinician': 'We dey wait for clinician to review your case...',
    'thread.statusOpen': 'Open',
    'thread.statusClosed': 'Closed',
    'thread.appointmentTitle': 'Appointment don set',
    'thread.appointmentAt': 'at',
    'thread.appointmentFor': 'For',
    'thread.yourComplaint': 'Your complaint',
    'thread.checklist': 'More details',
    'thread.aiAssessment': "Triiosan assessment",
    'thread.recommendedTests': 'Recommended tests',
    'thread.newCaseNote': 'This case don close. Start new check-in for new concern.',

    'history.title': 'My history',
    'history.empty': 'You never start any check-in.',
    'history.startNew': 'Start new check-in',

    'clinician.queueTitle': 'Patient queue',
    'clinician.queueEmpty': 'No open case now.',
    'clinician.filterAll': 'All',
    'clinician.respond': 'Open case',
    'clinician.scheduleAppointment': 'Schedule appointment & close case',
    'clinician.appointmentFacility': 'Facility',
    'clinician.appointmentPurpose': 'Purpose of visit',
    'clinician.appointmentPurposePlaceholder':
      'e.g. Lab tests: Malaria RDT, FBC — or Consultation: General Medicine',
    'clinician.appointmentDate': 'Date & time',
    'clinician.confirmClose': 'Schedule & close case',
    'clinician.patientInfo': 'Patient',
    'clinician.submittedAt': 'Submitted',

    'facility.ooutch': 'OOU Teaching Hospital, Sagamu',
    'facility.ghIkenne': 'General Hospital, Ikenne',
    'facility.ghSagamu': 'General Hospital, Sagamu',
    'facility.phcRemo': 'Primary Health Centre, Remo North',

    'common.loading': 'Dey load...',
    'common.error': 'Something no work.',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'case.next': 'Next',
    'case.aiFollowUp': 'AI Follow-up',
    'case.answerPlaceholder': 'Your answer...',
    'case.analyzingDetail': 'Comparing with medical guidelines...',
    'case.immediateAction': 'Wetin you go do now',
    'case.aiUnavailableNotice': 'AI no dey available. We use our clinical rules take determine your urgency level. One dokita go review your case.',
    'thread.noMessages': 'No messages yet. Dokita go reply here.',
    'thread.closedNotice': 'This case don close. Start new check-in for any new problem.',
    'landing.howItWorks': 'How e dey work',
    'landing.step1Title': 'Describe symptoms',
    'landing.step1Desc': 'Tell us how you feel for your own language.',
    'landing.step2Title': 'Get your result',
    'landing.step2Desc': 'AI and clinical rules go assess your urgency level for seconds.',
    'landing.step3Title': 'See one dokita',
    'landing.step3Desc': 'Your case go reach verified dokita wey go review and reply you in real time.',
    'landing.triagePreviewTitle': 'Three urgency levels, classified sharp sharp',
    'landing.clinicianCta': 'You be dokita?',
    'landing.clinicianCtaDesc': 'Join Triiosan clinician network and review patient cases.',
    'common.required': 'Required',
  },
}

export function t(lang: Language, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key
}
