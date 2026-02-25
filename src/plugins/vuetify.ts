import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          'macro-calories': '#FFB300',
          'macro-protein': '#1E88E5',
          'macro-carbs': '#43A047',
          'macro-fat': '#FB8C00',
        },
      },
      dark: {
        colors: {
          'macro-calories': '#FFB300',
          'macro-protein': '#1E88E5',
          'macro-carbs': '#43A047',
          'macro-fat': '#FB8C00',
        },
      },
    },
  },
})
