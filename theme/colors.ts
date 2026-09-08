// Dark theme color palette
export const colors = {
  // Backgrounds
  background: '#0f0f1a',
  backgroundSecondary: '#1a1a2e',
  card: '#252836',
  cardBorder: '#3a3a4a',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',

  // Accent colors
  accent: '#60a5fa',
  accentDark: '#3b82f6',

  // Semantic colors (keeping green/red for win/loss)
  success: '#22c55e',
  successLight: '#dcfce7',
  successDark: '#16a34a',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  dangerDark: '#dc2626',
  warning: '#f59e0b',
  warningLight: '#fef3c7',

  // UI elements
  divider: '#3a3a4a',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Interactive
  buttonPrimary: '#3b82f6',
  buttonSecondary: '#4b5563',
  buttonDisabled: '#374151',

  // Specific element colors
  slateTag: '#6366f1',
  inputBackground: '#1f2937',
  inputBorder: '#4b5563',
}

// Shadows for elevation effect
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modal: {
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  }
}

// Typography sizes
export const typography = {
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 11,
    fontWeight: '400' as const,
  },
}

/** Size for the small action icons that sit in card and row headers. */
export const ACTION_ICON_SIZE = 19

// Common spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}
