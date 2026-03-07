<template>
  <v-bottom-navigation grow>
    <v-btn to="/daily">
      <v-icon>mdi-calendar</v-icon>
      <span>Daily</span>
    </v-btn>
    <v-btn to="/history">
      <v-icon>mdi-chart-line</v-icon>
      <span>History</span>
    </v-btn>
    <v-btn to="/meals">
      <v-icon>mdi-food-apple</v-icon>
      <span>Meals</span>
    </v-btn>
    <v-btn to="/settings">
      <v-icon>mdi-cog</v-icon>
      <span>Settings</span>
    </v-btn>
  </v-bottom-navigation>
</template>
