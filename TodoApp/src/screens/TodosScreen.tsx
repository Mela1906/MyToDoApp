import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getTodos, updateTodo, deleteTodo } from '../storage';
import { Todo, SortMode } from '../types';
import { sortTodos, formatDeadline, isOverdue } from '../utils/sort';
import { COLORS, PRIORITY_COLOR, PRIORITY_LABEL, ENERGY_LABEL } from '../utils/colors';

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: 'Priorität', value: 'priority' },
  { label: 'Deadline', value: 'deadline' },
  { label: 'Priorität + Deadline', value: 'priority_deadline' },
];

export default function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('priority_deadline');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    const data = await getTodos();
    setTodos(sortTodos(data, sortMode));
  }, [sortMode]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleComplete = async (todo: Todo) => {
    const updated: Todo = {
      ...todo,
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date().toISOString() : undefined,
    };
    await updateTodo(updated);
    setTodos(prev => sortTodos(prev.map(t => t.id === todo.id ? updated : t), sortMode));
  };

  const toggleSubtask = async (todo: Todo, subtaskId: string) => {
    const updated: Todo = {
      ...todo,
      subtasks: todo.subtasks.map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
    };
    await updateTodo(updated);
    setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
  };

  const handleDelete = (id: string) => {
    Alert.alert('Löschen', 'Todo wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive', onPress: async () => {
          await deleteTodo(id);
          setTodos(prev => prev.filter(t => t.id !== id));
        },
      },
    ]);
  };

  const applySort = (mode: SortMode) => {
    setSortMode(mode);
    setTodos(prev => sortTodos(prev, mode));
    setSortMenuOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.screenTitle}>Todos</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortMenuOpen(true)}>
          <Text style={styles.sortBtnText}>
            Sortierung: {SORT_OPTIONS.find(s => s.value === sortMode)?.label}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={t => t.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TodoCard
            todo={item}
            onToggle={() => toggleComplete(item)}
            onToggleSubtask={(sid) => toggleSubtask(item, sid)}
            onEdit={() => navigation.navigate('AddTodo', { todo: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Todos. Tippe + um loszulegen!</Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTodo', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={sortMenuOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setSortMenuOpen(false)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Sortieren nach</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.menuItem, sortMode === opt.value && styles.menuItemActive]}
                onPress={() => applySort(opt.value)}
              >
                <Text style={[styles.menuItemText, sortMode === opt.value && styles.menuItemTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

interface TodoCardProps {
  todo: Todo;
  onToggle: () => void;
  onToggleSubtask: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TodoCard({ todo, onToggle, onToggleSubtask, onEdit, onDelete }: TodoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const completedSubs = todo.subtasks.filter(s => s.completed).length;
  const progress = todo.subtasks.length > 0 ? completedSubs / todo.subtasks.length : null;

  return (
    <View style={[styles.card, todo.completed && styles.cardDone]}>
      <View style={styles.cardRow}>
        <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
          <Text style={styles.checkboxText}>{todo.completed ? '✅' : '⬜'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardContent} onPress={() => setExpanded(!expanded)}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, todo.completed && styles.strikethrough]} numberOfLines={2}>
              {todo.title}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[todo.priority] }]}>
              <Text style={styles.priorityText}>{PRIORITY_LABEL[todo.priority]}</Text>
            </View>
          </View>

          {todo.deadline && (
            <Text style={[styles.deadline, isOverdue(todo.deadline) && !todo.completed && styles.overdue]}>
              📅 {formatDeadline(todo.deadline)}
            </Text>
          )}

          {todo.contextTags.length > 0 && (
            <View style={styles.tags}>
              {todo.contextTags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {progress !== null && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
              <Text style={styles.progressText}>{completedSubs}/{todo.subtasks.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Text>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {expanded && todo.subtasks.length > 0 && (
        <View style={styles.subtasks}>
          {todo.subtasks.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subtaskRow}
              onPress={() => onToggleSubtask(sub.id)}
            >
              <Text style={styles.subtaskCheck}>{sub.completed ? '✅' : '⬜'}</Text>
              <Text style={[styles.subtaskText, sub.completed && styles.strikethrough]}>
                {sub.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
  },
  screenTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  sortBtn: {
    backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sortBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
    padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardDone: { opacity: 0.55 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 10, marginTop: 2 },
  checkboxText: { fontSize: 20 },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.subtext },
  priorityBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  priorityText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  deadline: { fontSize: 13, color: COLORS.subtext, marginTop: 4 },
  overdue: { color: COLORS.danger, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  tag: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 12, color: COLORS.primary },
  progressContainer: {
    height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 8, overflow: 'hidden',
  },
  progressBar: { height: 6, backgroundColor: COLORS.success, borderRadius: 3 },
  progressText: { position: 'absolute', right: 0, top: -16, fontSize: 11, color: COLORS.subtext },
  cardActions: { marginLeft: 8, gap: 4 },
  actionBtn: { padding: 4 },
  subtasks: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  subtaskCheck: { fontSize: 16, marginRight: 8 },
  subtaskText: { fontSize: 14, color: COLORS.text, flex: 1 },
  empty: { textAlign: 'center', color: COLORS.subtext, marginTop: 60, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menu: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20, width: 280,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  menuTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4 },
  menuItemActive: { backgroundColor: '#EEF2FF' },
  menuItemText: { fontSize: 15, color: COLORS.text },
  menuItemTextActive: { color: COLORS.primary, fontWeight: '700' },
});
