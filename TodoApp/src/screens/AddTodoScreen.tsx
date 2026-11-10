import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addTodo, updateTodo } from '../storage';
import { Todo, Subtask, EnergyLevel } from '../types';
import { COLORS, ENERGY_LABEL } from '../utils/colors';
import { log, error as logError } from '../utils/debug';
import styles from './AddTodoScreen.styles';

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const ENERGIES: EnergyLevel[] = ['low', 'medium', 'high'];
const COMMON_TAGS = ['@Zuhause', '@Arbeit', '@Unterwegs', '@Einkauf', '@Telefon'];

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export default function AddTodoScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const existing: Todo | undefined = route.params?.todo;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
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

    if (!deadline) {
      Alert.alert('Deadline fehlt', 'Wann soll die Aufgabe fertig sein?', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Datum wählen', onPress: () => setShowDatePicker(true) },
      ]);
      return;
    }

    const todo: Todo = {
      id: existing?.id ?? makeId(),
      title: title.trim(),
      description: description.trim() || undefined,
      energyLevel: energy,
      deadline: new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).toISOString(),
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

      <Label text="Deadline *" />
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
          value={deadline ?? startOfToday()}
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
