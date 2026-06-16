import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addEvent, updateEvent } from '../storage';
import { Event, Reminder, Recurrence, RecurrenceFrequency } from '../types';
import { COLORS, EVENT_COLORS } from '../utils/colors';

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const REMINDER_PRESETS: { label: string; minutes: number }[] = [
  { label: '5 Min vorher', minutes: 5 },
  { label: '15 Min vorher', minutes: 15 },
  { label: '30 Min vorher', minutes: 30 },
  { label: '1 Std vorher', minutes: 60 },
  { label: '2 Std vorher', minutes: 120 },
  { label: '1 Tag vorher', minutes: 1440 },
];

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceFrequency }[] = [
  { label: 'Täglich', value: 'daily' },
  { label: 'Wöchentlich', value: 'weekly' },
  { label: 'Monatlich', value: 'monthly' },
  { label: 'Jährlich', value: 'yearly' },
];

export default function AddEventScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const existing: Event | undefined = route.params?.event;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [startDate, setStartDate] = useState(
    existing?.startDate
      ? existing.startDate.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(existing?.endDate ? existing.endDate.slice(0, 16) : '');
  const [isOpenEnded, setIsOpenEnded] = useState(existing?.isOpenEnded ?? false);
  const [color, setColor] = useState(existing?.color ?? EVENT_COLORS[0]);
  const [reminders, setReminders] = useState<Reminder[]>(existing?.reminders ?? []);
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(existing?.recurrence);

  const toggleReminder = (minutes: number, label: string) => {
    const exists = reminders.find(r => r.minutesBefore === minutes);
    if (exists) {
      setReminders(prev => prev.filter(r => r.minutesBefore !== minutes));
    } else {
      setReminders(prev => [...prev, { id: makeId(), minutesBefore: minutes, label }]);
    }
  };

  const toggleRecurrence = (freq: RecurrenceFrequency) => {
    if (recurrence?.frequency === freq) {
      setRecurrence(undefined);
    } else {
      setRecurrence({ frequency: freq, interval: 1 });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Fehler', 'Bitte einen Titel eingeben.');
      return;
    }
    if (!startDate) {
      Alert.alert('Fehler', 'Bitte ein Startdatum wählen.');
      return;
    }

    const event: Event = {
      id: existing?.id ?? makeId(),
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: !isOpenEnded && endDate ? new Date(endDate).toISOString() : undefined,
      isOpenEnded,
      reminders,
      recurrence,
      color,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (existing) {
      await updateEvent(event);
    } else {
      await addEvent(event);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{existing ? 'Termin bearbeiten' : 'Neuer Termin'}</Text>

      <Label text="Titel *" />
      <TextInput
        style={styles.input}
        placeholder="Terminbezeichnung..."
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

      <Label text="Farbe" />
      <View style={styles.colorRow}>
        {EVENT_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <Label text="Startdatum und -uhrzeit *" />
      <TextInput
        style={styles.input}
        placeholder="JJJJ-MM-TTHH:MM"
        value={startDate}
        onChangeText={setStartDate}
        placeholderTextColor={COLORS.subtext}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Offenes Ende (kein festes Enddatum)</Text>
        <Switch
          value={isOpenEnded}
          onValueChange={setIsOpenEnded}
          trackColor={{ true: COLORS.primary }}
        />
      </View>

      {!isOpenEnded && (
        <>
          <Label text="Enddatum und -uhrzeit (optional)" />
          <TextInput
            style={styles.input}
            placeholder="JJJJ-MM-TTHH:MM"
            value={endDate}
            onChangeText={setEndDate}
            placeholderTextColor={COLORS.subtext}
          />
        </>
      )}

      <Label text="Erinnerungen" />
      <View style={styles.chipRow}>
        {REMINDER_PRESETS.map(r => {
          const active = reminders.some(rem => rem.minutesBefore === r.minutes);
          return (
            <TouchableOpacity
              key={r.minutes}
              style={[styles.chip, active && styles.chipSelected]}
              onPress={() => toggleReminder(r.minutes, r.label)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Label text="Wiederholung" />
      <View style={styles.chipRow}>
        {RECURRENCE_OPTIONS.map(opt => {
          const active = recurrence?.frequency === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipSelected]}
              onPress={() => toggleRecurrence(opt.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {recurrence && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔁 Termin wiederholt sich {RECURRENCE_OPTIONS.find(o => o.value === recurrence.frequency)?.label.toLowerCase()}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{existing ? 'Speichern' : 'Termin erstellen'}</Text>
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
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotSelected: { borderWidth: 3, borderColor: COLORS.text },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  switchLabel: { fontSize: 15, color: COLORS.text, flex: 1, marginRight: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  infoBox: {
    backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, marginTop: 10,
  },
  infoText: { color: COLORS.primary, fontSize: 14 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 32,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
