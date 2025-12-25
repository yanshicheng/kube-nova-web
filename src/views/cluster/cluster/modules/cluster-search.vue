<template>
  <div class="cluster-search">
    <ElForm ref="searchFormRef" :model="searchModel" :inline="true" class="inline-form">
      <ElFormItem label="集群名称" prop="name">
        <ElInput
          v-model="searchModel.name"
          placeholder="请输入集群名称"
          clearable
          @keyup.enter="handleSearch"
          style="width: 200px"
        >
          <template #prefix>
            <ElIcon>
              <Server />
            </ElIcon>
          </template>
        </ElInput>
      </ElFormItem>

      <ElFormItem label="环境类型" prop="environment">
        <ElSelect
          v-model="searchModel.environment"
          placeholder="请选择环境"
          clearable
          style="width: 200px"
          class="env-select"
        >
          <ElOption
            v-for="env in environmentOptions"
            :key="env.value"
            :label="env.label"
            :value="env.value"
            class="custom-option"
          >
            <div class="option-item">
              <span class="option-emoji">{{ env.emoji }}</span>
              <span class="option-label">{{ env.label }}</span>
              <ElTag size="small" :type="env.type" class="option-tag">
                {{ env.shortLabel }}
              </ElTag>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="集群类型" prop="clusterType">
        <ElSelect
          v-model="searchModel.clusterType"
          placeholder="请选择集群类型"
          clearable
          style="width: 200px"
          class="type-select"
        >
          <ElOption
            v-for="type in clusterTypeOptions"
            :key="type.value"
            :label="type.label"
            :value="type.value"
            class="custom-option"
          >
            <div class="option-item">
              <ElIcon :color="type.color" class="option-icon">
                <component :is="type.icon" />
              </ElIcon>
              <span class="option-label">{{ type.label }}</span>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>

      <ElFormItem>
        <ElSpace :size="12">
          <ElButton type="primary" :icon="Search" @click="handleSearch" :loading="searchLoading">
            {{ searchLoading ? '搜索中...' : '搜索' }}
          </ElButton>
          <ElButton :icon="RefreshCw" @click="handleReset" :loading="resetLoading">
            {{ resetLoading ? '重置中...' : '重置' }}
          </ElButton>
        </ElSpace>
      </ElFormItem>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { ElIcon } from 'element-plus'
  import { Search, RefreshCw, Server } from 'lucide-vue-next'
  import type { FormInstance } from 'element-plus'
  import { environmentOptions, clusterTypeOptions } from '../constants'

  interface SearchForm {
    name: string
    environment: string
    clusterType: string
  }

  interface Props {
    modelValue: Record<string, any>
  }

  interface Emits {
    (e: 'update:modelValue', value: SearchForm): void

    (e: 'search', value: SearchForm): void

    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 引用
  const searchFormRef = ref<FormInstance>()

  // 加载状态
  const searchLoading = ref(false)
  const resetLoading = ref(false)

  // 搜索表单数据
  const searchModel = reactive<SearchForm>({
    name: '',
    environment: '',
    clusterType: ''
  })

  // 监听外部值变化
  watch(
    () => props.modelValue,
    (newVal) => {
      Object.assign(searchModel, newVal)
    },
    { immediate: true }
  )

  // 搜索
  const handleSearch = async () => {
    searchLoading.value = true
    try {
      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 300))

      const searchData = { ...searchModel }

      // 过滤掉空值
      Object.keys(searchData).forEach((key) => {
        const value = searchData[key as keyof SearchForm]
        if (value === '' || value === null || value === undefined) {
          delete searchData[key as keyof SearchForm]
        }
      })

      emit('update:modelValue', searchData)
      emit('search', searchData)
    } finally {
      searchLoading.value = false
    }
  }

  // 重置
  const handleReset = async () => {
    resetLoading.value = true
    try {
      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 200))

      searchFormRef.value?.resetFields()
      searchModel.name = ''
      searchModel.environment = ''
      searchModel.clusterType = ''

      emit('update:modelValue', searchModel)
      emit('reset')
    } finally {
      resetLoading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .cluster-search {
    padding: 16px;
    background: #fff;
    border-radius: 8px;

    // 内联表单样式
    .inline-form {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;

      // 表单项样式优化
      :deep(.el-form-item) {
        margin-bottom: 0;
        margin-right: 0;

        .el-form-item__label {
          font-size: 14px;
          color: var(--el-text-color-regular);
          font-weight: 500;
          white-space: nowrap;
          padding-right: 8px;
          margin-right: 0;
        }

        .el-form-item__content {
          min-width: 0;
        }
      }
    }

    // 选择器特殊样式
    :deep(.el-select) {
      .el-select__wrapper {
        min-height: 40px; // 增加高度
        padding: 0 12px;
      }

      .el-select__selected-item {
        display: flex;
        align-items: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .el-select__placeholder {
        color: var(--el-text-color-placeholder);
      }

      // 多选标签样式
      .el-select__tags {
        max-width: 100%;
        display: flex;
        flex-wrap: nowrap;
        overflow: hidden;
      }

      .el-tag {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    // 输入框样式
    :deep(.el-input) {
      .el-input__wrapper {
        min-height: 40px;
        padding: 0 12px;
      }
    }

    // 选项内容样式
    .option-item {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 2px 0;

      .option-emoji {
        font-size: 16px;
        min-width: 20px;
        text-align: center;
        flex-shrink: 0;
      }

      .option-icon {
        min-width: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .option-label {
        flex: 1;
        font-size: 14px;
        color: var(--el-text-color-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .option-tag {
        margin-left: 8px;
        font-size: 11px;
        padding: 1px 6px;
        flex-shrink: 0;
      }
    }

    // 按钮组样式
    :deep(.el-space) {
      .el-button {
        min-width: 80px;
        height: 40px;
        font-size: 14px;
        font-weight: 500;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  // 下拉面板样式 - 跟随选择框宽度
  :deep(.el-select-dropdown) {
    .el-select-dropdown__item {
      padding: 6px 12px;
      height: auto;
      min-height: 34px;
      line-height: normal;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      &.is-selected {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-weight: 500;
        position: relative;

        &::after {
          content: '✓';
          position: absolute;
          right: 12px;
          color: var(--el-color-primary);
          font-size: 14px;
        }
      }
    }

    // 自定义选项样式
    .custom-option {
      width: 100%;

      .option-item {
        width: 100%;
      }
    }
  }

  // 响应式布局优化
  @media (max-width: 1200px) {
    .cluster-search {
      .inline-form {
        :deep(.el-input),
        :deep(.el-select) {
          width: 180px !important;
        }
      }
    }
  }

  @media (max-width: 992px) {
    .cluster-search {
      .inline-form {
        gap: 16px;

        :deep(.el-input),
        :deep(.el-select) {
          width: 160px !important;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .cluster-search {
      padding: 12px;

      .inline-form {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        :deep(.el-form-item) {
          width: 100%;

          .el-form-item__label {
            width: 80px !important;
          }
        }

        :deep(.el-input),
        :deep(.el-select) {
          width: 100% !important;
        }
      }
    }
  }
</style>
