import { StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 48, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.subtext, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, width: 48, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtaskRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border,
  },
  subtaskNum: { color: COLORS.subtext, marginRight: 8, fontSize: 14 },
  subtaskText: { flex: 1, fontSize: 14, color: COLORS.text },
  removeBtn: { color: COLORS.danger, fontSize: 16, padding: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 32,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default styles;
