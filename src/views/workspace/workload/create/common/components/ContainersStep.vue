<template>
  <div class="containers-step">
    <!-- 容器类型选择 -->
    <div class="container-type-selector">
      <ElRadioGroup v-model="activeContainerType" size="default" @change="handleTypeChange">
        <ElRadioButton value="init">
          <ElBadge
            :value="initContainers.length"
            :hidden="initContainers.length === 0"
            type="warning"
          >
            初始化容器
          </ElBadge>
        </ElRadioButton>
        <ElRadioButton value="main">
          <ElBadge
            :value="mainContainers.length"
            :hidden="mainContainers.length === 0"
            type="primary"
          >
            主容器 *
          </ElBadge>
        </ElRadioButton>
      </ElRadioGroup>

      <ElButton type="primary" @click="addContainer" class="add-container-btn">
        <Plus :size="16" />
        <span>添加容器</span>
      </ElButton>
    </div>

    <ElDivider />

    <!-- 容器列表面板 -->
    <div class="containers-panel">
      <!-- 初始化容器 -->
      <div v-show="activeContainerType === 'init'">
        <ElEmpty v-if="initContainers.length === 0" description="暂无初始化容器" :image-size="50">
          <ElButton type="warning" size="small" @click="addContainer">
            <Plus :size="14" />
            添加容器
          </ElButton>
        </ElEmpty>

        <ElScrollbar v-else height="120px" class="container-scrollbar">
          <div class="container-cards">
            <div
              v-for="container in initContainers"
              :key="`init-${container.id}`"
              class="container-card init-card"
              :class="{ active: selectedContainerId === container.id }"
              @click="selectContainer(container.id)"
            >
              <!-- ⭐ 删除按钮 -->
              <div class="delete-btn" @click.stop="removeContainer(container.id)">
                <X :size="14" />
              </div>

              <!-- ⭐ 状态标签 -->
              <div class="card-status-badge">
                <ElTag
                  v-if="validateContainer(container).valid"
                  type="success"
                  size="small"
                  effect="dark"
                >
                  <CheckCircle2 :size="10" />
                  <span>就绪</span>
                </ElTag>
                <ElTag v-else type="info" size="small">
                  <AlertCircle :size="10" />
                  <span>待配置</span>
                </ElTag>
              </div>

              <div class="card-content">
                <div class="card-header">
                  <div class="card-icon init">
                    <Loader :size="16" />
                  </div>
                  <ElTag size="small" type="warning" effect="plain">初始化</ElTag>
                </div>

                <div class="card-body">
                  <!-- 容器名称 -->
                  <div class="card-name-wrapper">
                    <ElInput
                      v-if="editingContainerId === container.id"
                      v-model="container.name"
                      size="small"
                      @blur="stopEditingName"
                      @keyup.enter="stopEditingName"
                      @click.stop
                      :ref="(el) => setEditInputRef(container.id, el)"
                    />
                    <div v-else class="card-name" @dblclick="startEditingName(container.id)">
                      <span class="name-text">{{ container.name }}</span>
                      <Edit2 :size="12" class="edit-icon" />
                    </div>
                  </div>

                  <!-- 镜像信息 -->
                  <div class="card-image-section">
                    <span class="image-label">镜像</span>
                    <ElTooltip
                      v-if="container.image"
                      :content="container.image"
                      placement="bottom"
                      :show-after="300"
                    >
                      <span class="card-image">{{ formatImageName(container.image) }}</span>
                    </ElTooltip>
                    <span v-else class="card-image-empty">未配置</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElScrollbar>
      </div>

      <!-- 主容器 -->
      <div v-show="activeContainerType === 'main'">
        <ElEmpty
          v-if="mainContainers.length === 0"
          description="至少需要一个主容器"
          :image-size="50"
        >
          <ElButton type="primary" size="small" @click="addContainer">
            <Plus :size="14" />
            添加容器
          </ElButton>
        </ElEmpty>

        <ElScrollbar v-else height="120px" class="container-scrollbar">
          <div class="container-cards">
            <div
              v-for="container in mainContainers"
              :key="`main-${container.id}`"
              class="container-card main-card"
              :class="{ active: selectedContainerId === container.id }"
              @click="selectContainer(container.id)"
            >
              <!-- ⭐ 删除按钮 -->
              <div
                v-if="mainContainers.length > 1"
                class="delete-btn"
                @click.stop="removeContainer(container.id)"
              >
                <X :size="14" />
              </div>

              <!-- ⭐ 状态标签 -->
              <div class="card-status-badge">
                <ElTag
                  v-if="validateContainer(container).valid"
                  type="success"
                  size="small"
                  effect="dark"
                >
                  <CheckCircle2 :size="10" />
                  <span>就绪</span>
                </ElTag>
                <ElTag v-else type="warning" size="small">
                  <AlertCircle :size="10" />
                  <span>待配置</span>
                </ElTag>
              </div>

              <div class="card-content">
                <div class="card-header">
                  <div class="card-icon main">
                    <Box :size="16" />
                  </div>
                  <ElTag type="primary" size="small" effect="plain">主容器</ElTag>
                </div>

                <div class="card-body">
                  <!-- 容器名称 -->
                  <div class="card-name-wrapper">
                    <ElInput
                      v-if="editingContainerId === container.id"
                      v-model="container.name"
                      size="small"
                      @blur="stopEditingName"
                      @keyup.enter="stopEditingName"
                      @click.stop
                      :ref="(el) => setEditInputRef(container.id, el)"
                    />
                    <div v-else class="card-name" @dblclick="startEditingName(container.id)">
                      <span class="name-text">{{ container.name }}</span>
                      <Edit2 :size="12" class="edit-icon" />
                    </div>
                  </div>

                  <!-- 镜像信息 -->
                  <div class="card-image-section">
                    <span class="image-label">镜像</span>
                    <ElTooltip
                      v-if="container.image"
                      :content="container.image"
                      placement="bottom"
                      :show-after="300"
                    >
                      <span class="card-image">{{ formatImageName(container.image) }}</span>
                    </ElTooltip>
                    <span v-else class="card-image-empty">未配置</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElScrollbar>
      </div>
    </div>

    <!-- 分隔线：只在有选中容器时显示 -->
    <ElDivider v-if="selectedContainer">
      <span class="config-title">
        <span
          :style="{ color: selectedContainer.type === 'init' ? '#e6a23c' : '#409eff' }"
        >
          正在配置: {{ selectedContainer.name }}
        </span>
        <ElTooltip content="双击容器名称可以重命名" placement="top">
          <Info :size="14" class="info-icon" />
        </ElTooltip>
      </span>
    </ElDivider>

    <!-- 容器详细配置：只在有选中容器时显示 -->
    <div v-if="selectedContainer" class="container-detail">
      <ContainerTabs />
    </div>

    <!-- 提示信息 -->
    <div v-else class="config-tips">
      <ElAlert type="info" :closable="false">
        <template #title>
          <div style="display: flex; align-items: center; gap: 8px">
            <Info :size="16" />
            容器配置说明
          </div>
        </template>
        <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; line-height: 20px">
          <li>Pod 必须包含至少一个主容器才能运行</li>
          <li>初始化容器会在主容器启动前按顺序执行</li>
          <li>双击容器卡片名称可以编辑容器名称</li>
          <li>点击容器卡片选择后，下方会显示详细配置选项</li>
          <li>必须配置容器名称和镜像地址才能通过验证</li>
        </ul>
      </ElAlert>
    </div>

    <!-- 验证错误提示 - 增强版 -->
    <ElAlert
      v-if="validationErrors.length > 0"
      type="error"
      :closable="false"
      style="margin-top: 16px"
    >
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px">
          <AlertCircle :size="16" />
          <strong>配置验证失败 - 请修复以下问题：</strong>
        </div>
      </template>
      <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; line-height: 24px">
        <li v-for="(error, index) in validationErrors" :key="index" style="color: #f56c6c">
          {{ error }}
        </li>
      </ul>
    </ElAlert>

    <!-- ⭐ 新增：容器列表快速验证状态 -->
    <div v-if="mainContainers.length > 0 || initContainers.length > 0" class="validation-summary">
      <ElCard shadow="never" style="background: #f5f7fa; border: 1px dashed #dcdfe6">
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">主容器：</span>
            <ElTag
              :type="mainContainers.length > 0 ? 'success' : 'warning'"
              size="small"
              effect="plain"
            >
              {{ mainContainers.length }} 个
            </ElTag>
          </div>
          <div class="summary-item">
            <span class="summary-label">初始化容器：</span>
            <ElTag type="info" size="small" effect="plain">{{ initContainers.length }} 个</ElTag>
          </div>
          <div class="summary-item">
            <span class="summary-label">配置完整：</span>
            <ElTag
              :type="validationErrors.length === 0 ? 'success' : 'danger'"
              size="small"
              effect="dark"
            >
              {{
                validationErrors.length === 0 ? '✓ 已完成' : `✗ ${validationErrors.length} 个问题`
              }}
            </ElTag>
          </div>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, nextTick, watch } from 'vue'
  import { useContainersStore } from '@/store/workload'
  import ContainerTabs from '../container/ContainerTabs.vue'
  import { Plus, X, Loader, Box, Edit2, CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'
  import { ElMessage } from 'element-plus'

  const containersStore = useContainersStore()

  const emit = defineEmits<{
    validate: [result: { valid: boolean; errors: string[] }]
  }>()

  const initContainers = computed(() => containersStore.initContainers)
  const mainContainers = computed(() => containersStore.mainContainers)

  const selectedContainerId = computed(() => containersStore.selectedContainerId)
  const selectedContainer = computed(() => containersStore.selectedContainer)
  const editingContainerId = computed(() => containersStore.editingContainerId)

  const activeContainerType = ref<'init' | 'main'>('main')
  const editInputRefs = ref<Map<string, any>>(new Map())

  const validationErrors = ref<string[]>([])

  function addContainer() {
    containersStore.addContainer(activeContainerType.value)
    validationErrors.value = []
  }

  function removeContainer(id: string) {
    const success = containersStore.removeContainer(id)
    if (!success && mainContainers.value.length === 1) {
    }
    validationErrors.value = []
  }

  function selectContainer(id: string) {
    containersStore.selectContainer(id)
    const container = containersStore.getSelectedContainer()
    if (container) {
      activeContainerType.value = container.type
    }
    validationErrors.value = []
  }

  function startEditingName(id: string) {
    containersStore.startEditingName(id)
    nextTick(() => {
      const input = editInputRefs.value.get(id)
      if (input) {
        input.focus()
      }
    })
  }

  function stopEditingName() {
    containersStore.stopEditingName()
  }

  function setEditInputRef(id: string, el: any) {
    if (el) {
      editInputRefs.value.set(id, el)
    }
  }

  function handleTypeChange(type: 'init' | 'main') {
    const containers = type === 'init' ? initContainers.value : mainContainers.value
    if (containers.length > 0) {
      containersStore.selectContainer(containers[0].id)
    } else {
      containersStore.selectContainer(null)
    }
  }

  function formatImageName(image: string): string {
    if (!image) return ''

    const parts = image.split('/')
    const lastPart = parts[parts.length - 1]

    if (lastPart.length > 24) {
      return lastPart.substring(0, 21) + '...'
    }

    return lastPart
  }

  function validateContainer(container: any) {
    return containersStore.validateContainer(container)
  }

  function validate() {
    const result = containersStore.validate()
    validationErrors.value = result.errors

    if (!result.valid) {
      ElMessage.error({
        message: '容器配置验证失败，请检查配置',
        duration: 3000
      })
    }

    emit('validate', result)

    return result.valid
  }

  watch(
    () => [mainContainers.value, initContainers.value],
    () => {
      const result = containersStore.validate()
      validationErrors.value = result.errors
      emit('validate', result)
    },
    { deep: true, immediate: true }
  )

  watch(
    () => selectedContainerId.value,
    () => {
      const result = containersStore.validate()
      validationErrors.value = result.errors
      emit('validate', result)
    }
  )

  function fillMockData() {
    const initContainer = containersStore.addContainer('init')
    containersStore.updateContainer(initContainer.id, {
      name: 'init-db',
      image: 'busybox:1.35',
      command: ['/bin/sh'],
      args: ['-c', 'echo "Initializing database..."; sleep 5'],
      resources: {
        requests: { cpu: '50m', memory: '64Mi' },
        limits: { cpu: '100m', memory: '128Mi' }
      }
    })

    if (mainContainers.value.length > 0) {
      containersStore.updateContainer(mainContainers.value[0].id, {
        name: 'nginx',
        image: 'nginx:1.21-alpine',
        imagePullPolicy: 'IfNotPresent',
        ports: [
          {
            name: 'tcp-80',
            containerPort: 80,
            protocol: 'TCP'
          },
          {
            name: 'tcp-443',
            containerPort: 443,
            protocol: 'TCP'
          }
        ],
        env: [
          { name: 'ENVIRONMENT', value: 'production' },
          { name: 'LOG_LEVEL', value: 'info' }
        ],
        resources: {
          requests: { cpu: '100m', memory: '128Mi' },
          limits: { cpu: '500m', memory: '512Mi' }
        },
        livenessProbe: {
          httpGet: {
            path: '/health',
            port: 80,
            scheme: 'HTTP'
          },
          initialDelaySeconds: 30,
          periodSeconds: 10,
          timeoutSeconds: 5,
          successThreshold: 1,
          failureThreshold: 3
        },
        readinessProbe: {
          httpGet: {
            path: '/ready',
            port: 80,
            scheme: 'HTTP'
          },
          initialDelaySeconds: 10,
          periodSeconds: 5,
          timeoutSeconds: 3,
          successThreshold: 1,
          failureThreshold: 3
        }
      })
    }

    const sidecar = containersStore.addContainer('main')
    containersStore.updateContainer(sidecar.id, {
      name: 'log-collector',
      image: 'fluent/fluentd:v1.14-1',
      imagePullPolicy: 'IfNotPresent',
      env: [{ name: 'FLUENT_CONF', value: 'fluent.conf' }],
      resources: {
        requests: { cpu: '50m', memory: '64Mi' },
        limits: { cpu: '200m', memory: '256Mi' }
      }
    })

    if (mainContainers.value.length > 0) {
      containersStore.selectContainer(mainContainers.value[0].id)
    }

    ElMessage.success('已填充模拟数据')
  }

  function clearAllContainers() {
    containersStore.reset()
    validationErrors.value = []
    ElMessage.success('已清空所有容器')
  }

  function hasUnsavedChanges() {
    return containersStore.allContainers.some((c) => !c.name || !c.image)
  }

  defineExpose({
    validate,
    fillMockData,
    clearAllContainers,
    hasUnsavedChanges
  })
</script>

<style lang="scss" scoped>
  .containers-step {
    .container-type-selector {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .add-container-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.3s;
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
        border: none;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
        }

        span {
          font-size: 14px;
        }
      }
    }

    ::v-deep(.el-divider) {
      margin: 12px 0;

      .config-title {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;

        .info-icon {
          color: #909399;
          cursor: help;
          transition: color 0.3s;

          &:hover {
            color: #606266;
          }
        }
      }
    }

    .validation-summary {
      margin-top: 16px;

      .summary-content {
        display: flex;
        align-items: center;
        gap: 24px;
        font-size: 13px;

        .summary-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .summary-label {
            color: #606266;
            font-weight: 500;
          }
        }
      }
    }

    .containers-panel {
      margin-bottom: 16px;

      .container-scrollbar {
        ::v-deep(.el-scrollbar__wrap) {
          overflow-x: auto;
        }

        ::v-deep(.el-scrollbar__view) {
          display: inline-block;
          white-space: nowrap;
        }

        .container-cards {
          display: inline-flex;
          gap: 12px;
          padding: 4px;

          .container-card {
            position: relative;
            width: 220px;
            min-width: 220px;
            height: 100px;
            background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
            border: 2px solid #e8eaed;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            /* ⭐ 移除 overflow: hidden，让删除按钮可见 */

            &.init-card {
              &:hover {
                border-color: #e6a23c;
                background: linear-gradient(180deg, #ffffff 0%, #fdf6ec 100%);

                .delete-btn {
                  opacity: 1;
                  transform: scale(1) rotate(0deg);
                }
              }

              &.active {
                border-color: #e6a23c;
                background: linear-gradient(135deg, #fdf6ec 0%, #fef0dc 100%);
                box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
              }
            }

            &.main-card {
              &:hover {
                border-color: #409eff;
                background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);

                .delete-btn {
                  opacity: 1;
                  transform: scale(1) rotate(0deg);
                }
              }

              &.active {
                border-color: #409eff;
                background: linear-gradient(135deg, #e6f4ff 0%, #f0f7ff 100%);
                box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
              }
            }

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);

              .card-name {
                .edit-icon {
                  opacity: 1;
                }
              }
            }

            /* ⭐ 删除按钮 - 最高层级 */
            .delete-btn {
              position: absolute;
              top: -8px;
              right: -8px;
              width: 22px;
              height: 22px;
              background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
              border: 1.5px solid #f56c6c;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transform: scale(0.8) rotate(-90deg);
              transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              z-index: 20;
              cursor: pointer;
              color: #f56c6c;
              box-shadow: 0 2px 6px rgba(245, 108, 108, 0.4);

              &:hover {
                background: linear-gradient(135deg, #f56c6c 0%, #ff7676 100%);
                color: white;
                transform: scale(1.15) rotate(90deg);
                box-shadow: 0 3px 8px rgba(245, 108, 108, 0.5);
              }

              &:active {
                transform: scale(0.95) rotate(90deg);
              }
            }

            /* ⭐ 状态标签 - 左上角 */
            .card-status-badge {
              position: absolute;
              top: 8px;
              left: 8px;
              z-index: 10;

              ::v-deep(.el-tag) {
                font-size: 10px;
                padding: 2px 8px;
                height: 20px;
                display: inline-flex;
                align-items: center;
                gap: 3px;
                border-radius: 10px;
                font-weight: 500;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                border: none;

                span {
                  line-height: 1;
                }
              }
            }

            /* ⭐ 卡片内容区域 */
            .card-content {
              padding: 10px;
              padding-top: 34px;
              height: 100%;
              display: flex;
              flex-direction: column;
              border-radius: 12px;
              overflow: hidden;  /* ⭐ 只在内容区域隐藏溢出 */

              .card-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 8px;

                .card-icon {
                  width: 24px;
                  height: 24px;
                  background: #f5f7fa;
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: all 0.3s;

                  &.init {
                    background: linear-gradient(135deg, #fdf6ec 0%, #fef0dc 100%);
                    color: #e6a23c;
                  }

                  &.main {
                    background: linear-gradient(135deg, #e6f4ff 0%, #d9ecff 100%);
                    color: #409eff;
                  }
                }

                ::v-deep(.el-tag) {
                  font-size: 10px;
                  padding: 0 6px;
                  height: 18px;
                  line-height: 16px;
                }
              }

              .card-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 6px;

                .card-name-wrapper {
                  .card-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #303133;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: text;
                    padding: 2px 0;
                    line-height: 1.4;

                    .name-text {
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      flex: 1;
                    }

                    .edit-icon {
                      color: #909399;
                      opacity: 0;
                      transition: opacity 0.2s;
                      flex-shrink: 0;
                    }
                  }

                  ::v-deep(.el-input__wrapper) {
                    padding: 2px 6px;
                    font-size: 13px;
                    height: 24px;
                  }
                }

                .card-image-section {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  background: linear-gradient(135deg, #f8f9fa 0%, #f4f5f7 100%);
                  padding: 6px 8px;
                  border-radius: 6px;
                  border: 1px solid #e8eaed;
                  min-width: 0;

                  .image-label {
                    font-size: 11px;
                    color: #909399;
                    font-weight: 600;
                    flex-shrink: 0;
                    letter-spacing: 0.3px;
                  }

                  .card-image {
                    font-size: 11px;
                    color: #303133;
                    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                    background: #ffffff;
                    padding: 3px 6px;
                    border-radius: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 1;
                    min-width: 0;
                    border: 1px solid #e4e7ed;
                    font-weight: 500;
                  }

                  .card-image-empty {
                    font-size: 11px;
                    color: #c0c4cc;
                    font-style: italic;
                    font-weight: 400;
                  }
                }
              }
            }
          }
        }
      }
    }

    .config-tips {
      padding: 16px 0;
    }
  }
</style>