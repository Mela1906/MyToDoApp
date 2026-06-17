import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getEvents, deleteEvent } from '../storage';
import { Event } from '../types';
import { COLORS } from '../utils/colors';

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    const data = await getEvents();
    const sorted = [...data].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    setEvents(sorted);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (id: string) => {
    Alert.alert('Löschen', 'Termin wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive', onPress: async () => {
          await deleteEvent(id);
          setEvents(prev => prev.filter(e => e.id !== id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Termine</Text>
      <FlatList
        data={events}
        keyExtractor={e => e.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onEdit={() => navigation.navigate('AddEvent', { event: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Termine. Tippe + um loszulegen!</Text>
        }
      />
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
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Text>✏️</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
    padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardPast: { opacity: 0.5 },
  cardTop: { flexDirection: 'row' },
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
