<template>
  <div class="storage-management">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <ElButton v-if="!editing" type="primary" @click="startEdit">
        <Edit :size="16" />
        编辑配置
      </ElButton>
      <template v-else>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存配置</ElButton>
        <ElButton @click="handleCancel">取消</ElButton>
      </template>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" v-loading="loading" class="loading-wrapper"></div>

    <!-- 主内容 -->
    <div v-else class="content-wrapper">
      <!-- 分类选择器 -->
      <div class="category-selector">
        <ElRadioGroup v-model="activeCategory" class="category-radio-group">
          <ElRadioButton value="volumes">
            <div class="radio-content">
              <HardDrive :size="16" />
              <span>存储卷配置</span>
              <ElBadge v-if="volumes.length > 0" :value="volumes.length" :max="99" />
            </div>
          </ElRadioButton>
          <ElRadioButton value="mounts">
            <div class="radio-content">
              <FolderOpen :size="16" />
              <span>卷挂载配置</span>
              <ElBadge v-if="totalMountsCount > 0" :value="totalMountsCount" :max="99" />
            </div>
          </ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 内容区域 -->
      <div class="config-content">
        <!-- 存储卷配置 -->
        <div v-show="activeCategory === 'volumes'" class="config-section">
          <VolumesConfig :editing="editing" v-model:volumes="volumes" />
        </div>

        <!-- 卷挂载配置 -->
        <div v-show="activeCategory === 'mounts'" class="config-section">
          <VolumeMountsConfig
            :editing="editing"
            :volumes="volumes"
            v-model:volume-mounts="volumeMounts"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { HardDrive, FolderOpen, Edit } from 'lucide-vue-next'
  import {
    getStorageConfigApi,
    updateStorageConfigApi,
    type OnecProjectVersion,
    type VolumeConfig,
    type VolumeMountConfig
  } from '@/api'

  import VolumesConfig from './storage/VolumesConfig.vue'
  import VolumeMountsConfig from './storage/VolumeMountsConfig.vue'

  interface Props {
    version: OnecProjectVersion
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  const loading = ref(false)
  const saving = ref(false)
  const editing = ref(false)
  const activeCategory = ref('volumes')

  const volumes = ref<VolumeConfig[]>([])
  const volumeMounts = ref<VolumeMountConfig[]>([])
  const originalConfig = ref<any>(null)

  const totalMountsCount = computed(() => {
    return volumeMounts.value.reduce((sum, vm) => sum + (vm.mounts?.length || 0), 0)
  })

  const loadConfig = async () => {
    loading.value = true
    try {
      const response = await getStorageConfigApi(props.version.id)
      volumes.value = response.volumes || []
      volumeMounts.value = response.volumeMounts || []
      originalConfig.value = JSON.parse(JSON.stringify(response))
    } catch (error) {
      console.error('[存储管理] 加载失败:', error)
    } finally {
      loading.value = false
    }
  }

  const startEdit = () => {
    editing.value = true
  }

  const handleSave = async () => {
    try {
      await ElMessageBox.confirm('确定要保存存储配置吗？', '确认保存', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      saving.value = true
      await updateStorageConfigApi(props.version.id, {
        volumes: volumes.value,
        volumeMounts: volumeMounts.value
      })

      ElMessage.success('存储配置保存成功')
      editing.value = false
      await loadConfig()
      emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[存储管理] 保存失败:', error)
      }
    } finally {
      saving.value = false
    }
  }

  const handleCancel = () => {
    editing.value = false
    if (originalConfig.value) {
      loadConfig()
    }
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        editing.value = false
        loadConfig()
      }
    }
  )

  onMounted(() => {
    loadConfig()
  })
  // 暴露给父组件的方法和属性
  defineExpose({
    editing,
    hasUnsavedChanges: () => {
      if (!editing.value || !originalConfig.value) return false

      const current = JSON.stringify({
        volumes: volumes.value,
        volumeMounts: volumeMounts.value
      })

      const original = JSON.stringify(originalConfig.value)

      return current !== original
    }
  })
</script>

<style lang="scss" scoped>
  .storage-management {
    height: 100%;
    display: flex;
    flex-direction: column;

    .top-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      background: white;
      border-bottom: 1px solid var(--el-border-color);
      flex-shrink: 0;
    }

    .loading-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 20px;

      .category-selector {
        margin-bottom: 16px;

        .category-radio-group {
          width: 100%;
          display: flex;
          gap: 8px;

          :deep(.el-radio-button) {
            flex: 1;

            .el-radio-button__inner {
              width: 100%;
              padding: 12px 20px;
              border-radius: 8px;
              border: 2px solid #e4e7ed;

              &:hover {
                border-color: #409eff;
                color: #409eff;
              }
            }

            &.is-active .el-radio-button__inner {
              background: #409eff;
              border-color: #409eff;
              color: white;
              font-weight: 600;
            }
          }

          .radio-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;

            :deep(.el-badge) {
              margin-left: 4px;
            }
          }
        }
      }

      .config-content {
        background: white;
        border-radius: 8px;

        .config-section {
          min-height: 200px;
        }
      }
    }
  }
</style>
