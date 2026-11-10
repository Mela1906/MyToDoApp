import { StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },

  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 48,
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
    marginTop: 16,
    marginBottom: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },

  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  colorDotSelected: {
    borderWidth: 3,
    borderColor: COLORS.text,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  switchLabel: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },

  chipTextActive: {
    color: '#fff',
  },

  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },

  infoText: {
    color: COLORS.primary,
    fontSize: 14,
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default styles;
