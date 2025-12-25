<!-- ResourceInput.vue - 通用资源输入组件 -->
<template>
  <div class="resource-input">
    <ElInputNumber
      :model-value="numericValue"
      @update:model-value="handleValueChange"
      :min="min"
      :max="max"
      :step="step"
      :precision="precision"
      :controls-position="controlsPosition"
      :style="{ width: inputWidth }"
      :placeholder="placeholder"
      :disabled="disabled"
    />
    <ElSelect
      :model-value="currentUnit"
      @update:model-value="handleUnitChange"
      :style="{ width: selectWidth }"
      :disabled="disabled"
    >
      <ElOption
        v-for="unit in unitOptions"
        :key="unit.value"
        :label="unit.label"
        :value="unit.value"
      />
    </ElSelect>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import {
    parseCpu,
    parseMemory,
    formatCpu,
    formatMemory,
    convertCpuUnit,
    convertMemoryUnit,
    CPU_UNITS,
    MEMORY_UNITS,
    type CpuUnit,
    type MemoryUnit,
    type ResourceType
  } from '@/utils/resource'

  interface Props {
    modelValue: string | number
    type: ResourceType
    min?: number
    max?: number
    step?: number
    precision?: number
    controlsPosition?: 'right' | ''
    inputWidth?: string
    selectWidth?: string
    placeholder?: string
    disabled?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    min: 0,
    max: 10000,
    step: 0.1,
    precision: 3,
    controlsPosition: 'right',
    inputWidth: '200px',
    selectWidth: '120px',
    placeholder: '请输入',
    disabled: false
  })

  const emit = defineEmits<Emits>()

  // 当前数值
  const numericValue = ref(0)
  // 当前单位
  const currentUnit = ref<CpuUnit | MemoryUnit>('core')

  // 单位选项
  const unitOptions = computed(() => {
    return props.type === 'cpu' ? CPU_UNITS : MEMORY_UNITS
  })

  // 初始化和监听 modelValue 变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (props.type === 'cpu') {
        const parsed = parseCpu(newVal)
        numericValue.value = parsed.value
        currentUnit.value = parsed.unit as CpuUnit
      } else {
        const parsed = parseMemory(newVal)
        numericValue.value = parsed.value
        currentUnit.value = parsed.unit as MemoryUnit
      }
    },
    { immediate: true }
  )

  // 处理数值变化
  const handleValueChange = (val: number | null) => {
    if (val === null) val = 0
    numericValue.value = val
    emitValue()
  }

  // 处理单位变化
  const handleUnitChange = (newUnit: CpuUnit | MemoryUnit) => {
    const oldUnit = currentUnit.value

    // 转换数值到新单位
    if (props.type === 'cpu') {
      const converted = convertCpuUnit(numericValue.value, oldUnit as CpuUnit, newUnit as CpuUnit)
      numericValue.value = parseFloat(converted.toFixed(3))
    } else {
      const converted = convertMemoryUnit(
        numericValue.value,
        oldUnit as MemoryUnit,
        newUnit as MemoryUnit
      )
      numericValue.value = parseFloat(converted.toFixed(3))
    }

    currentUnit.value = newUnit
    emitValue()
  }

  // 发出值变化
  const emitValue = () => {
    let formatted: string
    if (props.type === 'cpu') {
      formatted = formatCpu(numericValue.value, currentUnit.value as CpuUnit)
    } else {
      formatted = formatMemory(numericValue.value, currentUnit.value as MemoryUnit)
    }
    emit('update:modelValue', formatted)
  }
</script>

<style lang="scss" scoped>
  .resource-input {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
  }
</style>
