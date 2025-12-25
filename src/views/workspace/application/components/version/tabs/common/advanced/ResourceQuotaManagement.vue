<template>
  <div class="resource-quota-management">
    <!-- 容器选择 -->
    <div class="container-selector">
      <label>选择容器：</label>
      <ElSelect
        v-model="selectedContainer"
        placeholder="请选择容器"
        style="width: 240px"
        @change="handleContainerChange"
      >
        <ElOption
          v-for="container in containers"
          :key="container.containerName"
          :label="container.containerName"
          :value="container.containerName"
        >
          <div class="container-option">
            <span>{{ container.containerName }}</span>
            <ElTag v-if="hasQuota(container)" size="small" type="success">已配置</ElTag>
            <ElTag v-else size="small" type="info">未配置</ElTag>
          </div>
        </ElOption>
      </ElSelect>

      <div class="selector-actions" v-if="selectedContainer">
        <ElButton v-if="!editing" type="primary" size="small" @click="startEdit">
          <Edit :size="14" />
          编辑
        </ElButton>
        <template v-else>
          <ElButton type="primary" size="small" :loading="saving" @click="handleSave">
            <Save :size="14" />
            保存
          </ElButton>
          <ElButton size="small" @click="handleCancel">取消</ElButton>
        </template>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" v-loading="loading" class="loading-wrapper"></div>

    <!-- 主内容 -->
    <div v-else-if="selectedContainer" class="config-wrapper">
      <!-- 资源类型切换 -->
      <div class="resource-type-selector">
        <ElRadioGroup v-model="activeResourceType" class="type-radio-group">
          <ElRadioButton value="cpu">
            <div class="radio-content">
              <Cpu :size="16" />
              <span>CPU 配额</span>
            </div>
          </ElRadioButton>
          <ElRadioButton value="memory">
            <div class="radio-content">
              <HardDrive :size="16" />
              <span>内存配额</span>
            </div>
          </ElRadioButton>
          <ElRadioButton value="preview">
            <div class="radio-content">
              <Eye :size="16" />
              <span>配额预览</span>
            </div>
          </ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 配置区域 -->
      <div class="config-content">
        <!-- CPU 配额 -->
        <div v-show="activeResourceType === 'cpu'" class="config-section">
          <div class="resource-config cpu-config">
            <div class="config-header">
              <Cpu :size="18" />
              <h4>CPU 配额配置</h4>
            </div>

            <div class="config-body">
              <div class="quota-item">
                <div class="quota-label">
                  <CheckCircle :size="16" class="icon-success" />
                  <span>Requests（最小保证）</span>
                </div>
                <ResourceInput
                  v-model="currentQuota.requests.cpu"
                  type="cpu"
                  :min="0"
                  :disabled="!editing"
                  placeholder="请输入 CPU Requests"
                />
                <div class="quota-tip">
                  <Info :size="14" />
                  <span>Pod 调度时保证的最小 CPU 资源</span>
                </div>
              </div>

              <div class="quota-item">
                <div class="quota-label">
                  <AlertCircle :size="16" class="icon-warning" />
                  <span>Limits（最大限制）</span>
                </div>
                <ResourceInput
                  v-model="currentQuota.limits.cpu"
                  type="cpu"
                  :min="0"
                  :disabled="!editing"
                  placeholder="请输入 CPU Limits"
                />
                <div class="quota-tip">
                  <AlertCircle :size="14" />
                  <span>容器可使用的最大 CPU 资源，超出会被限流</span>
                </div>
              </div>

              <!-- CPU 配额示例 -->
              <div class="quota-examples" v-if="editing">
                <div class="examples-title">
                  <Lightbulb :size="14" />
                  <span>常用配置参考</span>
                </div>
                <div class="examples-grid">
                  <div class="example-item" @click="applyCpuExample('100m', '200m')">
                    <div class="example-name">轻量应用</div>
                    <div class="example-value">100m / 200m</div>
                  </div>
                  <div class="example-item" @click="applyCpuExample('500m', '1')">
                    <div class="example-name">常规应用</div>
                    <div class="example-value">500m / 1</div>
                  </div>
                  <div class="example-item" @click="applyCpuExample('1', '2')">
                    <div class="example-name">计算密集</div>
                    <div class="example-value">1 / 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 内存配额 -->
        <div v-show="activeResourceType === 'memory'" class="config-section">
          <div class="resource-config memory-config">
            <div class="config-header">
              <HardDrive :size="18" />
              <h4>内存配额配置</h4>
            </div>

            <div class="config-body">
              <div class="quota-item">
                <div class="quota-label">
                  <CheckCircle :size="16" class="icon-success" />
                  <span>Requests（最小保证）</span>
                </div>
                <ResourceInput
                  v-model="currentQuota.requests.memory"
                  type="memory"
                  :min="0"
                  :disabled="!editing"
                  placeholder="请输入内存 Requests"
                />
                <div class="quota-tip">
                  <Info :size="14" />
                  <span>Pod 调度时保证的最小内存资源</span>
                </div>
              </div>

              <div class="quota-item">
                <div class="quota-label">
                  <AlertTriangle :size="16" class="icon-danger" />
                  <span>Limits（最大限制）</span>
                </div>
                <ResourceInput
                  v-model="currentQuota.limits.memory"
                  type="memory"
                  :min="0"
                  :disabled="!editing"
                  placeholder="请输入内存 Limits"
                />
                <div class="quota-tip">
                  <AlertTriangle :size="14" />
                  <span>容器可使用的最大内存资源，超出会被 OOM Kill</span>
                </div>
              </div>

              <!-- 内存配额示例 -->
              <div class="quota-examples" v-if="editing">
                <div class="examples-title">
                  <Lightbulb :size="14" />
                  <span>常用配置参考</span>
                </div>
                <div class="examples-grid">
                  <div class="example-item" @click="applyMemoryExample('128Mi', '256Mi')">
                    <div class="example-name">轻量应用</div>
                    <div class="example-value">128Mi / 256Mi</div>
                  </div>
                  <div class="example-item" @click="applyMemoryExample('512Mi', '1Gi')">
                    <div class="example-name">常规应用</div>
                    <div class="example-value">512Mi / 1Gi</div>
                  </div>
                  <div class="example-item" @click="applyMemoryExample('2Gi', '4Gi')">
                    <div class="example-name">内存密集</div>
                    <div class="example-value">2Gi / 4Gi</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 配额预览 -->
        <div v-show="activeResourceType === 'preview'" class="config-section">
          <div class="quota-preview-card">
            <div class="preview-header">
              <Eye :size="18" />
              <h4>资源配额预览</h4>
            </div>

            <div class="preview-content">
              <!-- CPU 预览 -->
              <div class="preview-group cpu-group">
                <div class="group-title">
                  <Cpu :size="16" />
                  <span>CPU 配额</span>
                </div>
                <div class="preview-items">
                  <div class="preview-item">
                    <span class="item-label">Requests</span>
                    <span class="item-value" :class="{ empty: !currentQuota.requests.cpu }">
                      {{ currentQuota.requests.cpu || '未设置' }}
                    </span>
                  </div>
                  <div class="preview-item">
                    <span class="item-label">Limits</span>
                    <span class="item-value" :class="{ empty: !currentQuota.limits.cpu }">
                      {{ currentQuota.limits.cpu || '未设置' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="preview-divider"></div>

              <!-- 内存预览 -->
              <div class="preview-group memory-group">
                <div class="group-title">
                  <HardDrive :size="16" />
                  <span>内存配额</span>
                </div>
                <div class="preview-items">
                  <div class="preview-item">
                    <span class="item-label">Requests</span>
                    <span class="item-value" :class="{ empty: !currentQuota.requests.memory }">
                      {{ currentQuota.requests.memory || '未设置' }}
                    </span>
                  </div>
                  <div class="preview-item">
                    <span class="item-label">Limits</span>
                    <span class="item-value" :class="{ empty: !currentQuota.limits.memory }">
                      {{ currentQuota.limits.memory || '未设置' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 配额状态提示 -->
            <div class="quota-status">
              <div v-if="isQuotaValid()" class="status-item success">
                <CheckCircle :size="16" />
                <span>配额配置有效</span>
              </div>
              <div v-else class="status-item warning">
                <AlertCircle :size="16" />
                <span>请配置至少一项资源配额</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ElEmpty v-else description="请选择一个容器" :image-size="80" />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Cpu,
    HardDrive,
    Info,
    Edit,
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Eye,
    Lightbulb,
    Save
  } from 'lucide-vue-next'
  import {
    getResourceQuotaApi,
    updateResourceQuotaApi,
    type OnecProjectVersion,
    type ContainerResources,
    type ResourceRequirements
  } from '@/api'
  import ResourceInput from '@/views/workspace/management/subpage/dialog/components/ResourceInput.vue'

  interface Props {
    version: OnecProjectVersion
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  const loading = ref(false)
  const saving = ref(false)
  const editing = ref(false)
  const activeResourceType = ref('cpu')

  const containers = ref<ContainerResources[]>([])
  const selectedContainer = ref('')

  interface QuotaForm {
    requests: { cpu: string; memory: string }
    limits: { cpu: string; memory: string }
  }

  const currentQuota = ref<QuotaForm>({
    requests: { cpu: '', memory: '' },
    limits: { cpu: '', memory: '' }
  })

  const originalQuota = ref<QuotaForm>({
    requests: { cpu: '', memory: '' },
    limits: { cpu: '', memory: '' }
  })

  const loadResourceQuota = async () => {
    loading.value = true
    try {
      const response = await getResourceQuotaApi(props.version.id)
      containers.value = response.containers || []

      if (containers.value.length > 0 && !selectedContainer.value) {
        selectedContainer.value = containers.value[0].containerName
        updateCurrentQuota()
      }
    } catch (error) {
      console.error('[资源配额] 加载失败:', error)
    } finally {
      loading.value = false
    }
  }

  const updateCurrentQuota = () => {
    const container = containers.value.find((c) => c.containerName === selectedContainer.value)
    if (container) {
      currentQuota.value = {
        requests: {
          cpu: container.resources.requests?.cpu || '',
          memory: container.resources.requests?.memory || ''
        },
        limits: {
          cpu: container.resources.limits?.cpu || '',
          memory: container.resources.limits?.memory || ''
        }
      }
      originalQuota.value = JSON.parse(JSON.stringify(currentQuota.value))
    }
  }

  const handleContainerChange = () => {
    updateCurrentQuota()
  }

  const startEdit = () => {
    editing.value = true
  }

  const handleSave = async () => {
    if (!selectedContainer.value) return

    try {
      await ElMessageBox.confirm('确定要保存资源配额配置吗？', '确认保存', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      saving.value = true

      const resources: ResourceRequirements = {}

      if (currentQuota.value.requests.cpu || currentQuota.value.requests.memory) {
        resources.requests = {}
        if (currentQuota.value.requests.cpu) {
          resources.requests.cpu = currentQuota.value.requests.cpu
        }
        if (currentQuota.value.requests.memory) {
          resources.requests.memory = currentQuota.value.requests.memory
        }
      }

      if (currentQuota.value.limits.cpu || currentQuota.value.limits.memory) {
        resources.limits = {}
        if (currentQuota.value.limits.cpu) {
          resources.limits.cpu = currentQuota.value.limits.cpu
        }
        if (currentQuota.value.limits.memory) {
          resources.limits.memory = currentQuota.value.limits.memory
        }
      }

      await updateResourceQuotaApi(props.version.id, {
        containerName: selectedContainer.value,
        resources
      })

      ElMessage.success('资源配额保存成功')
      editing.value = false
      await loadResourceQuota()
      emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('[资源配额] 保存失败:', error)
      }
    } finally {
      saving.value = false
    }
  }

  const handleCancel = () => {
    editing.value = false
    currentQuota.value = JSON.parse(JSON.stringify(originalQuota.value))
  }

  const hasQuota = (container: ContainerResources) => {
    return !!(
      container.resources.requests?.cpu ||
      container.resources.requests?.memory ||
      container.resources.limits?.cpu ||
      container.resources.limits?.memory
    )
  }

  const isQuotaValid = () => {
    return !!(
      currentQuota.value.requests.cpu ||
      currentQuota.value.requests.memory ||
      currentQuota.value.limits.cpu ||
      currentQuota.value.limits.memory
    )
  }

  const applyCpuExample = (requests: string, limits: string) => {
    if (!editing.value) return
    currentQuota.value.requests.cpu = requests
    currentQuota.value.limits.cpu = limits
    ElMessage.success('已应用配置示例')
  }

  const applyMemoryExample = (requests: string, limits: string) => {
    if (!editing.value) return
    currentQuota.value.requests.memory = requests
    currentQuota.value.limits.memory = limits
    ElMessage.success('已应用配置示例')
  }

  watch(
    () => props.refreshTrigger,
    (newVal) => {
      if (newVal && newVal > 0) {
        editing.value = false
        loadResourceQuota()
      }
    }
  )

  onMounted(() => {
    loadResourceQuota()
  })

  defineExpose({
    editing,
    hasUnsavedChanges: () => {
      if (!editing.value) return false

      const current = JSON.stringify(currentQuota.value)
      const original = JSON.stringify(originalQuota.value)

      return current !== original
    }
  })
</script>

<style lang="scss" scoped>
  .resource-quota-management {
    height: 100%;
    display: flex;
    flex-direction: column;

    .container-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #fff;
      border-bottom: 1px solid var(--el-border-color);
      flex-shrink: 0;

      label {
        font-weight: 500;
        color: #606266;
        font-size: 14px;
        flex-shrink: 0;
      }

      .container-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .selector-actions {
        margin-left: auto;
        display: flex;
        gap: 8px;

        :deep(.el-button) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .loading-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .config-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 20px;

      .resource-type-selector {
        margin-bottom: 16px;

        .type-radio-group {
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
          }
        }
      }

      .config-content {
        .config-section {
          min-height: 300px;

          .resource-config {
            padding: 20px;
            border-radius: 8px;

            &.cpu-config {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #0ea5e9;
            }

            &.memory-config {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #22c55e;
            }

            .config-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid rgba(0, 0, 0, 0.06);

              h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #303133;
              }
            }

            .config-body {
              .quota-item {
                margin-bottom: 24px;

                &:last-of-type {
                  margin-bottom: 20px;
                }

                .quota-label {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 8px;
                  font-size: 14px;
                  font-weight: 500;
                  color: #606266;

                  .icon-success {
                    color: #22c55e;
                  }

                  .icon-warning {
                    color: #f59e0b;
                  }

                  .icon-danger {
                    color: #ef4444;
                  }
                }

                .quota-tip {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-top: 6px;
                  font-size: 12px;
                  color: #909399;
                  line-height: 1.5;
                }
              }

              .quota-examples {
                padding: 16px;
                background: white;
                border-radius: 6px;
                border: 1px solid #e4e7ed;

                .examples-title {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 12px;
                  font-size: 13px;
                  font-weight: 500;
                  color: #606266;
                }

                .examples-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 8px;

                  .example-item {
                    padding: 10px;
                    background: #f5f7fa;
                    border: 1px solid #e4e7ed;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;

                    &:hover {
                      border-color: #409eff;
                      background: #ecf5ff;
                    }

                    .example-name {
                      font-size: 12px;
                      color: #909399;
                      margin-bottom: 4px;
                    }

                    .example-value {
                      font-size: 13px;
                      font-weight: 600;
                      color: #303133;
                      font-family: 'Monaco', monospace;
                    }
                  }
                }
              }
            }
          }

          .quota-preview-card {
            padding: 20px;
            background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
            border: 2px solid #a855f7;
            border-radius: 8px;

            .preview-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid rgba(168, 85, 247, 0.2);

              h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #7c3aed;
              }
            }

            .preview-content {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;

              .preview-group {
                flex: 1;

                .group-title {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 12px;
                  font-size: 14px;
                  font-weight: 600;
                  color: #606266;
                }

                .preview-items {
                  display: flex;
                  flex-direction: column;
                  gap: 8px;

                  .preview-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 14px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid rgba(0, 0, 0, 0.06);

                    .item-label {
                      font-size: 13px;
                      color: #6b7280;
                      font-weight: 500;
                    }

                    .item-value {
                      font-size: 13px;
                      color: #1f2937;
                      font-family: 'Monaco', monospace;
                      font-weight: 600;

                      &.empty {
                        color: #9ca3af;
                        font-style: italic;
                      }
                    }
                  }
                }
              }

              .preview-divider {
                width: 2px;
                background: linear-gradient(
                  to bottom,
                  transparent,
                  rgba(168, 85, 247, 0.3),
                  transparent
                );
                border-radius: 2px;
              }
            }

            .quota-status {
              padding: 12px;
              background: white;
              border-radius: 6px;

              .status-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                font-weight: 500;

                &.success {
                  color: #22c55e;
                }

                &.warning {
                  color: #f59e0b;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
