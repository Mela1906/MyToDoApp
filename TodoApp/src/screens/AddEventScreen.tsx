import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';

// FIX: DateTimePickerEvent mit importieren, damit die onChange-Events sauber typisiert sind
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { useNavigation, useRoute } from '@react-navigation/native';
import { addEvent, updateEvent } from '../storage';
import { Event, Reminder, Recurrence, RecurrenceFrequency } from '../types';
import { COLORS, EVENT_COLORS } from '../utils/colors';
import { log, error as logError } from '../utils/debug';
import { syncEventReminders } from '../utils/eventNotifications';
import styles from './AddEventScreen.styles';

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

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>(
    existing?.startDate ? new Date(existing.startDate) : undefined
  );

  const [endDate, setEndDate] = useState<Date | undefined>(
    existing?.endDate ? new Date(existing.endDate) : undefined
  );

  const [isOpenEnded, setIsOpenEnded] = useState(
    existing?.isOpenEnded ?? false
  );

  const [color, setColor] = useState(existing?.color ?? EVENT_COLORS[0]);

  const [reminders, setReminders] = useState<Reminder[]>(
    existing?.reminders ?? []
  );

  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(
    existing?.recurrence
  );

  const toggleReminder = (minutes: number, label: string) => {
    const exists = reminders.find(r => r.minutesBefore === minutes);

    if (exists) {
      setReminders(prev =>
        prev.filter(r => r.minutesBefore !== minutes)
      );
    } else {
      setReminders(prev => [
        ...prev,
        {
          id: makeId(),
          minutesBefore: minutes,
          label,
        },
      ]);
    }
  };

  const toggleRecurrence = (freq: RecurrenceFrequency) => {
    if (recurrence?.frequency === freq) {
      setRecurrence(undefined);
    } else {
      setRecurrence({
        frequency: freq,
        interval: 1,
      });
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
      startDate: startDate.toISOString(),
      endDate: !isOpenEnded && endDate ? endDate.toISOString() : undefined,
      isOpenEnded,
      reminders,
      recurrence,
      color,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    try {
      log('handleSave event:', event.id, event.title);

      if (existing) {
        await updateEvent(event);
      } else {
        await addEvent(event);
      }
    } catch (e) {
      logError('handleSave event failed', e);
      Alert.alert(
        'Fehler',
        'Speichern fehlgeschlagen. Bitte erneut versuchen.'
      );
      return;
    }

    try {
      await syncEventReminders(event.reminders.length > 0);
      navigation.goBack();
    } catch (e) {
      logError('event reminder scheduling failed', e);
      const errorMessage =
        e instanceof Error ? e.message : 'Bitte prüfe die Benachrichtigungseinstellungen.';
      Alert.alert(
        'Termin gespeichert',
        `Der Termin wurde gespeichert, aber die Erinnerung konnte nicht eingerichtet werden. ${errorMessage}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  // FIX: vorher war event:any. Jetzt sauber typisiert.
  // FIX: wenn Android-DatePicker abgebrochen wird, kommt event.type === 'dismissed'.
  // Dann darf nichts gesetzt werden.
  const handleStartDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowStartDatePicker(false);

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    const updated = new Date(startDate || new Date());

    updated.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    setStartDate(updated);
  };

  // FIX: gleiche Sicherheit für Start-Uhrzeit
  const handleStartTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    setShowStartTimePicker(false);

    if (event.type === 'dismissed' || !selectedTime) {
      return;
    }

    const updated = new Date(startDate || new Date());

    updated.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );

    setStartDate(updated);
  };

  // FIX: gleiche Sicherheit für Enddatum
  const handleEndDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowEndDatePicker(false);

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    const updated = new Date(endDate || startDate || new Date());

    updated.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    setEndDate(updated);
  };

  // FIX: gleiche Sicherheit für End-Uhrzeit
  const handleEndTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    setShowEndTimePicker(false);

    if (event.type === 'dismissed' || !selectedTime) {
      return;
    }

    const updated = new Date(endDate || startDate || new Date());

    updated.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );

    setEndDate(updated);
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>
        {existing ? 'Termin bearbeiten' : 'Neuer Termin'}
      </Text>

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
            style={[
              styles.colorDot,
              { backgroundColor: c },
              color === c && styles.colorDotSelected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <Label text="Startdatum und -uhrzeit *" />

      {/* FIX: styles.row wird hier benutzt */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.input, { flex: 1 }]}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text
            style={{
              color: startDate ? COLORS.text : COLORS.subtext,
              fontSize: 15,
            }}
          >
            {startDate
              ? startDate.toLocaleDateString('de-DE')
              : 'Datum...'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.input, { flex: 1, marginLeft: 8 }]}
          onPress={() => setShowStartTimePicker(true)}
        >
          <Text
            style={{
              color: startDate ? COLORS.text : COLORS.subtext,
              fontSize: 15,
            }}
          >
            {startDate
              ? startDate.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Uhrzeit...'}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="time"
          display="default"
          onChange={handleStartTimeChange}
        />
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
          Offenes Ende (kein festes Enddatum)
        </Text>

        <Switch
          value={isOpenEnded}
          onValueChange={setIsOpenEnded}
          trackColor={{ true: COLORS.primary }}
        />
      </View>

      {!isOpenEnded && (
        <>
          <Label text="Enddatum und -uhrzeit (optional)" />

          {/* FIX: styles.row wird auch hier benutzt */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, { flex: 1 }]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text
                style={{
                  color: endDate ? COLORS.text : COLORS.subtext,
                  fontSize: 15,
                }}
              >
                {endDate
                  ? endDate.toLocaleDateString('de-DE')
                  : 'Datum...'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text
                style={{
                  color: endDate ? COLORS.text : COLORS.subtext,
                  fontSize: 15,
                }}
              >
                {endDate
                  ? endDate.toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Uhrzeit...'}
              </Text>
            </TouchableOpacity>
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={endDate || startDate || new Date()}
              mode="time"
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </>
      )}

      <Label text="Erinnerungen" />

      <View style={styles.chipRow}>
        {REMINDER_PRESETS.map(r => {
          const active = reminders.some(
            rem => rem.minutesBefore === r.minutes
          );

          return (
            <TouchableOpacity
              key={r.minutes}
              style={[
                styles.chip,
                active && styles.chipSelected,
              ]}
              onPress={() => toggleReminder(r.minutes, r.label)}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                ]}
              >
                {r.label}
              </Text>
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
              style={[
                styles.chip,
                active && styles.chipSelected,
              ]}
              onPress={() => toggleRecurrence(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {recurrence && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔁 Termin wiederholt sich{' '}
            {RECURRENCE_OPTIONS.find(
              o => o.value === recurrence.frequency
            )?.label.toLowerCase()}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>
          {existing ? 'Speichern' : 'Termin erstellen'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}