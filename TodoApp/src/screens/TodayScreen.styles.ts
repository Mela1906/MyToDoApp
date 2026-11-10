import { StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

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

  body: { paddingHorizontal: 16, paddingTop: 20 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  sectionAction: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  emptyCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 18, marginBottom: 20,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyCardText: { color: COLORS.subtext, fontSize: 14 },

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

  focusCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  focusCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  focusPriorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  focusTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
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

export default styles;
