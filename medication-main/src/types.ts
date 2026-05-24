export type Screen = 
  | 'splash' 
  | 'login' 
  | 'home' 
  | 'meds' 
  | 'add-med' 
  | 'assistant' 
  | 'reports' 
  | 'family' 
  | 'profile'
  | 'personal-info'
  | 'edit-profile';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  memberSince?: string;
  isPremium?: boolean;
}

export type MedicationStatus = 'taken' | 'pending' | 'missed';

export interface Medication {
  id: string;
  name: string;
  time: string;
  dosage: string;
  status: MedicationStatus;
  schedule: 'morning' | 'afternoon' | 'evening';
}
