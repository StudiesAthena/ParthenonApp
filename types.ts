
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
  subject?: string;
  isSyncedWithGoogle?: boolean;
  isRecurring?: boolean;
  recurrenceDay?: number;
}

export interface Subject {
  name: string;
  color: string;
}

export interface DayData {
  commitments: Commitment[];
  tasks: Task[];
  studyMinutes: number;
}

export type CalendarData = Record<string, DayData>;

/**
 * Defines the available view modes for the Calendar component.
 */
export type ViewMode = 'month' | 'week' | 'agenda';

export interface SubjectProgress {
  id: string;
  subjectName: string;
  startDate: string;
  endDate?: string;
  status: 'Em andamento' | 'Concluída' | 'Pausada';
  notes_progresso: string;
  topics: string[];
}

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
  created_by_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  full_name?: string;
  joined_at: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  instructions: string;
  owner_id: string;
}

export interface AppState {
  calendar: CalendarData;
  subjects: Subject[];
  generalNotes: string;
  subjectProgress: SubjectProgress[];
  recurringTasks: Task[];
  recurringCommitments: Commitment[];
  globalDailyGoal: number;
  userEmail: string;
  userName?: string;
}
