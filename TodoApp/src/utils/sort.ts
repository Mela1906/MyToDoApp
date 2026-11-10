import { EnergyLevel, Todo } from '../types';

export type TodoSortMode = 'deadline' | 'estimatedMinutes' | 'energyLevel';

const ENERGY_WEIGHT: Record<EnergyLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function compareOptionalNumbers(a?: number, b?: number): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
}

function compareDeadlines(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}

export function sortTodos(todos: Todo[], mode: TodoSortMode = 'deadline'): Todo[] {
  const open = todos.filter(t => !t.completed);
  const done = todos.filter(t => t.completed);
  const sorted = [...open].sort((a, b) => {
    if (mode === 'energyLevel') {
      return (
        ENERGY_WEIGHT[a.energyLevel] - ENERGY_WEIGHT[b.energyLevel] ||
        compareDeadlines(a.deadline, b.deadline) ||
        compareOptionalNumbers(a.estimatedMinutes, b.estimatedMinutes)
      );
    }

    if (mode === 'estimatedMinutes') {
      return (
        compareOptionalNumbers(a.estimatedMinutes, b.estimatedMinutes) ||
        compareDeadlines(a.deadline, b.deadline) ||
        ENERGY_WEIGHT[a.energyLevel] - ENERGY_WEIGHT[b.energyLevel]
      );
    }

    return (
      compareDeadlines(a.deadline, b.deadline) ||
      compareOptionalNumbers(a.estimatedMinutes, b.estimatedMinutes) ||
      ENERGY_WEIGHT[a.energyLevel] - ENERGY_WEIGHT[b.energyLevel]
    );
  });

  return [...sorted, ...done];
}

export function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Überfällig';
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';
  if (diffDays <= 7) return `In ${diffDays} Tagen`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function formatDuration(minutes?: number): string {
  if (minutes === undefined) return 'Nicht geschätzt';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${minutes} Min.`;
  if (remainingMinutes === 0) return `${hours} Std.`;
  return `${hours} Std. ${remainingMinutes} Min.`;
}

export function isOverdue(deadline: string): boolean {
  return new Date(deadline).getTime() < Date.now();
}
