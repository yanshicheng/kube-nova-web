<template>
  <div class="update-management-container">
    <div class="config-layout">
      <!-- 左侧 Tabs -->
      <div class="tabs-sidebar">
        <ElMenu :default-active="activeTab" @select="handleTabChange" class="config-menu">
          <ElMenuItem index="image">
            <Box :size="16" />
            <span>更新镜像</span>
          </ElMenuItem>
          <ElMenuItem index="strategy">
            <Settings :size="16" />
            <span>更新策略</span>
          </ElMenuItem>
          <ElMenuItem index="history">
            <History :size="16" />
            <span>历史版本</span>
          </ElMenuItem>
        </ElMenu>
      </div>

      <!-- 右侧内容区 -->
      <div class="config-content">
        <!-- 更新镜像 -->
        <div v-show="activeTab === 'image'" v-loading="loadingContainers" class="config-section">
          <ElForm :model="imageForm" label-width="140px" label-position="left">
            <!-- 容器选择 -->
            <div class="section-header">
              <Box :size="16" />
              <span>容器选择</span>
            </div>

            <ElFormItem label="选择容器" required>
              <template #label>
                <span>选择容器</span>
                <ElTooltip content="选择要更新镜像的容器" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect
                v-model="imageForm.containerName"
                placeholder="选择容器"
                @change="handleContainerChange"
                :disabled="containers.length === 0"
              >
                <ElOption
                  v-for="container in containers"
                  :key="container.name"
                  :label="container.name"
                  :value="container.name"
                >
                  <div style="display: flex; align-items: center; gap: 8px">
                    <Box :size="14" />
                    <span>{{ container.name }}</span>
                  </div>
                </ElOption>
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="当前镜像" v-if="currentImage">
              <div class="current-image-display">
                <code>{{ currentImage }}</code>
              </div>
            </ElFormItem>

            <!-- 镜像搜索 -->
            <div class="section-header">
              <Search :size="16" />
              <span>镜像搜索</span>
            </div>

            <ElFormItem label="镜像搜索">
              <template #label>
                <span>镜像搜索</span>
                <ElTooltip content="快速搜索镜像，支持模糊匹配" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElInput
                v-model="imageSearch"
                placeholder="搜索镜像名称，如: nginx, redis..."
                clearable
              >
                <template #prefix>
                  <Search :size="16" />
                </template>
                <template #append>
                  <ElButton @click="handleImageSearchClick" :loading="searchingImages">
                    <Search :size="14" />
                    搜索
                  </ElButton>
                </template>
              </ElInput>
              <div v-if="searchApplied" class="search-hint">
                <Info :size="12" />
                <span>已应用搜索过滤，找到 {{ getTotalFilteredCount() }} 个结果</span>
                <ElButton text type="primary" size="small" @click="clearSearch">
                  清除过滤
                </ElButton>
              </div>
            </ElFormItem>

            <!-- 镜像配置 -->
            <div class="section-header">
              <Package :size="16" />
              <span>镜像配置</span>
            </div>

            <ElFormItem label="镜像仓库" required>
              <template #label>
                <span>镜像仓库</span>
                <ElTooltip content="选择镜像所在的仓库" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect
                v-model="imageConfig.registryUuid"
                placeholder="选择仓库"
                filterable
                :loading="loadingRegistries"
                @change="handleRegistryChange"
              >
                <ElOption
                  v-for="registry in displayRegistries"
                  :key="registry.registryUuid"
                  :label="registry.registryName"
                  :value="registry.registryUuid"
                >
                  <div class="registry-option">
                    <span>{{ registry.registryName }}</span>
                    <ElTag size="small" type="info">{{ registry.registryType }}</ElTag>
                  </div>
                </ElOption>
                <template #footer>
                  <div
                    v-if="registryPagination.hasMore"
                    v-loading="loadingRegistries"
                    class="select-loading-more"
                    @click="loadMoreRegistries"
                  >
                    <span v-if="!loadingRegistries">点击加载更多</span>
                  </div>
                </template>
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="项目/命名空间">
              <template #label>
                <span>项目/命名空间</span>
                <ElTooltip content="镜像所属的项目或命名空间" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect
                v-model="imageConfig.project"
                placeholder="选择项目"
                filterable
                :loading="loadingProjects"
                :disabled="!imageConfig.registryUuid"
                @change="handleProjectChange"
              >
                <ElOption
                  v-for="project in displayProjects"
                  :key="project.name"
                  :label="project.name"
                  :value="project.name"
                />
                <template #footer>
                  <div
                    v-if="projectPagination.hasMore"
                    v-loading="loadingProjects"
                    class="select-loading-more"
                    @click="loadMoreProjects"
                  >
                    <span v-if="!loadingProjects">点击加载更多</span>
                  </div>
                </template>
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="镜像名称">
              <template #label>
                <span>镜像名称</span>
                <ElTooltip content="选择具体的镜像" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect
                v-model="imageConfig.image"
                placeholder="选择镜像"
                filterable
                :loading="loadingImages"
                :disabled="!imageConfig.project"
                @change="handleImageChange"
              >
                <ElOption
                  v-for="img in displayImages"
                  :key="img.name"
                  :label="img.displayName"
                  :value="img.name"
                />
                <template #footer>
                  <div
                    v-if="imagePagination.hasMore"
                    v-loading="loadingImages"
                    class="select-loading-more"
                    @click="loadMoreImages"
                  >
                    <span v-if="!loadingImages">点击加载更多</span>
                  </div>
                </template>
              </ElSelect>
              <div v-if="imageConfig.project && images.length > 0" class="form-tip">
                共 {{ imagePagination.total }} 个镜像
                <span v-if="searchApplied && displayImages.length !== images.length">
                  （过滤后显示 {{ displayImages.length }} 个）
                </span>
              </div>
            </ElFormItem>

            <ElFormItem label="版本标签">
              <template #label>
                <span>版本标签</span>
                <ElTooltip content="选择镜像的版本标签" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElSelect
                v-model="imageConfig.tag"
                placeholder="选择标签"
                filterable
                :loading="loadingTags"
                :disabled="!imageConfig.image"
                @change="handleTagChange"
              >
                <ElOption
                  v-for="tag in displayTags"
                  :key="tag.name"
                  :label="tag.name"
                  :value="tag.name"
                >
                  <div class="tag-option">
                    <span>{{ tag.name }}</span>
                    <span class="tag-size">{{ tag.size }}</span>
                  </div>
                </ElOption>
                <template #footer>
                  <div
                    v-if="tagPagination.hasMore"
                    v-loading="loadingTags"
                    class="select-loading-more"
                    @click="loadMoreTags"
                  >
                    <span v-if="!loadingTags">点击加载更多</span>
                  </div>
                </template>
              </ElSelect>
            </ElFormItem>

            <!-- 完整镜像地址 -->
            <ElFormItem v-if="fullImageUrl" label="完整镜像地址">
              <template #label>
                <span>完整镜像地址</span>
                <ElTooltip content="新镜像的完整地址" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <div class="image-info-card">
                <div class="image-url">
                  <code>{{ fullImageUrl }}</code>
                  <ElButton text type="primary" @click="copyImageUrl" size="small">
                    <Copy :size="14" style="margin-right: 4px" />
                    复制
                  </ElButton>
                </div>
              </div>
            </ElFormItem>

            <!-- 操作按钮 -->
            <ElFormItem>
              <div class="form-actions">
                <ElButton
                  type="primary"
                  :loading="updatingImage"
                  :disabled="!imageForm.containerName || !fullImageUrl"
                  @click="handleUpdateImage"
                >
                  <Check :size="16" />
                  更新镜像
                </ElButton>
                <ElButton @click="resetImageForm">
                  <RotateCcw :size="16" />
                  重置
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </div>

        <!-- 更新策略 -->
        <div v-show="activeTab === 'strategy'" v-loading="loadingStrategy" class="config-section">
          <ElForm :model="strategyForm" label-width="140px" label-position="left">
            <!-- 策略类型选择 -->
            <div class="section-header">
              <Settings :size="16" />
              <span>策略类型</span>
            </div>

            <ElFormItem label="更新策略" required>
              <template #label>
                <span>更新策略</span>
                <ElTooltip :content="getStrategyTypeTooltip()" placement="top">
                  <HelpCircle :size="14" class="label-help-icon" />
                </ElTooltip>
              </template>
              <ElRadioGroup v-model="strategyForm.type" @change="handleStrategyTypeChange">
                <ElRadio
                  v-for="strategy in getAvailableStrategies()"
                  :key="strategy.value"
                  :value="strategy.value"
                >
                  {{ strategy.label }}
                  <ElTooltip :content="strategy.description" placement="top">
                    <HelpCircle :size="12" class="inline-help-icon" />
                  </ElTooltip>
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <!-- RollingUpdate 配置 -->
            <template v-if="strategyForm.type === 'RollingUpdate'">
              <div class="section-header">
                <Settings :size="16" />
                <span>滚动更新配置</span>
              </div>

              <!-- DaemonSet 特殊警告提示 -->
              <ElAlert
                v-if="isDaemonSet()"
                type="warning"
                :closable="false"
                show-icon
                style="margin-bottom: 20px"
              >
                <template #title>
                  <strong>DaemonSet 更新策略限制</strong>
                </template>
                <div style="line-height: 1.6; font-size: 13px">
                  <div style="margin-bottom: 8px">
                    <strong style="color: #e6a23c">⚠️ 重要：</strong>
                    <span style="color: #606266">
                      <code
                        style="
                          background: #fff;
                          padding: 2px 6px;
                          border-radius: 3px;
                          color: #e6a23c;
                        "
                        >maxSurge</code
                      >
                      和
                      <code
                        style="
                          background: #fff;
                          padding: 2px 6px;
                          border-radius: 3px;
                          color: #e6a23c;
                        "
                        >maxUnavailable</code
                      >
                      不能同时大于 0
                    </span>
                  </div>
                  <div style="color: #909399; font-size: 12px">
                    • 使用 <code>maxSurge > 0</code> 时，<code>maxUnavailable</code> 必须为
                    0（先创建新 Pod 再删除旧 Pod）
                    <br />
                    • 使用 <code>maxUnavailable > 0</code> 时，<code>maxSurge</code> 必须为
                    0（先删除旧 Pod 再创建新 Pod）
                  </div>
                </div>
              </ElAlert>

              <!-- maxSurge - Deployment 和 DaemonSet -->
              <ElFormItem
                v-if="supportedFields.maxSurge"
                label="最大额外副本"
                :error="getMaxSurgeError()"
              >
                <template #label>
                  <span>最大额外副本</span>
                  <ElTooltip
                    :content="
                      isDaemonSet()
                        ? '更新期间可创建的额外 Pod 数（K8s 1.22+ 支持）。设置 > 0 时，最大不可用副本会自动设为 0'
                        : '更新期间可创建的额外 Pod 数，默认为 25%'
                    "
                    placement="top"
                  >
                    <HelpCircle :size="14" class="label-help-icon" />
                  </ElTooltip>
                </template>
                <ElInput
                  v-model="strategyForm.rollingUpdate.maxSurge"
                  :placeholder="isDaemonSet() ? '如: 0 或 10%' : '如: 1 或 25%'"
                  style="max-width: 200px"
                  @input="handleMaxSurgeChange"
                  :class="{ 'has-conflict': isDaemonSet() && hasConflict() }"
                >
                  <template #append>Pod</template>
                </ElInput>
                <div
                  class="form-tip"
                  :class="{ 'tip-warning': isDaemonSet() && isMaxSurgeNonZero() }"
                >
                  <template v-if="isDaemonSet()">
                    <span v-if="isMaxSurgeNonZero()" style="color: #e6a23c">
                      ⚠️ 已设置 > 0，最大不可用副本将自动设为 0
                    </span>
                    <span v-else> 可以是数字或百分比，默认为 0 </span>
                  </template>
                  <template v-else> 可以是数字或百分比，默认为 25% </template>
                </div>
              </ElFormItem>

              <!-- maxUnavailable - 所有类型 -->
              <ElFormItem
                v-if="supportedFields.maxUnavailable"
                label="最大不可用副本"
                :error="getMaxUnavailableError()"
              >
                <template #label>
                  <span>最大不可用副本</span>
                  <ElTooltip :content="getMaxUnavailableTooltip()" placement="top">
                    <HelpCircle :size="14" class="label-help-icon" />
                  </ElTooltip>
                </template>
                <ElInput
                  v-model="strategyForm.rollingUpdate.maxUnavailable"
                  :placeholder="getMaxUnavailablePlaceholder()"
                  style="max-width: 200px"
                  @input="handleMaxUnavailableChange"
                  :class="{ 'has-conflict': isDaemonSet() && hasConflict() }"
                >
                  <template #append>Pod</template>
                </ElInput>
                <div
                  class="form-tip"
                  :class="{ 'tip-warning': isDaemonSet() && isMaxUnavailableNonZero() }"
                >
                  <template v-if="isDaemonSet()">
                    <span v-if="isMaxUnavailableNonZero()" style="color: #e6a23c">
                      ⚠️ 已设置 > 0，最大额外副本将自动设为 0
                    </span>
                    <span v-else> 可以是数字或百分比，默认为 1 </span>
                  </template>
                  <template v-else>
                    {{ getMaxUnavailableTip() }}
                  </template>
                </div>
              </ElFormItem>

              <!-- partition - StatefulSet 专用 -->
              <ElFormItem v-if="supportedFields.partition" label="分区">
                <template #label>
                  <span>分区</span>
                  <ElTooltip
                    content="只更新序号 >= partition 的 Pod，用于金丝雀发布。设置为 0 表示更新所有 Pod"
                    placement="top"
                  >
                    <HelpCircle :size="14" class="label-help-icon" />
                  </ElTooltip>
                </template>
                <ElInputNumber
                  v-model="strategyForm.rollingUpdate.partition"
                  :min="0"
                  :max="1000"
                  controls-position="right"
                  style="max-width: 200px"
                />
                <div class="form-tip">默认为 0（更新所有 Pod）。设置 > 0 可实现分阶段更新</div>
              </ElFormItem>

              <!-- 配置冲突提示 -->
              <ElAlert
                v-if="isDaemonSet() && hasConflict()"
                type="error"
                :closable="false"
                show-icon
                style="margin-top: 16px"
              >
                <template #title>
                  <strong>配置冲突</strong>
                </template>
                <div style="font-size: 13px">
                  检测到 <code>maxSurge</code> 和 <code>maxUnavailable</code>
                  同时大于 0，这是不允许的。
                  <br />
                  请将其中一个设置为 0，或点击下方按钮自动修复。
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px">
                  <ElButton size="small" type="warning" @click="autoFixConflict('surge')">
                    保留 maxSurge，将 maxUnavailable 设为 0
                  </ElButton>
                  <ElButton size="small" type="warning" @click="autoFixConflict('unavailable')">
                    保留 maxUnavailable，将 maxSurge 设为 0
                  </ElButton>
                </div>
              </ElAlert>
            </template>

            <!-- 策略说明提示 -->
            <template v-if="strategyForm.type !== 'RollingUpdate'">
              <!-- OnDelete 提示 -->
              <ElAlert
                v-if="(isStatefulSet() || isDaemonSet()) && strategyForm.type === 'OnDelete'"
                type="info"
                :closable="false"
                style="margin-top: 16px"
              >
                <template #title>
                  <div style="display: flex; align-items: center; gap: 8px">
                    <Info :size="16" />
                    <span>OnDelete 策略说明</span>
                  </div>
                </template>
                <div style="margin-top: 8px">
                  使用 OnDelete 策略时，Pod 不会自动更新。您需要手动删除
                  Pod，系统才会创建使用新配置的 Pod。
                  <br />
                  这种策略适用于需要精确控制更新时机的场景。
                </div>
              </ElAlert>

              <!-- Recreate 提示 -->
              <ElAlert
                v-if="isDeployment() && strategyForm.type === 'Recreate'"
                type="warning"
                :closable="false"
                style="margin-top: 16px"
              >
                <template #title>
                  <div style="display: flex; align-items: center; gap: 8px">
                    <AlertTriangle :size="16" />
                    <span>Recreate 策略警告</span>
                  </div>
                </template>
                <div style="margin-top: 8px">
                  使用 Recreate 策略时，会先删除所有旧 Pod，然后再创建新 Pod。
                  <br />
                  <strong>这会导致服务短暂不可用</strong>，请谨慎使用。
                </div>
              </ElAlert>
            </template>

            <!-- 操作按钮 -->
            <div class="form-actions">
              <ElTooltip
                :content="getSubmitButtonTooltip()"
                placement="top"
                :disabled="isStrategyFormValid()"
              >
                <span>
                  <ElButton
                    type="primary"
                    @click="handleUpdateStrategy"
                    :loading="updatingStrategy"
                    :disabled="!isStrategyFormValid()"
                  >
                    <Save :size="16" />
                    保存策略
                  </ElButton>
                </span>
              </ElTooltip>
              <ElButton @click="loadStrategy">
                <RotateCcw :size="16" />
                重置
              </ElButton>
            </div>
          </ElForm>
        </div>

        <!-- 历史版本 -->
        <div v-show="activeTab === 'history'" class="config-section">
          <div class="section-header">
            <History :size="16" />
            <span>版本列表</span>
          </div>

          <ElTable :data="revisions" v-loading="loadingRevisions" stripe class="history-table">
            <ElTableColumn prop="revision" label="版本号" width="100" align="center" />
            <ElTableColumn prop="images" label="镜像" min-width="250">
              <template #default="{ row }">
                <div class="image-list">
                  <div v-for="(image, index) in row.images" :key="index" class="image-item">
                    {{ image }}
                  </div>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="replicas" label="副本数" width="100" align="center" />
            <ElTableColumn prop="reason" label="原因" min-width="150">
              <template #default="{ row }">
                <span>{{ row.reason || '-' }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="creationTimestamp" label="创建时间" width="160" align="center">
              <template #default="{ row }">{{ formatTime(row.creationTimestamp) }}</template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <ElButton
                  size="small"
                  type="primary"
                  :loading="rollingBack && rollbackTarget === row.revision"
                  :disabled="rollingBack"
                  @click="handleRollback(row)"
                >
                  回滚
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Box,
    Copy,
    Search,
    Info,
    Check,
    RotateCcw,
    Settings,
    History,
    HelpCircle,
    Package,
    Save,
    AlertTriangle
  } from 'lucide-vue-next'
  import {
    getResourceImagesApi,
    updateImageApi,
    getUpdateStrategyApi,
    updateUpdateStrategyApi,
    getResourceHistoryApi,
    rollbackToRevisionApi,
    listClusterRegistriesApi,
    listProjectsByAppApi,
    listRepositoriesApi,
    listArtifactsApi,
    searchImagesGlobalByProjectApi,
    type ContainerInfo,
    type UpdateStrategyResponse,
    type UpdateStrategyRequest,
    type RevisionInfo,
    type OnecProjectApplication,
    type OnecProjectVersion,
    type ProjectCluster,
    type ProjectWorkspace
  } from '@/api'
  import dayjs from 'dayjs'

  // ========== 类型定义 ==========
  interface ImageItem {
    name: string
    displayName: string
    originalName: string
    artifactCount: number
    pullCount: number
  }

  interface TagItem {
    name: string
    size: string
    pushTime: number
    artifactId: number
    digest: string
  }

  interface RegistryItem {
    registryId: number
    registryUuid: string
    registryName: string
    registryUrl: string
    registryType: string
  }

  interface ProjectItem {
    name: string
    projectId: number
  }

  // ========== Props ==========
  interface Props {
    version: OnecProjectVersion
    application: OnecProjectApplication
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
    refreshTrigger?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ success: [] }>()

  const projectId = computed(() => props.cluster?.projectId)
  const clusterUuid = computed(
    () => props.cluster?.clusterUuid || props.cluster?.uuid || `cluster-${props.cluster?.id}`
  )

  const activeTab = ref('image')

  // ==================== 资源类型判断 ====================
  const getResourceType = (): string => {
    return (props.application?.resourceType || '').toUpperCase()
  }

  const isDeployment = (): boolean => {
    return getResourceType() === 'DEPLOYMENT'
  }

  const isStatefulSet = (): boolean => {
    return getResourceType() === 'STATEFULSET'
  }

  const isDaemonSet = (): boolean => {
    return getResourceType() === 'DAEMONSET'
  }

  const getAvailableStrategies = () => {
    const resourceType = getResourceType()

    switch (resourceType) {
      case 'DEPLOYMENT':
        return [
          {
            value: 'RollingUpdate',
            label: '滚动更新',
            description: '逐步更新 Pod，确保服务持续可用（推荐）'
          },
          {
            value: 'Recreate',
            label: '重建',
            description: '先删除所有旧 Pod，再创建新 Pod（会导致服务中断）'
          }
        ]

      case 'STATEFULSET':
        return [
          {
            value: 'RollingUpdate',
            label: '滚动更新',
            description: '按 Pod 序号逆序更新，支持分区更新（推荐）'
          },
          {
            value: 'OnDelete',
            label: '手动删除',
            description: '需要手动删除 Pod 才会更新'
          }
        ]

      case 'DAEMONSET':
        return [
          {
            value: 'RollingUpdate',
            label: '滚动更新',
            description: '逐节点更新 Pod（推荐）'
          },
          {
            value: 'OnDelete',
            label: '手动删除',
            description: '需要手动删除 Pod 才会更新'
          }
        ]

      default:
        return []
    }
  }

  const getStrategyTypeTooltip = (): string => {
    const resourceType = getResourceType()

    switch (resourceType) {
      case 'DEPLOYMENT':
        return '选择 Deployment 的更新策略：滚动更新（推荐）或重建'
      case 'STATEFULSET':
        return '选择 StatefulSet 的更新策略：滚动更新（推荐）或手动删除'
      case 'DAEMONSET':
        return '选择 DaemonSet 的更新策略：滚动更新（推荐）或手动删除'
      default:
        return '选择资源的更新策略'
    }
  }

  // ==================== 更新镜像相关 ====================
  const loadingContainers = ref(false)
  const updatingImage = ref(false)
  const containers = ref<ContainerInfo[]>([])
  const imageForm = reactive({ containerName: '', image: '' })

  const imageSearch = ref('')
  const searchingImages = ref(false)
  const searchApplied = ref(false)
  const searchResults = ref<any>(null)
  const searchPagination = ref({ page: 1, pageSize: 50, total: 0, hasMore: false })

  const imageConfig = ref({
    registryUuid: '',
    registryUrl: '',
    project: '',
    image: '',
    tag: ''
  })

  const loadingRegistries = ref(false)
  const loadingProjects = ref(false)
  const loadingImages = ref(false)
  const loadingTags = ref(false)

  const registryPagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })
  const projectPagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })
  const imagePagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })
  const tagPagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: false })

  const registries = ref<RegistryItem[]>([])
  const projects = ref<ProjectItem[]>([])
  const images = ref<ImageItem[]>([])
  const tags = ref<TagItem[]>([])

  function removeProjectPrefix(repoName: string, projectName: string): string {
    if (!repoName || !projectName) return repoName || ''
    const projectPrefix = `${projectName}/`
    if (repoName.startsWith(projectPrefix)) {
      return repoName.substring(projectPrefix.length)
    }
    return repoName
  }

  const displayRegistries = computed(() => {
    if (
      !searchApplied.value ||
      !searchResults.value?.data ||
      !Array.isArray(searchResults.value.data)
    ) {
      return registries.value
    }
    const searchRegistryUuids = new Set(
      searchResults.value.data.map((r: any) => r?.registryUuid).filter(Boolean)
    )
    return registries.value.filter((r) => searchRegistryUuids.has(r.registryUuid))
  })

  const displayProjects = computed(() => {
    if (!searchApplied.value || !searchResults.value?.data || !imageConfig.value.registryUuid) {
      return projects.value
    }

    const registryResult = searchResults.value.data.find(
      (r: any) => r?.registryUuid === imageConfig.value.registryUuid
    )

    if (!registryResult?.images || !Array.isArray(registryResult.images)) {
      return []
    }

    const searchProjectNames = new Set(
      registryResult.images.map((img: any) => img?.projectName).filter(Boolean)
    )
    return projects.value.filter((p) => searchProjectNames.has(p.name))
  })

  const displayImages = computed(() => {
    if (searchApplied.value && searchResults.value?.data && imageConfig.value.project) {
      return images.value
    }
    return images.value
  })

  const displayTags = computed(() => {
    if (searchApplied.value && searchResults.value?.data && imageConfig.value.image) {
      return tags.value
    }
    return tags.value
  })

  const currentImage = computed(() => {
    if (!imageForm.containerName) return ''
    const container = containers.value.find((c) => c.name === imageForm.containerName)
    return container?.image || ''
  })

  const fullImageUrl = computed(() => {
    const { registryUrl, project, image, tag } = imageConfig.value
    if (!image) return ''

    let url = ''
    if (registryUrl && registryUrl !== 'docker.io') {
      url = registryUrl + '/'
    }
    if (project) {
      url += project + '/'
    }
    url += image
    if (tag) {
      url += ':' + tag
    }
    return url
  })

  function formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  function cleanRegistryUrl(url: string): string {
    if (!url) return url
    return url.replace(/^https?:\/\//, '')
  }

  const loadContainers = async () => {
    loadingContainers.value = true
    try {
      const response = await getResourceImagesApi(props.version.id)
      const allContainers: ContainerInfo[] = []
      if (response.initContainers?.length) allContainers.push(...response.initContainers)
      if (response.containers?.length) allContainers.push(...response.containers)
      if (response.ephemeralContainers?.length) allContainers.push(...response.ephemeralContainers)
      containers.value = allContainers

      if (containers.value.length > 0 && !imageForm.containerName) {
        imageForm.containerName = containers.value[0].name
      }
    } catch (error: any) {
      console.error('❌ 加载容器镜像列表失败:', error)
      containers.value = []
    } finally {
      loadingContainers.value = false
    }
  }

  async function fetchRegistries(page: number = 1, append: boolean = false) {
    if (!clusterUuid.value) return

    loadingRegistries.value = true
    try {
      const res = await listClusterRegistriesApi({ clusterUuid: clusterUuid.value })

      if (!res?.data) {
        registries.value = []
        registryPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
        return
      }

      const newData = res.data
        .filter((item) => item?.registry?.uuid)
        .map((item) => ({
          registryId: item.registryId,
          registryUuid: item.registry.uuid,
          registryName: item.registry.name || '未命名仓库',
          registryUrl: cleanRegistryUrl(item.registry.url || ''),
          registryType: item.registry.type || 'Harbor'
        }))

      if (append) {
        registries.value = [...registries.value, ...newData]
      } else {
        registries.value = newData
      }

      registryPagination.value.page = page
      registryPagination.value.total = newData.length
      registryPagination.value.hasMore = false
    } catch (error) {
      console.error('❌ 加载镜像仓库列表失败:', error)
      registries.value = []
    } finally {
      loadingRegistries.value = false
    }
  }

  async function loadMoreRegistries() {
    if (loadingRegistries.value || !registryPagination.value.hasMore) return
    await fetchRegistries(registryPagination.value.page + 1, true)
  }

  async function fetchProjects(registryUuid: string, page: number = 1, append: boolean = false) {
    if (!projectId.value || !clusterUuid.value || !registryUuid) return

    loadingProjects.value = true
    try {
      const res = await listProjectsByAppApi({
        appProjectId: projectId.value,
        clusterUuid: clusterUuid.value,
        registryUuid: registryUuid,
        page: page,
        pageSize: projectPagination.value.pageSize
      })

      if (!res?.items) {
        projects.value = []
        projectPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
        return
      }

      const newData = res.items.map((project) => ({
        name: project.name,
        projectId: project.projectId
      }))

      if (append) {
        projects.value = [...projects.value, ...newData]
      } else {
        projects.value = newData
      }

      projectPagination.value.page = page
      projectPagination.value.total = res.total
      projectPagination.value.hasMore = projects.value.length < res.total
    } catch (error) {
      console.error('❌ 加载项目列表失败:', error)
      projects.value = []
    } finally {
      loadingProjects.value = false
    }
  }

  async function loadMoreProjects() {
    if (
      loadingProjects.value ||
      !projectPagination.value.hasMore ||
      !imageConfig.value.registryUuid
    )
      return
    await fetchProjects(imageConfig.value.registryUuid, projectPagination.value.page + 1, true)
  }

  async function fetchImages(
    registryUuid: string,
    projectName: string,
    page: number = 1,
    append: boolean = false
  ) {
    if (!registryUuid || !projectName) return

    loadingImages.value = true
    try {
      const res = await listRepositoriesApi({
        registryUuid: registryUuid,
        projectName: projectName,
        page: page,
        pageSize: imagePagination.value.pageSize,
        sortBy: 'update_time',
        sortDesc: true
      })

      if (!res?.items) {
        images.value = []
        imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
        return
      }

      const newData = res.items.map((repo) => {
        const originalName = repo.name
        const cleanedName = removeProjectPrefix(repo.name, projectName)

        return {
          name: cleanedName,
          displayName: cleanedName,
          originalName: originalName,
          artifactCount: repo.artifactCount,
          pullCount: repo.pullCount
        }
      })

      if (append) {
        images.value = [...images.value, ...newData]
      } else {
        images.value = newData
      }

      imagePagination.value.page = page
      imagePagination.value.total = res.total
      imagePagination.value.hasMore = images.value.length < res.total
    } catch (error) {
      console.error('❌ 加载镜像列表失败:', error)
      images.value = []
    } finally {
      loadingImages.value = false
    }
  }

  async function loadMoreImages() {
    if (searchApplied.value) {
      return
    }

    if (
      loadingImages.value ||
      !imagePagination.value.hasMore ||
      !imageConfig.value.registryUuid ||
      !imageConfig.value.project
    )
      return
    await fetchImages(
      imageConfig.value.registryUuid,
      imageConfig.value.project,
      imagePagination.value.page + 1,
      true
    )
  }

  function handleImageSearchClick() {
    handleImageSearch(1, false)
  }

  async function handleImageSearch(page: number = 1, append: boolean = false) {
    if (!imageSearch.value.trim()) {
      return
    }

    if (!projectId.value || !clusterUuid.value) {
      return
    }

    searchingImages.value = true
    try {
      const res = await searchImagesGlobalByProjectApi({
        appProjectId: projectId.value,
        clusterUuid: clusterUuid.value,
        imageName: imageSearch.value.trim(),
        page: page,
        pageSize: searchPagination.value.pageSize
      })

      if (res?.data && Array.isArray(res.data)) {
        res.data = res.data.map((registry: any) => ({
          ...registry,
          registryUrl: cleanRegistryUrl(registry?.registryUrl || '')
        }))
      }

      if (append && searchResults.value) {
        searchResults.value.data = [...searchResults.value.data, ...res.data]
      } else {
        searchResults.value = res
      }

      searchPagination.value.page = page
      searchPagination.value.total = res.total || 0
      searchPagination.value.hasMore = searchResults.value.data?.length < (res.total || 0)

      if ((!searchResults.value.data || searchResults.value.data.length === 0) && page === 1) {
        ElMessage.info('未找到匹配的镜像')
        searchApplied.value = false
        return
      }

      searchApplied.value = true

      const totalImages = searchResults.value.data.reduce((sum: number, r: any) => {
        return sum + (r?.images && Array.isArray(r.images) ? r.images.length : 0)
      }, 0)

      if (page === 1) {
        ElMessage.success(`找到 ${totalImages} 个匹配的镜像，已自动过滤下拉列表`)
        imageConfig.value.registryUuid = ''
        imageConfig.value.registryUrl = ''
        imageConfig.value.project = ''
        imageConfig.value.image = ''
        imageConfig.value.tag = ''
      }
    } catch (error) {
      console.error('❌ 搜索镜像失败:', error)
      searchApplied.value = false
    } finally {
      searchingImages.value = false
    }
  }

  function clearSearch() {
    imageSearch.value = ''
    searchResults.value = null
    searchApplied.value = false
    searchPagination.value = { page: 1, pageSize: 50, total: 0, hasMore: false }
    imageConfig.value.image = ''
    imageConfig.value.tag = ''
  }

  function getTotalFilteredCount() {
    if (!searchResults.value?.data || !Array.isArray(searchResults.value.data)) {
      return 0
    }
    return searchResults.value.data.reduce((sum: number, r: any) => {
      return sum + (r?.images && Array.isArray(r.images) ? r.images.length : 0)
    }, 0)
  }

  async function fetchTags(
    registryUuid: string,
    projectName: string,
    repoName: string,
    page: number = 1,
    append: boolean = false
  ) {
    if (!registryUuid || !projectName || !repoName) return

    loadingTags.value = true
    try {
      const res = await listArtifactsApi({
        registryUuid: registryUuid,
        projectName: projectName,
        repoName: repoName,
        page: page,
        pageSize: tagPagination.value.pageSize,
        sortBy: 'push_time',
        sortDesc: true
      })

      const newTags: TagItem[] = []
      res.items.forEach((artifact) => {
        artifact.tags.forEach((tag) => {
          newTags.push({
            name: tag.name,
            size: formatSize(artifact.size),
            pushTime: tag.pushTime,
            artifactId: artifact.id,
            digest: artifact.digest
          })
        })
      })

      if (append) {
        tags.value = [...tags.value, ...newTags]
      } else {
        tags.value = newTags
      }

      tagPagination.value.page = page
      tagPagination.value.total = res.total
      tagPagination.value.hasMore = tags.value.length < res.total
    } catch (error) {
      console.error('❌ 加载标签列表失败:', error)
      tags.value = []
    } finally {
      loadingTags.value = false
    }
  }

  async function loadMoreTags() {
    if (
      loadingTags.value ||
      !tagPagination.value.hasMore ||
      !imageConfig.value.registryUuid ||
      !imageConfig.value.project ||
      !imageConfig.value.image
    )
      return

    const selectedImage = images.value.find((img) => img.name === imageConfig.value.image)
    const repoName = selectedImage?.originalName || imageConfig.value.image

    await fetchTags(
      imageConfig.value.registryUuid,
      imageConfig.value.project,
      repoName,
      tagPagination.value.page + 1,
      true
    )
  }

  const handleContainerChange = () => {
    imageForm.image = ''
    resetImageSelection()
    if (searchApplied.value) {
      clearSearch()
    }
  }

  const resetImageSelection = () => {
    imageConfig.value = {
      registryUuid: '',
      registryUrl: '',
      project: '',
      image: '',
      tag: ''
    }
    projects.value = []
    images.value = []
    tags.value = []
    projectPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
  }

  const resetImageForm = () => {
    imageForm.image = ''
    if (containers.value.length > 0) {
      imageForm.containerName = containers.value[0].name
    }
    resetImageSelection()
    clearSearch()
  }

  async function handleRegistryChange(registryUuid: string) {
    imageConfig.value.project = ''
    imageConfig.value.image = ''
    imageConfig.value.tag = ''
    projects.value = []
    images.value = []
    tags.value = []
    projectPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }

    if (!registryUuid) return

    const selectedRegistry = registries.value.find((r) => r.registryUuid === registryUuid)

    if (selectedRegistry) {
      imageConfig.value.registryUrl = selectedRegistry.registryUrl
      await fetchProjects(selectedRegistry.registryUuid)
    }
  }

  async function handleProjectChange() {
    imageConfig.value.image = ''
    imageConfig.value.tag = ''
    images.value = []
    tags.value = []
    imagePagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }

    if (!imageConfig.value.project || !imageConfig.value.registryUuid) return

    if (searchApplied.value && searchResults.value?.data) {
      const registryResult = searchResults.value.data.find(
        (r: any) => r?.registryUuid === imageConfig.value.registryUuid
      )

      if (registryResult?.images && Array.isArray(registryResult.images)) {
        const projectImages = registryResult.images.filter(
          (img: any) => img?.projectName === imageConfig.value.project
        )

        images.value = projectImages.map((img: any) => {
          const originalName = img.repoName || ''
          const cleanedName = removeProjectPrefix(originalName, imageConfig.value.project)

          return {
            name: cleanedName,
            displayName: cleanedName,
            originalName: originalName,
            artifactCount: 0,
            pullCount: 0
          }
        })

        imagePagination.value.total = images.value.length
        imagePagination.value.hasMore = false

        if (images.value.length === 0) {
          ElMessage.warning({
            message: `项目 "${imageConfig.value.project}" 下没有匹配 "${imageSearch.value}" 的镜像`,
            duration: 3000
          })
        }
      }
    } else {
      await fetchImages(imageConfig.value.registryUuid, imageConfig.value.project)
    }
  }

  async function handleImageChange() {
    imageConfig.value.tag = ''
    tags.value = []
    tagPagination.value = { page: 1, pageSize: 20, total: 0, hasMore: false }

    if (!imageConfig.value.image || !imageConfig.value.registryUuid || !imageConfig.value.project)
      return

    if (searchApplied.value && searchResults.value?.data) {
      const registryResult = searchResults.value.data.find(
        (r: any) => r?.registryUuid === imageConfig.value.registryUuid
      )

      if (registryResult?.images && Array.isArray(registryResult.images)) {
        const imageResult = registryResult.images.find((img: any) => {
          if (!img?.repoName || !img?.projectName) return false
          const cleanedName = removeProjectPrefix(img.repoName, img.projectName)
          return (
            img.projectName === imageConfig.value.project && cleanedName === imageConfig.value.image
          )
        })

        if (imageResult?.tags && Array.isArray(imageResult.tags)) {
          tags.value = imageResult.tags.map((tagName: string) => ({
            name: tagName,
            size: '-',
            pushTime: 0,
            artifactId: 0,
            digest: ''
          }))

          tagPagination.value.total = tags.value.length
          tagPagination.value.hasMore = false
          return
        }
      }
    }

    const selectedImage = images.value.find((img) => img.name === imageConfig.value.image)
    const repoName = selectedImage?.originalName || imageConfig.value.image
    await fetchTags(imageConfig.value.registryUuid, imageConfig.value.project, repoName)
  }

  function handleTagChange() {
    // 标签变化后，fullImageUrl 会自动更新
  }

  async function copyImageUrl() {
    try {
      await navigator.clipboard.writeText(fullImageUrl.value)
      ElMessage.success('镜像地址已复制到剪贴板')
    } catch {
    }
  }

  const handleUpdateImage = async () => {
    if (!imageForm.containerName) {
      return
    }
    if (!fullImageUrl.value) {
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要更新容器 "${imageForm.containerName}" 的镜像为 "${fullImageUrl.value}" 吗？`,
        '确认更新',
        { type: 'warning' }
      )

      updatingImage.value = true
      await updateImageApi(props.version.id, {
        containerName: imageForm.containerName,
        image: fullImageUrl.value
      })

      ElMessage.success('镜像更新成功')
      resetImageForm()
      await loadContainers()
      // emit('success')
    } catch (error: any) {
      if (error !== 'cancel') {
      }
    } finally {
      updatingImage.value = false
    }
  }

  // ==================== 更新策略相关 ====================
  const loadingStrategy = ref(false)
  const updatingStrategy = ref(false)
  const strategyForm = reactive({
    type: 'RollingUpdate' as string,
    rollingUpdate: {
      maxSurge: undefined as string | undefined,
      maxUnavailable: undefined as string | undefined,
      partition: undefined as number | undefined
    }
  })

  const supportedFields = computed(() => {
    const resourceType = getResourceType()

    switch (resourceType) {
      case 'DEPLOYMENT':
        return {
          maxSurge: true,
          maxUnavailable: true,
          partition: false
        }
      case 'STATEFULSET':
        return {
          maxSurge: false,
          maxUnavailable: true,
          partition: true
        }
      case 'DAEMONSET':
        return {
          maxSurge: true,
          maxUnavailable: true,
          partition: false
        }
      default:
        return {
          maxSurge: false,
          maxUnavailable: false,
          partition: false
        }
    }
  })

  const resetRollingUpdateConfig = () => {
    const fields = supportedFields.value

    strategyForm.rollingUpdate = {
      maxSurge: fields.maxSurge ? '' : undefined,
      maxUnavailable: fields.maxUnavailable ? '' : undefined,
      partition: fields.partition ? 0 : undefined
    }
  }

  // 解析数值（支持百分比和数字）
  const parseValue = (value: string | undefined): number => {
    if (!value) return 0
    const trimmed = value.trim()
    if (!trimmed) return 0
    return parseFloat(trimmed.replace('%', '')) || 0
  }

  // 检查 maxSurge 是否非零
  const isMaxSurgeNonZero = (): boolean => {
    return parseValue(strategyForm.rollingUpdate.maxSurge) > 0
  }

  // 检查 maxUnavailable 是否非零
  const isMaxUnavailableNonZero = (): boolean => {
    return parseValue(strategyForm.rollingUpdate.maxUnavailable) > 0
  }

  // 检查是否有配置冲突（DaemonSet 专用）
  const hasConflict = (): boolean => {
    if (!isDaemonSet()) return false
    return isMaxSurgeNonZero() && isMaxUnavailableNonZero()
  }

  // 获取 maxSurge 错误提示
  const getMaxSurgeError = (): string => {
    if (isDaemonSet() && hasConflict()) {
      return '与"最大不可用副本"冲突，两者不能同时大于 0'
    }
    return ''
  }

  // 获取 maxUnavailable 错误提示
  const getMaxUnavailableError = (): string => {
    if (isDaemonSet() && hasConflict()) {
      return '与"最大额外副本"冲突，两者不能同时大于 0'
    }
    return ''
  }

  // 获取提交按钮提示
  const getSubmitButtonTooltip = (): string => {
    if (!strategyForm.type) {
      return '请选择更新策略类型'
    }

    if (strategyForm.type === 'RollingUpdate') {
      if (isDeployment()) {
        const surge = parseValue(strategyForm.rollingUpdate.maxSurge)
        const unavailable = parseValue(strategyForm.rollingUpdate.maxUnavailable)
        if (surge === 0 && unavailable === 0) {
          return 'maxSurge 和 maxUnavailable 不能同时为 0'
        }
      }

      if (isDaemonSet() && hasConflict()) {
        return 'maxSurge 和 maxUnavailable 不能同时大于 0'
      }

      if (isStatefulSet()) {
        const partition = strategyForm.rollingUpdate.partition
        if (typeof partition !== 'number' || partition < 0) {
          return 'partition 必须是大于等于 0 的数字'
        }
      }
    }

    return '保存更新策略配置'
  }

  // maxSurge 变化处理
  const handleMaxSurgeChange = (value: string) => {
    if (!isDaemonSet()) return

    const surgeNum = parseValue(value)

    if (surgeNum > 0 && isMaxUnavailableNonZero()) {
    }
  }

  // maxUnavailable 变化处理
  const handleMaxUnavailableChange = (value: string) => {
    if (!isDaemonSet()) return

    const unavailableNum = parseValue(value)

    if (unavailableNum > 0 && isMaxSurgeNonZero()) {
    }
  }

  // 自动修复冲突
  const autoFixConflict = (keepField: 'surge' | 'unavailable') => {
    if (keepField === 'surge') {
      strategyForm.rollingUpdate.maxUnavailable = '0'
      ElMessage.success('已将"最大不可用副本"设为 0')
    } else {
      strategyForm.rollingUpdate.maxSurge = '0'
      ElMessage.success('已将"最大额外副本"设为 0')
    }
  }

  const getMaxUnavailableTooltip = (): string => {
    if (isStatefulSet()) {
      return '更新期间最多可以有多少个 Pod 不可用（K8s 1.24+ 支持）'
    } else if (isDaemonSet()) {
      return '更新期间最多可以有多少个 Pod 不可用。设置此值时，maxSurge 必须为 0'
    } else {
      return '更新期间最多可以有多少个 Pod 不可用，可以是绝对数字或百分比'
    }
  }

  const getMaxUnavailablePlaceholder = (): string => {
    if (isStatefulSet()) {
      return '如: 1（留空使用默认值）'
    } else if (isDaemonSet()) {
      return '如: 1 或 10%'
    } else {
      return '如: 0 或 25%'
    }
  }

  const getMaxUnavailableTip = (): string => {
    if (isStatefulSet()) {
      return '可以是数字或百分比，留空表示每次只更新 1 个 Pod'
    } else if (isDaemonSet()) {
      return '可以是数字或百分比，默认为 1'
    } else {
      return '可以是数字或百分比，默认为 25%'
    }
  }

  const loadStrategy = async () => {
    if (!props.version?.id) {
      return
    }

    try {
      loadingStrategy.value = true
      const res = await getUpdateStrategyApi(props.version.id)

      if (res) {
        strategyForm.type = res.type || 'RollingUpdate'

        resetRollingUpdateConfig()

        if (res.rollingUpdate) {
          const fields = supportedFields.value
          const ru = res.rollingUpdate

          if (fields.maxSurge && ru.maxSurge !== undefined) {
            strategyForm.rollingUpdate.maxSurge = ru.maxSurge
          }
          if (fields.maxUnavailable && ru.maxUnavailable !== undefined) {
            strategyForm.rollingUpdate.maxUnavailable = ru.maxUnavailable
          }
          if (fields.partition && ru.partition !== undefined) {
            strategyForm.rollingUpdate.partition = ru.partition
          }
        }
      }
    } catch (error) {
      console.error('加载更新策略失败:', error)
    } finally {
      loadingStrategy.value = false
    }
  }

  const handleStrategyTypeChange = () => {
    if (strategyForm.type !== 'RollingUpdate') {
      resetRollingUpdateConfig()
    }
  }

  const isStrategyFormValid = (): boolean => {
    if (!strategyForm.type) return false

    if (strategyForm.type === 'RollingUpdate') {
      const fields = supportedFields.value
      const ru = strategyForm.rollingUpdate

      if (isDeployment()) {
        if (fields.maxSurge && fields.maxUnavailable) {
          const surge = parseValue(ru.maxSurge)
          const unavailable = parseValue(ru.maxUnavailable)
          if (surge === 0 && unavailable === 0) {
            return false
          }
        }
      }

      if (isDaemonSet()) {
        if (hasConflict()) {
          return false
        }
      }

      if (isStatefulSet()) {
        if (fields.partition) {
          if (typeof ru.partition !== 'number' || ru.partition < 0) {
            return false
          }
        }
      }
    }

    return true
  }

  const handleUpdateStrategy = async () => {
    if (!props.version?.id) {
      return
    }

    if (!isStrategyFormValid()) {
      if (isDaemonSet() && hasConflict()) {
        ElMessage.error({
          message: 'DaemonSet 的"最大额外副本"和"最大不可用副本"不能同时大于 0，请修改配置',
          duration: 5000
        })
        return
      }

      if (isDeployment()) {
        const surge = parseValue(strategyForm.rollingUpdate.maxSurge)
        const unavailable = parseValue(strategyForm.rollingUpdate.maxUnavailable)
        if (surge === 0 && unavailable === 0) {
          ElMessage.error({
            message: 'Deployment 的"最大额外副本"和"最大不可用副本"不能同时为 0',
            duration: 5000
          })
          return
        }
      }

      return
    }

    try {
      updatingStrategy.value = true

      const requestData: UpdateStrategyRequest = {
        type: strategyForm.type
      }

      if (strategyForm.type === 'RollingUpdate') {
        const fields = supportedFields.value
        const ru = strategyForm.rollingUpdate
        const rollingUpdate: any = {}

        if (fields.maxSurge && ru.maxSurge) {
          rollingUpdate.maxSurge = ru.maxSurge
        }
        if (fields.maxUnavailable && ru.maxUnavailable) {
          rollingUpdate.maxUnavailable = ru.maxUnavailable
        }
        if (fields.partition && typeof ru.partition === 'number') {
          rollingUpdate.partition = ru.partition
        }

        if (Object.keys(rollingUpdate).length > 0) {
          requestData.rollingUpdate = rollingUpdate
        }
      }

      await updateUpdateStrategyApi(props.version.id, requestData)
      ElMessage.success('更新策略已保存')
      await loadStrategy()
      // emit('success')
    } catch (error: any) {
      console.error('更新策略失败:', error)
    } finally {
      updatingStrategy.value = false
    }
  }

  // ==================== 历史版本相关 ====================
  const loadingRevisions = ref(false)
  const rollingBack = ref(false)
  const rollbackTarget = ref<number | null>(null)
  const revisions = ref<RevisionInfo[]>([])

  const formatTime = (timestamp: number) =>
    !timestamp ? '-' : dayjs(timestamp * 1000).format('MM-DD HH:mm')

  const loadRevisions = async () => {
    loadingRevisions.value = true
    try {
      const response = await getResourceHistoryApi(props.version.id)
      revisions.value = response || []
    } catch (error: any) {
      revisions.value = []
    } finally {
      loadingRevisions.value = false
    }
  }

  const handleRollback = async (revision: RevisionInfo) => {
    try {
      await ElMessageBox.confirm(`确定要回滚到版本 ${revision.revision} 吗？`, '确认回滚', {
        type: 'warning'
      })
      rollingBack.value = true
      rollbackTarget.value = revision.revision
      await rollbackToRevisionApi(props.version.id, { revision: revision.revision })
      ElMessage.success(`已回滚到版本 ${revision.revision}`)
      await loadRevisions()
      // emit('success')
    } catch (error: any) {
    } finally {
      rollingBack.value = false
      rollbackTarget.value = null
    }
  }

  // ==================== Tab 切换 ====================
  const handleTabChange = (index: string) => {
    activeTab.value = index
    loadCurrentTabData()
  }

  // ==================== 生命周期 ====================
  const loadCurrentTabData = async () => {
    switch (activeTab.value) {
      case 'image':
        await loadContainers()
        if (clusterUuid.value) {
          await fetchRegistries()
        }
        break
      case 'strategy':
        await loadStrategy()
        break
      case 'history':
        await loadRevisions()
        break
    }
  }

  watch(
    () => props.refreshTrigger,
    (newVal, oldVal) => {
      if (newVal && newVal > 0 && newVal !== oldVal) {
        resetImageSelection()
        clearSearch()
        loadCurrentTabData()
      }
    }
  )

  onMounted(loadCurrentTabData)
</script>

<style lang="scss" scoped>
  .update-management-container {
    height: 100%;
    min-height: 800px;

    .config-layout {
      display: flex;
      height: 100%;
      background: #fff;
      border-radius: 8px;

      .tabs-sidebar {
        width: 160px;
        border-right: 1px solid var(--el-border-color);
        padding: 20px 16px 20px 20px;
        flex-shrink: 0;

        .config-menu {
          border: none;

          :deep(.el-menu-item) {
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 6px;
            margin-bottom: 4px;
            height: 40px;

            &.is-active {
              background-color: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
            }
          }
        }
      }

      .config-content {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;

        .config-section {
          width: 100%;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 16px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:first-child {
            margin-top: 0;
          }
        }

        :deep(.el-form-item .el-input),
        :deep(.el-form-item .el-select) {
          max-width: 500px;
        }

        :deep(.el-radio-group) {
          display: flex;
          flex-direction: row;
          gap: 16px;
          flex-wrap: wrap;

          .el-radio {
            margin-right: 0;
            display: flex;
            align-items: center;
          }
        }

        .label-help-icon {
          margin-left: 6px;
          color: var(--el-text-color-secondary);
          cursor: help;
          vertical-align: middle;
        }

        .inline-help-icon {
          margin-left: 4px;
          color: var(--el-text-color-secondary);
          cursor: help;
          vertical-align: middle;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          padding-top: 8px;

          :deep(.el-button) {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
        }

        .form-tip {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
        }

        .tip-warning {
          color: #e6a23c !important;
          font-weight: 500;
        }

        :deep(.el-form-item) {
          margin-bottom: 18px;

          .el-form-item__label {
            font-weight: 500;
            display: flex;
            align-items: center;
          }
        }

        .current-image-display {
          padding: 10px 14px;
          background: var(--el-fill-color-light);
          border-radius: 6px;
          border: 1px solid var(--el-border-color);

          code {
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            font-size: 12px;
            color: var(--el-text-color-regular);
          }
        }

        .search-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #e6f7ff;
          border-left: 3px solid #1890ff;
          border-radius: 4px;
          font-size: 12px;
          color: var(--el-text-color-regular);

          svg {
            color: #1890ff;
            flex-shrink: 0;
          }
        }

        .registry-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .tag-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;

          .tag-size {
            font-size: 11px;
            color: var(--el-text-color-secondary);
            margin-left: 8px;
          }
        }

        .image-info-card {
          margin-top: 0;
          padding: 12px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
          border-radius: 8px;
          border: 1px solid #d9e3f0;

          .image-url {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;

            code {
              flex: 1;
              font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
              font-size: 12px;
              color: var(--el-text-color-primary);
              word-break: break-all;
            }
          }
        }

        .history-table {
          margin-top: 16px;

          .image-list .image-item {
            padding: 4px 0;
            font-size: 13px;

            &:not(:last-child) {
              border-bottom: 1px solid #f0f0f0;
            }
          }
        }

        .has-conflict {
          :deep(.el-input__wrapper) {
            border-color: #f56c6c !important;
            box-shadow: 0 0 0 1px #f56c6c inset !important;
          }
        }

        :deep(.el-alert) {
          code {
            background: rgba(0, 0, 0, 0.05);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            font-size: 12px;
          }
        }

        :deep(.el-form-item.is-error) {
          .el-input__wrapper {
            box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
          }
        }
      }
    }
  }

  .select-loading-more {
    padding: 8px;
    text-align: center;
    color: var(--el-color-primary);
    font-size: 12px;
    cursor: pointer;
    border-top: 1px solid var(--el-border-color);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
</style>
