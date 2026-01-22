
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  subject: string;
  isRecurring?: boolean;
  recurrenceDay?: number;
}

export interface Commitment {
  id: string;
  text: string;
  time: string;
  isSyncedWithGoogle?: boolean;
  isRecurring?: boolean;
  recurrenceDay?: number;
}

export interface DayData {
  commitments: Commitment[];
  tasks: Task[];
  studyMinutes: number;
  meta_tempo_minutos?: number;
  isSyncedWithGoogle?: boolean;
}

export type CalendarData = Record<string, DayData>;

export interface SubjectProgress {
  id: string;
  subjectName: string;
  startDate: string;
  endDate?: string;
  status: 'Em andamento' | 'Concluída' | 'Pausada';
  notes_progresso: string;
  topics: string[];
}

export type ViewMode = 'month' | 'week' | 'agenda';

// Interfaces para Turmas
export interface GroupFile {
  id: string;
  name: string;
  url: string;
  uploaded_by: string;
  created_at: string;
  group_id: string;
  activity_id?: string;
  size?: number;
}

export interface GroupActivity {
  id: string;
  group_id: string;
  name: string;
  instructions: string;
  created_by: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  instructions: string;
  created_by: string;
}

export interface AppState {
  calendar: CalendarData;
  subjects: string[];
  generalNotes: string;
  subjectProgress: SubjectProgress[];
  recurringTasks: Task[];
  recurringCommitments: Commitment[];
  globalDailyGoal: number;
  userEmail: string;
}
