<template>
  <div class="volume-mounts-config">
    <div class="section-header">
      <div class="header-left">
        <FolderOpen :size="18" />
        <h4>卷挂载配置</h4>
      </div>
    </div>

    <ElAlert type="info" :closable="false" show-icon>
      <template #title>配置容器如何挂载存储卷到指定路径</template>
    </ElAlert>

    <!-- 容器选择 -->
    <div class="container-selector">
      <label>选择容器：</label>
      <ElSelect v-model="selectedContainer" placeholder="选择容器">
        <ElOption
          v-for="mount in volumeMountsValue"
          :key="mount.containerName"
          :label="mount.containerName"
          :value="mount.containerName"
        />
      </ElSelect>
    </div>

    <ElEmpty v-if="!selectedContainer" description="请选择容器" :image-size="60" />

    <div v-else-if="currentContainerMounts.length === 0" class="empty-mounts">
      <ElEmpty description="该容器暂无挂载配置" :image-size="60">
        <ElButton v-if="editing" type="primary" size="small" @click="addMount">
          添加挂载点
        </ElButton>
      </ElEmpty>
    </div>

    <div v-else class="mounts-list">
      <div v-for="(mount, index) in currentContainerMounts" :key="index" class="mount-item">
        <div class="mount-fields">
          <div class="form-item">
            <label>卷名</label>
            <ElSelect v-model="mount.name" :disabled="!editing">
              <ElOption
                v-for="vol in volumes"
                :key="vol.name"
                :label="vol.name"
                :value="vol.name"
              />
            </ElSelect>
          </div>
          <div class="form-item">
            <label>挂载路径</label>
            <ElInput v-model="mount.mountPath" :readonly="!editing" placeholder="/app/data" />
          </div>
          <div class="form-item">
            <label>子路径</label>
            <ElInput v-model="mount.subPath" :readonly="!editing" placeholder="可选" />
          </div>
          <div class="form-item-switch">
            <label>只读</label>
            <ElSwitch v-model="mount.readOnly" :disabled="!editing" />
          </div>
          <ElButton v-if="editing" type="danger" text circle @click="removeMount(index)">
            <Trash2 :size="16" />
          </ElButton>
        </div>
      </div>

      <ElButton v-if="editing" type="primary" text @click="addMount" style="margin-top: 12px">
        <Plus :size="14" style="margin-right: 4px" />
        添加挂载点
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { FolderOpen, Plus, Trash2 } from 'lucide-vue-next'
  import type { VolumeConfig, VolumeMountConfig } from '@/api'

  interface Props {
    editing: boolean
    volumes: VolumeConfig[]
  }

  const props = defineProps<Props>()

  const volumeMountsValue = defineModel<VolumeMountConfig[]>('volumeMounts', { default: [] })

  const selectedContainer = ref('')

  const currentContainerMounts = computed(() => {
    const container = volumeMountsValue.value.find(
      (vm) => vm.containerName === selectedContainer.value
    )
    return container?.mounts || []
  })

  const addMount = () => {
    const container = volumeMountsValue.value.find(
      (vm) => vm.containerName === selectedContainer.value
    )
    if (container) {
      if (!container.mounts) container.mounts = []
      container.mounts.push({
        name: '',
        mountPath: '',
        subPath: '',
        readOnly: false
      })
    }
  }

  const removeMount = (index: number) => {
    const container = volumeMountsValue.value.find(
      (vm) => vm.containerName === selectedContainer.value
    )
    if (container?.mounts) {
      container.mounts.splice(index, 1)
    }
  }

  // 🔥 监听数据变化，自动选择第一个容器
  watch(
    () => volumeMountsValue.value,
    (newVal) => {
      if (newVal && newVal.length > 0 && !selectedContainer.value) {
        selectedContainer.value = newVal[0].containerName
      }
    },
    { immediate: true, deep: true }
  )

  // 🔥 组件挂载时自动选择第一个容器
  onMounted(() => {
    if (volumeMountsValue.value && volumeMountsValue.value.length > 0 && !selectedContainer.value) {
      selectedContainer.value = volumeMountsValue.value[0].containerName
    }
  })
</script>

<style lang="scss" scoped>
  .volume-mounts-config {
    padding: 20px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    :deep(.el-alert) {
      margin-bottom: 16px;
    }

    .container-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 6px;
      margin-bottom: 16px;

      label {
        font-size: 14px;
        font-weight: 500;
        color: #606266;
      }

      :deep(.el-select) {
        flex: 1;
        max-width: 300px;
      }
    }

    .mounts-list {
      .mount-item {
        padding: 16px;
        background: #f9fafb;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .mount-fields {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr auto auto;
          gap: 12px;
          align-items: end;

          .form-item {
            label {
              display: block;
              margin-bottom: 6px;
              font-size: 13px;
              font-weight: 500;
              color: #606266;
            }
          }

          .form-item-switch {
            display: flex;
            flex-direction: column;
            gap: 6px;

            label {
              font-size: 13px;
              font-weight: 500;
              color: #606266;
            }
          }
        }
      }
    }
  }
</style>
