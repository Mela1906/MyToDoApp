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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screenTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.border, borderRadius: 12, padding: 3,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  tabActive: { backgroundColor: COLORS.card },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.subtext },
  tabTextActive: { color: COLORS.primary },
  groupingOptions: {
    flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12,
  },
  groupingOption: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  groupingOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  groupingText: { fontSize: 13, fontWeight: '600', color: COLORS.subtext },
  groupingTextActive: { color: '#fff' },
  colorFilterButton: {
    alignSelf: 'flex-start', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.card, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  colorFilterText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  timeSectionHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  timeSectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  colorSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  colorSwatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  colorSectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.subtext },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', padding: 24,
  },
  colorMenu: {
    width: '100%', maxHeight: '80%', backgroundColor: COLORS.card,
    borderRadius: 16, padding: 20,
  },
  menuTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  colorOption: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 8,
  },
  colorOptionLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorOptionText: { fontSize: 15, color: COLORS.text },
  checkmark: { fontSize: 18, fontWeight: '700', color: COLORS.primary, minWidth: 24, textAlign: 'center' },
  closeButton: {
    marginTop: 12, alignItems: 'center', backgroundColor: COLORS.primary,
    paddingVertical: 12, borderRadius: 10,
  },
  closeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
    padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardPast: { opacity: 0.5 },
  cardTop: { flexDirection: 'row' },
  eventContent: { flex: 1, flexDirection: 'row' },
  dateBlock: { marginRight: 12, minWidth: 70, alignItems: 'flex-start' },
  dateText: { fontSize: 13, color: COLORS.subtext, fontWeight: '600' },
  timeText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  timeEnd: { fontSize: 13, color: COLORS.subtext },
  openEndedBadge: {
    fontSize: 11, color: COLORS.primary, backgroundColor: '#EEF2FF',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardDesc: { fontSize: 13, color: COLORS.subtext, marginTop: 2 },
  badge: {
    backgroundColor: '#FFF7ED', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start', marginTop: 6,
  },
  badgeText: { fontSize: 12, color: '#9A3412' },
  reminderText: { fontSize: 12, color: COLORS.subtext, marginTop: 4 },
  actions: { gap: 4 },
  actionBtn: { padding: 4 },
  empty: { textAlign: 'center', color: COLORS.subtext, marginTop: 60, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
});
