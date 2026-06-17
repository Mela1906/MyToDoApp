import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Todo, Category } from '../types';
import { log, error } from '../utils/debug';

const KEYS = {
  events: '@mytodo_events',
  todos: '@mytodo_todos',
  categories: '@mytodo_categories',
};

// --- Events ---
export async function getEvents(): Promise<Event[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.events);
    const result = raw ? (JSON.parse(raw) as Event[]) : [];
    log('getEvents →', result.length, 'items');
    return result;
  } catch (e) {
    error('getEvents failed', e);
    return [];
  }
}

export async function saveEvents(events: Event[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.events, JSON.stringify(events));
    log('saveEvents ✓', events.length, 'items');
  } catch (e) {
    error('saveEvents failed', e);
    throw e;
  }
}

export async function addEvent(event: Event): Promise<void> {
  log('addEvent →', event.id, event.title);
  const events = await getEvents();
  await saveEvents([...events, event]);
}

export async function updateEvent(updated: Event): Promise<void> {
  log('updateEvent →', updated.id);
  const events = await getEvents();
  await saveEvents(events.map(e => (e.id === updated.id ? updated : e)));
}

export async function deleteEvent(id: string): Promise<void> {
  log('deleteEvent →', id);
  const events = await getEvents();
  await saveEvents(events.filter(e => e.id !== id));
}

// --- Todos ---
export async function getTodos(): Promise<Todo[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.todos);
    const result = raw ? (JSON.parse(raw) as Todo[]) : [];
    log('getTodos →', result.length, 'items');
    return result;
  } catch (e) {
    error('getTodos failed', e);
    return [];
  }
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.todos, JSON.stringify(todos));
    log('saveTodos ✓', todos.length, 'items');
  } catch (e) {
    error('saveTodos failed', e);
    throw e;
  }
}

export async function addTodo(todo: Todo): Promise<void> {
  log('addTodo →', todo.id, todo.title);
  const todos = await getTodos();
  await saveTodos([...todos, todo]);
}

export async function updateTodo(updated: Todo): Promise<void> {
  log('updateTodo →', updated.id);
  const todos = await getTodos();
  await saveTodos(todos.map(t => (t.id === updated.id ? updated : t)));
}

export async function deleteTodo(id: string): Promise<void> {
  log('deleteTodo →', id);
  const todos = await getTodos();
  await saveTodos(todos.filter(t => t.id !== id));
}

// --- Categories ---
export async function getCategories(): Promise<Category[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.categories);
    return raw ? (JSON.parse(raw) as Category[]) : defaultCategories;
  } catch (e) {
    error('getCategories failed', e);
    return defaultCategories;
  }
}

export async function saveCategories(categories: Category[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.categories, JSON.stringify(categories));
  } catch (e) {
    error('saveCategories failed', e);
    throw e;
  }
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Privat', color: '#6C63FF', icon: '🏠' },
  { id: '2', name: 'Arbeit', color: '#FF6584', icon: '💼' },
  { id: '3', name: 'Gesundheit', color: '#43D39E', icon: '💪' },
  { id: '4', name: 'Einkaufen', color: '#F7B731', icon: '🛒' },
];
