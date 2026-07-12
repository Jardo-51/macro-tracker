import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Single source of truth for the per-macro palette; also exposed as the
// macro-* theme colors below and used directly by the trend chart.
export const MACRO_COLORS = {
  calories: '#FFB300',
  protein: '#1E88E5',
  carbs: '#43A047',
  fat: '#FB8C00',
} as const

const macroThemeColors = {
  'macro-calories': MACRO_COLORS.calories,
  'macro-protein': MACRO_COLORS.protein,
  'macro-carbs': MACRO_COLORS.carbs,
  'macro-fat': MACRO_COLORS.fat,
}

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: { ...macroThemeColors },
      },
      dark: {
        colors: { ...macroThemeColors },
      },
    },
  },
})
