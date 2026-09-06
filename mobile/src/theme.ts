// theme.ts
// Shared design tokens. Import this everywhere instead of hardcoding
// colors/spacing/type in individual screens, so the whole app stays consistent.

export const colors = {
  background: '#FAF6F0',   // warm sand, not stark white
  surface: '#FFFFFF',
  text: '#2B2B28',          // charcoal, not pure black
  textMuted: '#6B665F',
  border: '#E4DDD1',
  primary: '#2F6F6B',       // deep teal - main actions
  primaryPressed: '#25534F',
  accent: '#C98A3E',        // mustard - sparing use only (highlights, selected states)
  success: '#4C8C6B',
  error: '#B5533C',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  pill: 999,
};

export const type = {
  // Load Poppins via expo-font (or @expo-google-fonts/poppins) in App.tsx.
  // Falls back to system font if not loaded, so nothing breaks.
  heading: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 28,
    color: colors.text,
  },
  subheading: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 18,
    color: colors.text,
  },
  body: {
    fontSize: 17,           // larger base size — elderly-friendly
    color: colors.text,
    lineHeight: 24,
  },
  bodyMuted: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  label: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600' as const,
  },
};

export const touchTarget = {
  minHeight: 52, // minimum tappable height for buttons/inputs
};