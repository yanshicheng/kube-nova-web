<!-- /src/views/project/version/components/container-viewer.vue -->
<template>
  <ElDialog
    v-model="visible"
    :title="`容器信息 - ${podName}`"
    width="900px"
    top="5vh"
    class="container-viewer-dialog"
    @closed="handleClosed"
  >
    <!-- 加载中 -->
    <div v-if="loading" class="dialog-loading">
      <ElIcon class="is-loading" :size="32">
        <LoaderIcon />
      </ElIcon>
      <span>加载容器信息中...</span>
    </div>

    <!-- 容器内容 -->
    <div v-else-if="containerData" class="container-dialog-content">
      <!-- 容器统计卡片 -->
      <div class="stats-cards">
        <div v-if="containerData.initContainers?.length" class="stat-card init-container-card">
          <div class="stat-icon">
            <Box :size="22" />
          </div>
          <div class="stat-content">
            <div class="stat-label">Init Containers</div>
            <div class="stat-value">{{ containerData.initContainers.length }}</div>
          </div>
        </div>

        <div v-if="containerData.containers?.length" class="stat-card main-container-card">
          <div class="stat-icon">
            <Package :size="22" />
          </div>
          <div class="stat-content">
            <div class="stat-label">主容器</div>
            <div class="stat-value">{{ containerData.containers.length }}</div>
          </div>
        </div>

        <div
          v-if="containerData.ephemeralContainers?.length"
          class="stat-card ephemeral-container-card"
        >
          <div class="stat-icon">
            <Zap :size="22" />
          </div>
          <div class="stat-content">
            <div class="stat-label">临时容器</div>
            <div class="stat-value">{{ containerData.ephemeralContainers.length }}</div>
          </div>
        </div>
      </div>

      <!-- 容器列表 -->
      <div class="containers-list">
        <!-- Init Containers -->
        <div v-if="containerData.initContainers?.length" class="container-section">
          <div class="section-header init-header">
            <Box :size="16" />
            <span>Init Containers</span>
            <ElTag type="info" size="small">{{ containerData.initContainers.length }}</ElTag>
          </div>
          <div class="container-items">
            <div
              v-for="container in containerData.initContainers"
              :key="container.name"
              class="container-item"
            >
              <div class="container-header">
                <div class="container-name">
                  <Package :size="14" />
                  <span>{{ container.name }}</span>
                </div>
              </div>
              <div class="container-image">
                <code class="image-text">{{ container.image }}</code>
                <ElButton
                  :icon="Copy"
                  size="small"
                  type="primary"
                  text
                  @click="copyToClipboard(container.image)"
                >
                  复制镜像
                </ElButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Containers -->
        <div v-if="containerData.containers?.length" class="container-section">
          <div class="section-header main-header">
            <Package :size="16" />
            <span>主容器</span>
            <ElTag type="success" size="small">{{ containerData.containers.length }}</ElTag>
          </div>
          <div class="container-items">
            <div
              v-for="container in containerData.containers"
              :key="container.name"
              class="container-item"
            >
              <div class="container-header">
                <div class="container-name">
                  <Package :size="14" />
                  <span>{{ container.name }}</span>
                </div>
              </div>
              <div class="container-image">
                <code class="image-text">{{ container.image }}</code>
                <ElButton
                  :icon="Copy"
                  size="small"
                  type="primary"
                  text
                  @click="copyToClipboard(container.image)"
                >
                  复制镜像
                </ElButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Ephemeral Containers -->
        <div v-if="containerData.ephemeralContainers?.length" class="container-section">
          <div class="section-header ephemeral-header">
            <Zap :size="16" />
            <span>临时容器</span>
            <ElTag type="warning" size="small">{{
              containerData.ephemeralContainers.length
            }}</ElTag>
          </div>
          <div class="container-items">
            <div
              v-for="container in containerData.ephemeralContainers"
              :key="container.name"
              class="container-item"
            >
              <div class="container-header">
                <div class="container-name">
                  <Package :size="14" />
                  <span>{{ container.name }}</span>
                </div>
              </div>
              <div class="container-image">
                <code class="image-text">{{ container.image }}</code>
                <ElButton
                  :icon="Copy"
                  size="small"
                  type="primary"
                  text
                  @click="copyToClipboard(container.image)"
                >
                  复制镜像
                </ElButton>
              </div>
            </div>
          </div>
        </div>

        <!-- 无容器数据 -->
        <div
          v-if="
            !containerData.initContainers?.length &&
            !containerData.containers?.length &&
            !containerData.ephemeralContainers?.length
          "
          class="empty-container"
        >
          <ElEmpty description="暂无容器数据" :image-size="120" />
        </div>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-else class="dialog-error">
      <ElEmpty description="加载容器信息失败" :image-size="120">
        <ElButton type="primary" @click="emit('retry')">重试</ElButton>
      </ElEmpty>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElIcon } from 'element-plus'
  import { Box, Package, Zap, Copy, Loader as LoaderIcon } from 'lucide-vue-next'
  import { useClipboard } from '@vueuse/core'
  import type { ContainerInfoList } from '@/api'

  interface Props {
    modelValue: boolean
    podName: string
    containerData: ContainerInfoList | null
    loading?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'retry'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  })

  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 复制到剪贴板
  const { copy, isSupported } = useClipboard()
  const copyToClipboard = async (text: string) => {
    if (!isSupported) {
      return
    }
    try {
      await copy(text)
      ElMessage.success('已复制到剪贴板')
    } catch (error) {
    }
  }

  const handleClosed = () => {
    // 对话框关闭时的清理操作
  }
