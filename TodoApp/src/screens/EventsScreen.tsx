import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, Modal, Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getEvents, deleteEvent } from '../storage';
import { Event } from '../types';
import { COLORS, EVENT_COLORS } from '../utils/colors';
import { cancelEventReminders } from '../utils/eventNotifications';
import { error as logError } from '../utils/debug';
import styles from './EventsScreen.styles';

type EventView = 'time' | 'color';
type TimeGrouping = 'day' | 'week' | 'month';
type EventSection = {
  title?: string;
  color?: string;
  data: Event[];
};

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function getTimeSections(events: Event[], grouping: TimeGrouping): EventSection[] {
  const groups = new Map<string, EventSection>();

  for (const event of events) {
    const date = new Date(event.startDate);
    let key: string;
    let title: string;

    if (grouping === 'day') {
      key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      title = date.toLocaleDateString('de-DE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    } else if (grouping === 'week') {
      const weekStart = startOfWeek(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      key = weekStart.toISOString();
      title = `${weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} – ${weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}`;
      title = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      title = title.charAt(0).toLocaleUpperCase('de-DE') + title.slice(1);
    }

    const section = groups.get(key);
    if (section) {
      section.data.push(event);
    } else {
      groups.set(key, { title, data: [event] });
    }
  }

  return [...groups.values()];
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<EventView>('time');
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>('day');
  const [selectedColors, setSelectedColors] = useState<string[] | null>(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    const data = await getEvents();
    setEvents([...data].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    ));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sections: EventSection[] = view === 'time'
    ? getTimeSections(events, timeGrouping)
    : [
        ...EVENT_COLORS,
        ...Array.from(new Set(events.map(event => event.color)))
          .filter(color => !EVENT_COLORS.includes(color))
          .sort(),
      ]
        .filter(color => selectedColors === null || selectedColors.includes(color))
        .map(color => ({
          color,
          data: events.filter(event => event.color === color),
        }))
        .filter(section => section.data.length > 0);

  const availableColors = [
    ...EVENT_COLORS,
    ...Array.from(new Set(events.map(event => event.color)))
      .filter(color => !EVENT_COLORS.includes(color))
      .sort(),
  ];

  const toggleColor = (color: string) => {
    const currentColors = selectedColors ?? availableColors;
    const nextColors = currentColors.includes(color)
      ? currentColors.filter(selected => selected !== color)
      : [...currentColors, color];
    setSelectedColors(
      availableColors.every(available => nextColors.includes(available))
        ? null
        : nextColors
    );
  };

  const colorSelectionLabel = selectedColors === null
    ? 'Farben: Alle'
    : `Farben: ${selectedColors.length} ausgewählt`;

  const handleDelete = (id: string) => {
    Alert.alert('Löschen', 'Termin wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            await deleteEvent(id);
            await cancelEventReminders(id);
            setEvents(prev => prev.filter(e => e.id !== id));
          } catch (e) {
            logError('delete event or cancel reminders failed', e);
            Alert.alert('Fehler', 'Der Termin oder seine Erinnerungen konnten nicht vollständig gelöscht werden.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Termine</Text>
      <View style={styles.tabs} accessibilityRole="tablist">
        <TouchableOpacity
          style={[styles.tab, view === 'time' && styles.tabActive]}
          onPress={() => setView('time')}
          accessibilityRole="tab"
          accessibilityState={{ selected: view === 'time' }}
        >
          <Text style={[styles.tabText, view === 'time' && styles.tabTextActive]}>Zeit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'color' && styles.tabActive]}
          onPress={() => setView('color')}
          accessibilityRole="tab"
          accessibilityState={{ selected: view === 'color' }}
        >
          <Text style={[styles.tabText, view === 'color' && styles.tabTextActive]}>Farbe</Text>
        </TouchableOpacity>
      </View>
      {view === 'time' ? (
        <View style={styles.groupingOptions} accessibilityRole="tablist">
          {([
            ['day', 'Tag'],
            ['week', 'Woche'],
            ['month', 'Monat'],
          ] as const).map(([grouping, label]) => (
            <TouchableOpacity
              key={grouping}
              style={[styles.groupingOption, timeGrouping === grouping && styles.groupingOptionActive]}
              onPress={() => setTimeGrouping(grouping)}
              accessibilityRole="tab"
              accessibilityState={{ selected: timeGrouping === grouping }}
            >
              <Text style={[styles.groupingText, timeGrouping === grouping && styles.groupingTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.colorFilterButton}
          onPress={() => setColorMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Farbauswahl öffnen"
        >
          <Text style={styles.colorFilterText}>{colorSelectionLabel}  ▾</Text>
        </TouchableOpacity>
      )}
      <SectionList
        sections={sections}
        keyExtractor={event => event.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderSectionHeader={({ section }) => (
          section.title ? (
            <View style={styles.timeSectionHeader}>
              <Text style={styles.timeSectionTitle}>{section.title}</Text>
            </View>
          ) : section.color ? (
            <View style={styles.colorSectionHeader}>
              <View
                style={[styles.colorSwatch, { backgroundColor: section.color }]}
                accessibilityLabel={`Farbgruppe ${section.color}`}
              />
              <Text style={styles.colorSectionTitle}>
                {section.data.length} {section.data.length === 1 ? 'Termin' : 'Termine'}
              </Text>
            </View>
          ) : null
        )}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onEdit={() => navigation.navigate('AddEvent', { event: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {events.length === 0
              ? 'Noch keine Termine. Tippe + um loszulegen!'
              : 'Keine Termine für die ausgewählten Farben.'}
          </Text>
        }
      />
      <Modal visible={colorMenuOpen} transparent animationType="fade" onRequestClose={() => setColorMenuOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setColorMenuOpen(false)} />
          <View style={styles.colorMenu}>
            <Text style={styles.menuTitle}>Farben anzeigen</Text>
            <TouchableOpacity
              style={styles.colorOption}
              onPress={() => setSelectedColors(null)}
            >
              <Text style={styles.colorOptionText}>Alle Farben</Text>
              <Text style={styles.checkmark}>{selectedColors === null ? '✓' : ''}</Text>
            </TouchableOpacity>
            {availableColors.map(color => {
              const selected = selectedColors === null || selectedColors.includes(color);
              return (
                <TouchableOpacity
                  key={color}
                  style={styles.colorOption}
                  onPress={() => toggleColor(color)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                >
                  <View style={styles.colorOptionLabel}>
                    <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                    <Text style={styles.colorOptionText}>{color}</Text>
                  </View>
                  <Text style={styles.checkmark}>{selected ? '✓' : ''}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setColorMenuOpen(false)}
            >
              <Text style={styles.closeButtonText}>Fertig</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEvent', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function EventCard({ event, onEdit, onDelete }: { event: Event; onEdit: () => void; onDelete: () => void }) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const isToday = new Date().toDateString() === start.toDateString();
  const isPast = start < new Date() && !isToday;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

  return (
    <View style={[styles.card, { borderLeftColor: event.color }, isPast && styles.cardPast]}>
      <View style={styles.cardTop}>
        <TouchableOpacity
          style={styles.eventContent}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Termin ${event.title} bearbeiten`}
        >
          <View style={styles.dateBlock}>
            <Text style={styles.dateText}>{formatDate(start)}</Text>
            <Text style={styles.timeText}>{formatTime(start)}</Text>
            {end && <Text style={styles.timeEnd}>→ {formatTime(end)}</Text>}
            {event.isOpenEnded && <Text style={styles.openEndedBadge}>Offen</Text>}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{event.title}</Text>
            {event.description ? <Text style={styles.cardDesc}>{event.description}</Text> : null}
            {event.recurrence && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  🔁 {RECURRENCE_LABEL[event.recurrence.frequency]}
                </Text>
              </View>
            )}
            {event.reminders.length > 0 && (
              <Text style={styles.reminderText}>
                🔔 {event.reminders.map(r => r.label).join(', ')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const RECURRENCE_LABEL: Record<string, string> = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  yearly: 'Jährlich',
};
