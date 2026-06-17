import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getEvents, getTodos } from '../storage';
import { Event, Todo } from '../types';
import { formatDeadline, isOverdue } from '../utils/sort';
import { COLORS, PRIORITY_COLOR, PRIORITY_LABEL } from '../utils/colors';

const { width } = Dimensions.get('window');

export default function TodayScreen() {
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    const [events, todos] = await Promise.all([getEvents(), getTodos()]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const eventsToday = events
      .filter(e => {
        const d = new Date(e.startDate);
        return d >= todayStart && d < todayEnd;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    setTodayEvents(eventsToday);
    setAllTodos(todos);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openTodos = allTodos.filter(t => !t.completed);
  const doneTodos = allTodos.filter(t => t.completed).length;
  const overdueTodos = openTodos.filter(t => isOverdue(t.deadline));
  const urgentFocus = openTodos
    .filter(t => t.priority === 'urgent' || t.priority === 'high' || isOverdue(t.deadline))
    .slice(0, 4);
  const completionRate = allTodos.length > 0 ? Math.round((doneTodos / allTodos.length) * 100) : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 5 ? 'Gute Nacht 🌙' : hour < 12 ? 'Guten Morgen ☀️' : hour < 18 ? 'Guten Tag 👋' : 'Guten Abend 🌆';
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* ─── HEADER ─────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerDecorCircle1} />
        <View style={styles.headerDecorCircle2} />
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.dateStr}>{dateStr}</Text>

        {/* Stat pills */}
        <View style={styles.pillRow}>
          <StatPill emoji="📅" value={todayEvents.length} label="Termine" color="rgba(255,255,255,0.25)" />
          <StatPill emoji="✅" value={openTodos.length} label="Offen" color="rgba(255,255,255,0.25)" />
          {overdueTodos.length > 0 && (
            <StatPill emoji="🔥" value={overdueTodos.length} label="Überfällig" color="rgba(255,82,82,0.6)" />
          )}
          {completionRate > 0 && (
            <StatPill emoji="⚡" value={`${completionRate}%`} label="Erledigt" color="rgba(67,211,158,0.5)" />
          )}
        </View>
      </View>

      <View style={styles.body}>
        {/* ─── TAGES-TIMELINE ─────────────────────────── */}
        <SectionHeader title="Heute" icon="📅" onAction={() => navigation.navigate('Termine')} actionLabel="Alle" />
        {todayEvents.length === 0 ? (
          <EmptyCard text="Keine Termine heute – ein freier Tag! 🎉" />
        ) : (
          <View style={styles.timeline}>
            {todayEvents.map((e, i) => (
              <TimelineEvent key={e.id} event={e} isLast={i === todayEvents.length - 1} />
            ))}
          </View>
        )}

        {/* ─── FOCUS / URGENT TODOS ──────────────────── */}
        <SectionHeader
          title="Im Fokus"
          icon="🎯"
          onAction={() => navigation.navigate('Todos')}
          actionLabel="Alle Todos"
        />
        {urgentFocus.length === 0 ? (
          <EmptyCard text="Alles erledigt – super gemacht! 🌟" />
        ) : (
          urgentFocus.map(todo => <FocusTodoCard key={todo.id} todo={todo} />)
        )}

        {/* ─── PROGRESS RING ──────────────────────────── */}
        {allTodos.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressRingWrapper}>
              <View style={styles.progressRingOuter}>
                <View style={[styles.progressRingInner, { borderColor: completionRate > 70 ? COLORS.success : completionRate > 30 ? '#F7B731' : COLORS.danger }]}>
                  <Text style={styles.progressPercent}>{completionRate}%</Text>
                  <Text style={styles.progressLabel}>Erledigt</Text>
                </View>
              </View>
            </View>
            <View style={styles.progressStats}>
              <ProgressStat label="Offen" value={openTodos.length} color={COLORS.primary} />
              <ProgressStat label="Erledigt" value={doneTodos} color={COLORS.success} />
              <ProgressStat label="Überfällig" value={overdueTodos.length} color={COLORS.danger} />
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatPill({ emoji, value, label, color }: { emoji: string; value: number | string; label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, icon, onAction, actionLabel }: { title: string; icon: string; onAction?: () => void; actionLabel?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{icon}  {title}</Text>
      {onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyCardText}>{text}</Text>
    </View>
  );
}

function TimelineEvent({ event, isLast }: { event: Event; isLast: boolean }) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const fmt = (d: Date) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.tlRow}>
      {/* Left: time column */}
      <View style={styles.tlTimeCol}>
        <Text style={styles.tlTime}>{fmt(start)}</Text>
        {end && <Text style={styles.tlTimeEnd}>{fmt(end)}</Text>}
      </View>

      {/* Center: dot + line */}
      <View style={styles.tlLineCol}>
        <View style={[styles.tlDot, { backgroundColor: event.color }]} />
        {!isLast && <View style={[styles.tlLine, { backgroundColor: event.color + '40' }]} />}
      </View>

      {/* Right: content */}
      <View style={[styles.tlCard, { borderLeftColor: event.color }]}>
        <Text style={styles.tlTitle}>{event.title}</Text>
        {event.isOpenEnded && <Text style={styles.tlMeta}>Offenes Ende</Text>}
        {event.recurrence && <Text style={styles.tlMeta}>🔁 Wiederholung</Text>}
        {event.reminders.length > 0 && (
          <Text style={styles.tlMeta}>🔔 {event.reminders[0].label}</Text>
        )}
      </View>
    </View>
  );
}

