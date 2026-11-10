export type EnergyLevel = 'low' | 'medium' | 'high';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Reminder {
  id: string;
  minutesBefore: number;
  label: string; // z.B. "30 Minuten vorher"
}

export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number; // jede N-te Einheit
  endDate?: string; // ISO string, optional
  endAfterOccurrences?: number;
  daysOfWeek?: number[]; // 0=So, 1=Mo, ... 6=Sa
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate?: string;  // ISO string, optional (open-ended)
  isOpenEnded: boolean;
  reminders: Reminder[];
  recurrence?: Recurrence;
  categoryId?: string;
  color: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  energyLevel: EnergyLevel;
  deadline: string; // ISO string
  estimatedMinutes?: number;
  completed: boolean;
  completedAt?: string;
  subtasks: Subtask[];
  contextTags: string[]; // z.B. ['@Zuhause', '@Arbeit']
  dependsOn?: string[]; // IDs anderer Todos
  categoryId?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}
