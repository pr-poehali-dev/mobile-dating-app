// Единая типографика для всех компонентов Dashboard2
// Все тексты приведены к единому размеру text-sm
export const dashboardTypography = {
  // Заголовки карточек
  cardTitle: 'text-sm font-bold text-foreground',
  
  // Подзаголовки / описания
  cardSubtitle: 'text-sm font-medium text-foreground/70',
  
  // Основные цифры / метрики
  cardValue: 'text-xl font-extrabold text-foreground',
  
  // Вторичный текст
  cardSecondary: 'text-sm font-medium text-foreground/70',
  
  // Статус / бейджи
  cardBadge: 'text-sm font-semibold',
  
  // Мелкий текст (labels, hints)
  cardSmall: 'text-sm font-medium text-foreground/60',
  
  // Очень мелкий текст
  cardTiny: 'text-xs font-medium text-foreground/60',
} as const;

// Цвета для единообразия (используют CSS переменные где возможно)
export const dashboardColors = {
  textPrimary: 'hsl(var(--foreground))',
  textSecondary: 'hsl(var(--muted-foreground))',
  textMuted: 'hsl(var(--muted-foreground) / 0.7)',
  
  purple: '#7551e9',
  blue: '#3965ff',
  green: '#01b574',
  orange: '#ffb547',
  red: '#ff6b6b',
  cyan: '#2CD9FF',
} as const;

// Стили карточек с поддержкой темной/светлой темы
export const getCardStyle = (accentColor?: string) => {
  const baseStyle = {
    background: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
  };

  if (accentColor) {
    return {
      ...baseStyle,
      borderTop: `4px solid ${accentColor}`,
    };
  }

  return baseStyle;
};