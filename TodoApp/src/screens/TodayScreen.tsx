import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getEvents, getTodos } from '../storage';
import { Event, Todo } from '../types';
import { formatDeadline, isOverdue, sortTodos } from '../utils/sort';
import { COLORS } from '../utils/colors';
import styles from './TodayScreen.styles';

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
  const focusTodos = sortTodos(openTodos).slice(0, 4);
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
        {focusTodos.length === 0 ? (
          <EmptyCard text="Alles erledigt – super gemacht! 🌟" />
        ) : (
          focusTodos.map(todo => <FocusTodoCard key={todo.id} todo={todo} />)
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
  const accentColor = isOverdue(todo.deadline) ? COLORS.danger : COLORS.primary;

  return (
    <View style={[styles.focusCard, { borderTopColor: accentColor }]}>
      <View style={styles.focusCardTop}>
        <View style={[styles.focusPriorityDot, { backgroundColor: accentColor }]} />
        <Text style={styles.focusTitle} numberOfLines={2}>{todo.title}</Text>
      </View>

      <Text style={[styles.focusDeadline, isOverdue(todo.deadline) && styles.focusOverdue]}>
        📅 {formatDeadline(todo.deadline)}
      </Text>

      {progress !== null && (
        <View style={styles.focusProgress}>
          <View style={styles.focusProgressTrack}>
            <View style={[styles.focusProgressFill, { width: `${progress * 100}%` as any, backgroundColor: accentColor }]} />
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