function FocusTodoCard({ todo }: { todo: Todo }) {
  const completedSubs = todo.subtasks.filter(s => s.completed).length;
  const progress = todo.subtasks.length > 0 ? completedSubs / todo.subtasks.length : null;
  const pColor = PRIORITY_COLOR[todo.priority];

  return (
    <View style={[styles.focusCard, { borderTopColor: pColor }]}>
      <View style={styles.focusCardTop}>
        <View style={[styles.focusPriorityDot, { backgroundColor: pColor }]} />
        <Text style={styles.focusTitle} numberOfLines={2}>{todo.title}</Text>
        <View style={[styles.focusBadge, { backgroundColor: pColor + '20' }]}>
          <Text style={[styles.focusBadgeText, { color: pColor }]}>{PRIORITY_LABEL[todo.priority]}</Text>
        </View>
      </View>

      {todo.deadline && (
        <Text style={[styles.focusDeadline, isOverdue(todo.deadline) && styles.focusOverdue]}>
          📅 {formatDeadline(todo.deadline)}
        </Text>
      )}

      {progress !== null && (
        <View style={styles.focusProgress}>
          <View style={styles.focusProgressTrack}>
            <View style={[styles.focusProgressFill, { width: `${progress * 100}%` as any, backgroundColor: pColor }]} />
          </View>
          <Text style={styles.focusProgressText}>{completedSubs}/{todo.subtasks.length}</Text>
        </View>
      )}

      {todo.contextTags.length > 0 && (
        <View style={styles.focusTags}>
          {todo.contextTags.slice(0, 3).map(tag => (
            <View key={tag} style={styles.focusTag}>
              <Text style={styles.focusTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ProgressStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.progressStatItem}>
      <Text style={[styles.progressStatValue, { color }]}>{value}</Text>
      <Text style={styles.progressStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  headerDecorCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerDecorCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, right: 80,
  },
  greeting: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  dateStr: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 20 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillEmoji: { fontSize: 14 },
  pillValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  pillLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },

  // Section
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  sectionAction: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  // Empty card
  emptyCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 18, marginBottom: 20,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyCardText: { color: COLORS.subtext, fontSize: 14 },

  // Timeline
  timeline: { marginBottom: 24 },
  tlRow: { flexDirection: 'row', marginBottom: 0 },
  tlTimeCol: { width: 52, alignItems: 'flex-end', paddingRight: 8, paddingTop: 2 },
  tlTime: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  tlTimeEnd: { fontSize: 11, color: COLORS.subtext },
  tlLineCol: { width: 20, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  tlLine: { width: 2, flex: 1, minHeight: 24, marginTop: 2 },
  tlCard: {
    flex: 1, marginLeft: 10, backgroundColor: COLORS.card, borderRadius: 12,
    padding: 12, marginBottom: 10, borderLeftWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  tlTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  tlMeta: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },

  // Focus todos
  focusCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  focusCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  focusPriorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  focusTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  focusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  focusBadgeText: { fontSize: 11, fontWeight: '700' },
  focusDeadline: { fontSize: 13, color: COLORS.subtext, marginBottom: 6 },
  focusOverdue: { color: COLORS.danger, fontWeight: '600' },
  focusProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  focusProgressTrack: {
    flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden',
  },
  focusProgressFill: { height: 5, borderRadius: 3 },
  focusProgressText: { fontSize: 11, color: COLORS.subtext, minWidth: 30 },
  focusTags: { flexDirection: 'row', gap: 6 },
  focusTag: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  focusTagText: { fontSize: 11, color: COLORS.primary },

  // Progress ring card
  progressCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginTop: 8, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  progressRingWrapper: { marginRight: 24 },
  progressRingOuter: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  progressRingInner: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  progressPercent: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  progressLabel: { fontSize: 10, color: COLORS.subtext },
  progressStats: { flex: 1, gap: 12 },
  progressStatItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressStatValue: { fontSize: 22, fontWeight: '800' },
  progressStatLabel: { fontSize: 14, color: COLORS.subtext },
});