</script>

<style lang="scss" scoped>
  .container-viewer-dialog {
    .dialog-loading,
    .dialog-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;
      color: #909399;
      font-size: 14px;
    }

    .container-dialog-content {
      // 统计卡片
      .stats-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 28px;

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 12px;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          }

          &.init-container-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.main-container-card {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }

          &.ephemeral-container-card {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }

          .stat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
          }

          .stat-content {
            flex: 1;

            .stat-label {
              font-size: 13px;
              opacity: 0.95;
              margin-bottom: 6px;
              font-weight: 500;
            }

            .stat-value {
              font-size: 32px;
              font-weight: 700;
              line-height: 1;
            }
          }
        }
      }

      // 容器列表
      .containers-list {
        .container-section {
          margin-bottom: 24px;

          &:last-child {
            margin-bottom: 0;
          }

          .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 18px;
            border-radius: 8px;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            border-left: 4px solid;

            &.init-header {
              background: linear-gradient(to right, rgba(102, 126, 234, 0.08), transparent);
              border-left-color: #667eea;
            }

            &.main-header {
              background: linear-gradient(to right, rgba(67, 233, 123, 0.08), transparent);
              border-left-color: #43e97b;
            }

            &.ephemeral-header {
              background: linear-gradient(to right, rgba(250, 112, 154, 0.08), transparent);
              border-left-color: #fa709a;
            }
          }

          .container-items {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .container-item {
              background: #fff;
              border: 1px solid #ebeef5;
              border-radius: 8px;
              overflow: hidden;
              transition: all 0.3s ease;

              &:hover {
                border-color: var(--el-color-primary);
                box-shadow: 0 2px 12px rgba(64, 158, 255, 0.12);
                transform: translateX(2px);
              }

              .container-header {
                padding: 14px 16px;
                background: linear-gradient(to right, #fafafa, #fff);
                border-bottom: 1px solid #f0f0f0;

                .container-name {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 14px;
                  font-weight: 600;
                  color: #303133;
                }
              }

              .container-image {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 16px;
                background: #fafafa;

                .image-text {
                  flex: 1;
                  font-size: 12px;
                  color: #606266;
                  font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
                  background: #fff;
                  padding: 6px 10px;
                  border-radius: 4px;
                  border: 1px solid #e4e7ed;
                  word-break: break-all;
                }
              }
            }
          }
        }

        .empty-container {
          padding: 60px 0;
        }
      }
    }

    :deep(.el-dialog__body) {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }
  }
</style>
