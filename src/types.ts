export interface Student {
  nombre: string;
  personalidad?: string;
  notas?: string;
}

export interface SavedComment {
  id: string;
  name: string;
  comment: string;
  date: string;
  gender?: string;
  academics?: string[];
  personals?: string[];
  challenges?: string[];
}

export type AppView = 'dashboard' | 'upload' | 'selectStudent' | 'form' | 'edit' | 'print';

export interface FormSelection {
  studentName: string;
  gender: 'masculino' | 'femenino' | 'neutro';
  selectedAcademics: string[];
  selectedPersonals: string[];
  selectedChallenges: string[];
  tone: string;
}
