import { StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

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

export default styles;
