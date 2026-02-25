<template>
  <v-dialog v-model="dialog" max-width="500" scrollable>
    <v-card>
      <v-card-title>{{ isEdit ? 'Edit Meal' : 'New Meal' }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="form.name"
          label="Meal name"
          variant="outlined"
          density="compact"
          class="mb-2"
          hide-details
        />
        <p class="text-body-2 text-medium-emphasis mb-2">Total macros</p>
        <MacroInputFields v-model="form.macros" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!form.name.trim()" @click="save">
          {{ isEdit ? 'Save' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch } from 'vue'
  import MacroInputFields from '@/components/today/MacroInputFields.vue'
  import { useFoodsStore } from '@/stores/foods'
  import { emptyMacros } from '@/types'
  import type { MealTemplate } from '@/types'

  const store = useFoodsStore()

  const dialog = defineModel<boolean>({ default: false })
  const props = defineProps<{ editItem?: MealTemplate | null }>()
  const emit = defineEmits<{ saved: [] }>()

  const isEdit = ref(false)
  const editId = ref('')
  const editCreatedAt = ref('')

  const form = reactive({
    name: '',
    macros: emptyMacros(),
  })

  watch(dialog, (open) => {
    if (open && props.editItem) {
      isEdit.value = true
      editId.value = props.editItem.id
      editCreatedAt.value = props.editItem.createdAt
      form.name = props.editItem.name
      form.macros = { ...props.editItem.macros }
    } else if (open) {
      isEdit.value = false
      form.name = ''
      form.macros = emptyMacros()
    }
  })

  async function save() {
    if (isEdit.value) {
      await store.updateMealTemplate({
        id: editId.value,
        name: form.name.trim(),
        macros: { ...form.macros },
        createdAt: editCreatedAt.value,
      })
    } else {
      await store.addMealTemplate({
        name: form.name.trim(),
        macros: { ...form.macros },
      })
    }
    emit('saved')
    dialog.value = false
  }
</script>
