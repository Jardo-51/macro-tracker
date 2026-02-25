<template>
  <v-dialog v-model="dialog" max-width="500" scrollable>
    <v-card>
      <v-card-title>{{ isEdit ? 'Edit Food' : 'New Food' }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="form.name"
          label="Food name"
          variant="outlined"
          density="compact"
          class="mb-2"
          hide-details
        />
        <v-row dense class="mb-2">
          <v-col cols="6">
            <v-text-field
              v-model.number="form.servingSize"
              label="Serving size"
              type="number"
              min="1"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="form.servingUnit"
              label="Unit (g, oz, cup...)"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
        </v-row>
        <p class="text-body-2 text-medium-emphasis mb-2">Macros per serving</p>
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
  import type { FoodItem } from '@/types'

  const store = useFoodsStore()

  const dialog = defineModel<boolean>({ default: false })
  const props = defineProps<{ editItem?: FoodItem | null }>()
  const emit = defineEmits<{ saved: [] }>()

  const isEdit = ref(false)
  const editId = ref('')
  const editCreatedAt = ref('')

  const form = reactive({
    name: '',
    servingSize: 100,
    servingUnit: 'g',
    macros: emptyMacros(),
  })

  watch(dialog, (open) => {
    if (open && props.editItem) {
      isEdit.value = true
      editId.value = props.editItem.id
      editCreatedAt.value = props.editItem.createdAt
      form.name = props.editItem.name
      form.servingSize = props.editItem.servingSize
      form.servingUnit = props.editItem.servingUnit
      form.macros = { ...props.editItem.macros }
    } else if (open) {
      isEdit.value = false
      form.name = ''
      form.servingSize = 100
      form.servingUnit = 'g'
      form.macros = emptyMacros()
    }
  })

  async function save() {
    if (isEdit.value) {
      await store.updateFoodItem({
        id: editId.value,
        name: form.name.trim(),
        servingSize: form.servingSize,
        servingUnit: form.servingUnit,
        macros: { ...form.macros },
        createdAt: editCreatedAt.value,
      })
    } else {
      await store.addFoodItem({
        name: form.name.trim(),
        servingSize: form.servingSize,
        servingUnit: form.servingUnit,
        macros: { ...form.macros },
      })
    }
    emit('saved')
    dialog.value = false
  }
</script>
