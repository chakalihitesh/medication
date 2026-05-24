import { Medication, User } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  memberSince: 'Jan 2023',
  isPremium: true
};

export const currentMeds: Medication[] = [
  {
    id: 'm1',
    name: 'Vitamin D',
    time: '8:00 AM',
    dosage: '1 capsule',
    status: 'taken',
    schedule: 'morning'
  },
  {
    id: 'm2',
    name: 'Lisinopril',
    time: '9:00 PM',
    dosage: '10mg',
    status: 'pending',
    schedule: 'evening'
  }
];

export const familyMembers = [
  {
    id: 'f1',
    name: 'Mom',
    relation: 'Mother',
    status: 'Vitals Normal',
    statusType: 'normal',
    metricIcon: 'Heart',
    metricValue: '75 bpm',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150'
  },
  {
    id: 'f2',
    name: 'Dad',
    relation: 'Father',
    status: 'Meds Taken',
    statusType: 'success',
    metricIcon: 'Activity',
    metricValue: '8,200 steps',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150'
  },
  {
    id: 'f3',
    name: 'Chloe',
    relation: 'Daughter',
    status: 'Resting',
    statusType: 'neutral',
    metricIcon: 'Moon',
    metricValue: '9h sleep',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150'
  }
];
