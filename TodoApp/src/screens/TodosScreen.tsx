import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getTodos, updateTodo, deleteTodo } from '../storage';
import { EnergyLevel, Todo } from '../types';
import { sortTodos, formatDeadline, formatDuration, isOverdue, TodoSortMode } from '../utils/sort';
import { COLORS, ENERGY_LABEL } from '../utils/colors';

const SORT_OPTIONS: { label: string; value: TodoSortMode }[] = [
  { label: 'Deadline', value: 'deadline' },
  { label: 'Zeiteinschätzung', value: 'estimatedMinutes' },
  { label: 'Energie-Level', value: 'energyLevel' },
];

const ENERGY_COLOR: Record<EnergyLevel, string> = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.danger,
};

export default function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sortMode, setSortMode] = useState<TodoSortMode>('deadline');
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

  const applySort = (mode: TodoSortMode) => {
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
            Sortierung: {SORT_OPTIONS.find(option => option.value === sortMode)?.label}
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
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.menuItem, sortMode === option.value && styles.menuItemActive]}
                onPress={() => applySort(option.value)}
              >
                <Text style={[styles.menuItemText, sortMode === option.value && styles.menuItemTextActive]}>
                  {option.label}
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
  const deadlineDate = new Date(todo.deadline);

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: ENERGY_COLOR[todo.energyLevel] },
        todo.completed && styles.cardDone,
      ]}
    >
      <View style={styles.cardRow}>
        <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
          <Text style={styles.checkboxText}>{todo.completed ? '✅' : '⬜'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardContent} onPress={onEdit}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateDay}>{deadlineDate.toLocaleDateString('de-DE', { day: '2-digit' })}</Text>
            <Text style={styles.dateMonth}>{deadlineDate.toLocaleDateString('de-DE', { month: 'short' })}</Text>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, todo.completed && styles.strikethrough]} numberOfLines={2}>
              {todo.title}
            </Text>
            <Text style={[styles.deadline, isOverdue(todo.deadline) && !todo.completed && styles.overdue]}>
              {formatDeadline(todo.deadline)}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>⏱ {formatDuration(todo.estimatedMinutes)}</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: `${ENERGY_COLOR[todo.energyLevel]}20` }]}>
                <Text style={[styles.metaText, { color: ENERGY_COLOR[todo.energyLevel] }]}>
                  ⚡ {ENERGY_LABEL[todo.energyLevel]}
                </Text>
              </View>
            </View>

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
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          {todo.subtasks.length > 0 && (
            <TouchableOpacity
              onPress={() => setExpanded(value => !value)}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Unteraufgaben ausblenden' : 'Unteraufgaben anzeigen'}
            >
              <Text>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          )}
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
    padding: 14, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardDone: { opacity: 0.55 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 10, marginTop: 2 },
  checkboxText: { fontSize: 20 },
  cardContent: { flex: 1, flexDirection: 'row', gap: 12 },
  dateBlock: {
    width: 48, minHeight: 54, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border, paddingRight: 8,
  },
  dateDay: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  dateMonth: { fontSize: 12, fontWeight: '600', color: COLORS.subtext, textTransform: 'capitalize' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.subtext },
  deadline: { fontSize: 13, color: COLORS.subtext, marginTop: 4, textTransform: 'capitalize' },
  overdue: { color: COLORS.danger, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaChip: {
    backgroundColor: COLORS.bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  metaText: { fontSize: 12, fontWeight: '600', color: COLORS.subtext },
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
