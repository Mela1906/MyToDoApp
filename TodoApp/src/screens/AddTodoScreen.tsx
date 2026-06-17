import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addTodo, updateTodo } from '../storage';
import { Todo, Subtask, Priority, EnergyLevel } from '../types';
import { COLORS, PRIORITY_COLOR, PRIORITY_LABEL, ENERGY_LABEL } from '../utils/colors';
import { log, error as logError } from '../utils/debug';

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
const ENERGIES: EnergyLevel[] = ['low', 'medium', 'high'];
const COMMON_TAGS = ['@Zuhause', '@Arbeit', '@Unterwegs', '@Einkauf', '@Telefon'];

export default function AddTodoScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const existing: Todo | undefined = route.params?.todo;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [energy, setEnergy] = useState<EnergyLevel>(existing?.energyLevel ?? 'medium');
  const [deadline, setDeadline] = useState<Date | undefined>(
    existing?.deadline ? new Date(existing.deadline) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    existing?.estimatedMinutes?.toString() ?? ''
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(existing?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [tags, setTags] = useState<string[]>(existing?.contextTags ?? []);
  const [customTag, setCustomTag] = useState('');

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: makeId(), title: newSubtask.trim(), completed: false, order: prev.length },
    ]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const addCustomTag = () => {
    const tag = customTag.trim().startsWith('@') ? customTag.trim() : `@${customTag.trim()}`;
    if (!tag || tag === '@') return;
    if (!tags.includes(tag)) setTags(prev => [...prev, tag]);
    setCustomTag('');
  };

  const handleSave = async () => {
    console.log('handleSave called. title:', JSON.stringify(title));
    if (!title.trim()) {
      Alert.alert('Fehler', 'Bitte einen Titel eingeben.');
      return;
    }

    const todo: Todo = {
      id: existing?.id ?? makeId(),
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      energyLevel: energy,
      deadline: deadline ? new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).toISOString() : undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      completed: existing?.completed ?? false,
      completedAt: existing?.completedAt,
      subtasks,
      contextTags: tags,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    try {
      log('handleSave todo:', todo.id, todo.title);
      if (existing) {
        await updateTodo(todo);
        Alert.alert('Erfolg', 'Todo aktualisiert!');
      } else {
        await addTodo(todo);
        Alert.alert('Erfolg', 'Todo erstellt!');
      }
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (e) {
      logError('handleSave failed:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      Alert.alert('Fehler beim Speichern', errorMsg || 'Bitte erneut versuchen.');
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{existing ? 'Todo bearbeiten' : 'Neues Todo'}</Text>

      <Label text="Titel *" />
      <TextInput
        style={styles.input}
        placeholder="Was möchtest du erledigen?"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={COLORS.subtext}
      />

      <Label text="Beschreibung" />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Optionale Details..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        placeholderTextColor={COLORS.subtext}
      />

      <Label text="Priorität" />
      <View style={styles.chipRow}>
        {PRIORITIES.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, { borderColor: PRIORITY_COLOR[p] }, priority === p && { backgroundColor: PRIORITY_COLOR[p] }]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
              {PRIORITY_LABEL[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Label text="Energie-Level" />
      <View style={styles.chipRow}>
        {ENERGIES.map(e => (
          <TouchableOpacity
            key={e}
            style={[styles.chip, energy === e && styles.chipSelected]}
            onPress={() => setEnergy(e)}
          >
            <Text style={[styles.chipText, energy === e && styles.chipTextActive]}>
              {ENERGY_LABEL[e]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Label text="Deadline (optional)" />
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: deadline ? COLORS.text : COLORS.subtext, fontSize: 15 }}>
          {deadline ? deadline.toLocaleDateString('de-DE') : 'Datum wählen...'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={deadline || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Label text="Zeitschätzung (Minuten)" />
      <TextInput
        style={styles.input}
        placeholder="z.B. 30"
        value={estimatedMinutes}
        onChangeText={setEstimatedMinutes}
        keyboardType="numeric"
        placeholderTextColor={COLORS.subtext}
      />

      <Label text="Kontext-Tags" />
      <View style={styles.chipRow}>
        {COMMON_TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[styles.chip, tags.includes(tag) && styles.chipSelected]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={[styles.chipText, tags.includes(tag) && styles.chipTextActive]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Benutzerdefinierte Tags anzeigen */}
      {tags.filter(t => !COMMON_TAGS.includes(t)).length > 0 && (
        <View style={styles.chipRow}>
          {tags.filter(t => !COMMON_TAGS.includes(t)).map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, styles.chipSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.chipText, styles.chipTextActive]}>
                {tag} ✕
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Eigener Tag (@...)"
          value={customTag}
          onChangeText={setCustomTag}
          placeholderTextColor={COLORS.subtext}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addCustomTag}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Label text="Unteraufgaben" />
      {subtasks.map((sub, i) => (
        <View key={sub.id} style={styles.subtaskRow}>
          <Text style={styles.subtaskNum}>{i + 1}.</Text>
          <Text style={styles.subtaskText}>{sub.title}</Text>
          <TouchableOpacity onPress={() => removeSubtask(sub.id)}>
            <Text style={styles.removeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Unteraufgabe hinzufügen..."
          value={newSubtask}
          onChangeText={setNewSubtask}
          onSubmitEditing={addSubtask}
          placeholderTextColor={COLORS.subtext}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addSubtask}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{existing ? 'Speichern' : 'Todo erstellen'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 48, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.subtext, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, width: 48, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtaskRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border,
  },
  subtaskNum: { color: COLORS.subtext, marginRight: 8, fontSize: 14 },
  subtaskText: { flex: 1, fontSize: 14, color: COLORS.text },
  removeBtn: { color: COLORS.danger, fontSize: 16, padding: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 32,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
