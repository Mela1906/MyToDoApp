import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Modal, Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getTodos, updateTodo, deleteTodo } from '../storage';
import { EnergyLevel, Todo } from '../types';
import { sortTodos, formatDeadline, formatDuration, isOverdue, TodoSortMode } from '../utils/sort';
import { COLORS, ENERGY_LABEL } from '../utils/colors';
import styles from './TodosScreen.styles';

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
