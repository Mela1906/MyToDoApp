import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Todo, Category } from '../types';

const KEYS = {
  events: '@mytodo_events',
  todos: '@mytodo_todos',
  categories: '@mytodo_categories',
};

// --- Events ---
export async function getEvents(): Promise<Event[]> {
  const raw = await AsyncStorage.getItem(KEYS.events);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEvents(events: Event[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.events, JSON.stringify(events));
}

export async function addEvent(event: Event): Promise<void> {
  const events = await getEvents();
  await saveEvents([...events, event]);
}

export async function updateEvent(updated: Event): Promise<void> {
  const events = await getEvents();
  await saveEvents(events.map(e => (e.id === updated.id ? updated : e)));
}

export async function deleteEvent(id: string): Promise<void> {
  const events = await getEvents();
  await saveEvents(events.filter(e => e.id !== id));
}

// --- Todos ---
export async function getTodos(): Promise<Todo[]> {
  const raw = await AsyncStorage.getItem(KEYS.todos);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.todos, JSON.stringify(todos));
}

export async function addTodo(todo: Todo): Promise<void> {
  const todos = await getTodos();
  await saveTodos([...todos, todo]);
}

export async function updateTodo(updated: Todo): Promise<void> {
  const todos = await getTodos();
  await saveTodos(todos.map(t => (t.id === updated.id ? updated : t)));
}

export async function deleteTodo(id: string): Promise<void> {
  const todos = await getTodos();
  await saveTodos(todos.filter(t => t.id !== id));
}

// --- Categories ---
export async function getCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(KEYS.categories);
  return raw ? JSON.parse(raw) : defaultCategories;
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.categories, JSON.stringify(categories));
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Privat', color: '#6C63FF', icon: '🏠' },
  { id: '2', name: 'Arbeit', color: '#FF6584', icon: '💼' },
  { id: '3', name: 'Gesundheit', color: '#43D39E', icon: '💪' },
  { id: '4', name: 'Einkaufen', color: '#F7B731', icon: '🛒' },
];
