import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getEvents, getTodos } from '../storage';
import { Event, Todo } from '../types';
import { formatDeadline, isOverdue } from '../utils/sort';
import { COLORS } from '../utils/colors';

export default function TodayScreen() {
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [urgentTodos, setUrgentTodos] = useState<Todo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [events, todos] = await Promise.all([getEvents(), getTodos()]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setTodayEvents(
      events.filter(e => {
        const start = new Date(e.startDate);
        return start >= today && start < tomorrow;
      })
    );
    setUrgentTodos(
      todos.filter(t => !t.completed && (t.priority === 'urgent' || t.priority === 'high' || isOverdue(t.deadline)))
        .slice(0, 5)
    );
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Guten Morgen' : now.getHours() < 18 ? 'Guten Tag' : 'Guten Abend';
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting} 👋</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      <Section title={`Heute (${todayEvents.length})`} icon="📅">
        {todayEvents.length === 0 ? (
          <EmptyHint text="Keine Termine heute" />
        ) : (
          todayEvents.map(e => (
            <View key={e.id} style={[styles.card, { borderLeftColor: e.color }]}>
              <Text style={styles.cardTitle}>{e.title}</Text>
              <Text style={styles.cardSub}>
                {new Date(e.startDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                {e.endDate ? ` – ${new Date(e.endDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ''}
                {e.isOpenEnded ? ' (offen)' : ''}
              </Text>
            </View>
          ))
        )}
      </Section>

      <Section title="Dringend / Überfällig" icon="🔥">
        {urgentTodos.length === 0 ? (
          <EmptyHint text="Alles im grünen Bereich ✅" />
        ) : (
          urgentTodos.map(t => (
            <View key={t.id} style={[styles.card, { borderLeftColor: PRIORITY_COLORS[t.priority] }]}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              {t.deadline && (
                <Text style={[styles.cardSub, isOverdue(t.deadline) && styles.overdue]}>
                  {formatDeadline(t.deadline)}
                </Text>
              )}
              {t.subtasks.length > 0 && (
                <Text style={styles.cardMeta}>
                  {t.subtasks.filter(s => s.completed).length}/{t.subtasks.length} Unteraufgaben
                </Text>
              )}
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{icon}  {title}</Text>
      {children}
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <Text style={styles.emptyHint}>{text}</Text>;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#FF4444',
  high: '#FF8C00',
  medium: '#6C63FF',
  low: '#43D39E',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 24, paddingTop: 48 },
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 15, color: COLORS.subtext, marginTop: 4 },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: 13, color: COLORS.subtext, marginTop: 3 },
  cardMeta: { fontSize: 12, color: COLORS.subtext, marginTop: 3 },
  overdue: { color: '#FF4444', fontWeight: '600' },
  emptyHint: { color: COLORS.subtext, fontSize: 14, paddingVertical: 8, paddingHorizontal: 4 },
});
