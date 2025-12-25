<template>
  <div class="version-cards-optimized">
    <ElScrollbar class="cards-scrollbar">
      <div class="cards-list">
        <!-- 新增版本按钮 -->
        <div class="version-item add-item" @click="handleAddVersion">
          <div class="add-content">
            <Plus :size="20" />
            <span>新增版本</span>
          </div>
        </div>

        <!-- 删除服务按钮 - 仅在没有版本时显示 -->
        <div
          v-if="versions.length === 0"
          class="version-item delete-item"
          @click="handleDeleteApplication"
        >
          <div class="delete-content">
            <Trash2 :size="20" />
            <span>删除服务</span>
          </div>
        </div>

        <!-- 版本项列表 -->
        <div
          v-for="version in versions"
          :key="version.id"
          class="version-item"
          :class="{
            active: selectedVersion?.id === version.id,
            abnormal: !version.status || version.status === 0,
            // 🔥 根据版本角色添加不同样式
            'role-stable': version.versionRole === 'stable',
            'role-primary': version.versionRole === 'primary',
            'role-canary': version.versionRole === 'canary',
            'role-blue': version.versionRole === 'blue',
            'role-green': version.versionRole === 'green'
          }"
          @click="handleSelectVersion(version)"
        >
          <div class="version-content">
            <div class="version-left">
              <div class="version-badge">
                <Tag :size="14" />
              </div>
              <div class="version-info">
                <div class="version-name">{{ version.version }}</div>
                <!-- 🔥 版本角色标签 -->
                <div v-if="version.versionRole" class="version-role">
                  <ElTag
                    :type="getVersionRoleTagType(version.versionRole)"
                    size="small"
                    effect="dark"
                  >
                    {{ getVersionRoleLabel(version.versionRole) }}
                  </ElTag>
                </div>
                <div
                  v-if="version.label && Object.keys(version.label).length > 0"
                  class="version-labels"
                >
                  <ElTag
                    v-for="(value, key) in version.label"
                    :key="key"
                    size="small"
                    class="version-label-tag"
                  >
                    {{ key }}={{ value }}
                  </ElTag>
                </div>
              </div>
            </div>

            <div class="version-right">
              <!-- 🔥 只有 stable 版本才显示操作菜单 -->
              <ElDropdown
                v-if="version.versionRole === 'stable'"
                trigger="click"
                @command="(cmd) => handleCommand(cmd, version)"
                @click.stop
              >
                <ElButton class="action-btn" size="small" text :icon="MoreVertical" />
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem command="edit">
                      <Edit :size="14" />
                      编辑
                    </ElDropdownItem>
                    <ElDropdownItem command="copy">
                      <Copy :size="14" />
                      复制
                    </ElDropdownItem>
                    <ElDropdownItem command="migrate">
                      <ArrowRightLeft :size="14" />
                      迁移版本
                    </ElDropdownItem>
                    <ElDropdownItem command="delete" divided>
                      <Trash2 :size="14" />
                      删除版本
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>
            </div>

            <!-- 🔥 异常标签 - 优化提示文案 -->
            <ElTooltip
              v-if="!version.status || version.status === 0"
              content="该版本在K8s集群中已被删除，请检查或重新同步"
              placement="top"
            >
              <ElTag type="danger" size="small" effect="dark" class="status-tag-corner">
                已删除
              </ElTag>
            </ElTooltip>
          </div>
        </div>
      </div>
    </ElScrollbar>

    <!-- 🔥 迁移版本弹窗 -->
    <ElDialog
      v-model="migrateDialogVisible"
      title="迁移版本"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm :model="migrateForm" label-width="100px">
        <ElFormItem label="源版本">
          <ElInput :value="migratingVersion?.version" disabled />
        </ElFormItem>
        <ElFormItem label="新版本名称" required>
          <ElInput v-model="migrateForm.newVersionName" placeholder="请输入新版本名称" clearable />
        </ElFormItem>
        <ElFormItem label="目标服务" required>
          <ElSelect
            v-model="migrateForm.newApplicationId"
            placeholder="请选择目标服务"
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="app in targetApplications"
              :key="app.id"
              :label="app.nameCn || app.nameEn"
              :value="app.id"
            >
              <div class="app-option">
                <span>{{ app.nameCn || app.nameEn }}</span>
                <ElTag :type="getResourceTypeTag(app.resourceType)" size="small">
                  {{ app.resourceType }}
                </ElTag>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="migrateDialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          :loading="migrating"
          :disabled="!migrateForm.newVersionName || !migrateForm.newApplicationId"
          @click="handleMigrateConfirm"
        >
          确认迁移
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus, Tag, MoreVertical, Edit, Copy, Trash2, ArrowRightLeft } from 'lucide-vue-next'
  import { useProjectStore } from '@/store/modules/project'
  import {
    searchVersionApi,
    deleteVersionApi,
    deleteApplicationApi,
    searchApplicationApi,
    migrateVersionOnProjectApi,
    type OnecProjectApplication,
    type OnecProjectVersion,
    type ProjectCluster,
    type ProjectWorkspace
  } from '@/api'

  // 🔥 全局变量：是否启用多版本管理功能
  const ENABLE_MULTI_VERSION = false

  interface Props {
    application: OnecProjectApplication
    cluster: ProjectCluster | null
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    versionSelect: [version: OnecProjectVersion | null]
    refresh: []
    applicationDeleted: []
  }>()

  const router = useRouter()
  const projectStore = useProjectStore()
  const versions = ref<OnecProjectVersion[]>([])
  const selectedVersion = ref<OnecProjectVersion | null>(null)
  const deleting = ref(false)

  const migrateDialogVisible = ref(false)
  const migrating = ref(false)
  const migratingVersion = ref<OnecProjectVersion | null>(null)
  const targetApplications = ref<OnecProjectApplication[]>([])
  const migrateForm = ref({
    newVersionName: '',
    newApplicationId: null as number | null
  })

  const normalizeResourceType = (type: string): string => {
    return type?.toLowerCase() || ''
  }

  const getRouteName = (resourceType: string): string => {
    const type = normalizeResourceType(resourceType)
    const routeNameMap: Record<string, string> = {
      pod: 'CreatePod',
      deployment: 'CreateDeployment',
      statefulset: 'CreateStatefulSet',
      daemonset: 'CreateDaemonSet',
      job: 'CreateJob',
      cronjob: 'CreateCronJob'
    }
    return routeNameMap[type] || ''
  }

  const getResourceTypeTag = (type: string) => {
    const resourceType = normalizeResourceType(type)
    const tagMap: Record<string, string> = {
      pod: 'info',
      deployment: 'success',
      statefulset: 'warning',
      daemonset: 'primary',
      cronjob: 'danger',
      job: ''
    }
    return tagMap[resourceType] || 'info'
  }

  // 🔥 获取版本角色标签类型
  const getVersionRoleTagType = (role: string): string => {
    const typeMap: Record<string, string> = {
      stable: 'success', // 用户发布的稳定版本
      primary: 'primary', // Flagger金丝雀主版本
      canary: 'warning', // 金丝雀测试版本
      blue: 'info', // 蓝版本
      green: '' // 绿版本
    }
    return typeMap[role] || 'info'
  }

  // 🔥 获取版本角色标签文本
  const getVersionRoleLabel = (role: string): string => {
    const labelMap: Record<string, string> = {
      stable: '稳定版本', // 用户发布的主版本
      primary: '金丝雀主版本', // Flagger管理的主版本
      canary: '金丝雀测试', // 金丝雀测试版本
      blue: '蓝版本',
      green: '绿版本'
    }
    return labelMap[role] || role
  }

  const loadVersions = async () => {
    try {
      const response = await searchVersionApi({
        applicationId: props.application.id
      })
      versions.value = response || []

      if (versions.value.length > 0 && !selectedVersion.value) {
        handleSelectVersion(versions.value[0])
      } else if (versions.value.length === 0) {
        selectedVersion.value = null
        emit('versionSelect', null)
      }
    } catch (error) {
      console.error('加载版本失败:', error)
    }
  }

  const handleSelectVersion = (version: OnecProjectVersion) => {
    selectedVersion.value = version
    emit('versionSelect', version)
  }

  // 🔥 新增版本 - 添加多版本控制检查
  const handleAddVersion = async () => {
    // 检查是否启用多版本管理
    if (!ENABLE_MULTI_VERSION && versions.value.length > 0) {
      try {
        await ElMessageBox.confirm(
          '当前暂未开启多版本管理功能，多版本功能需要通过灰度发布或AB测试等方式操作。',
          '多版本管理提示',
          {
            type: 'warning',
            confirmButtonText: '我知道了',
            showCancelButton: false,
            closeOnClickModal: false
          }
        )
        return
      } catch {
        return
      }
    }

    if (!props.cluster || !props.workspace) {
      return
    }

    const projectId = projectStore.selectedProject?.id
    if (!projectId) {
      return
    }

    const routeName = getRouteName(props.application.resourceType)
    if (!routeName) {
      return
    }

    const clusterUuid =
      props.cluster.clusterUuid || props.cluster.uuid || `cluster-${props.cluster.id}`

    router.push({
      name: routeName,
      query: {
        resourceClusterId: String(props.cluster.id),
        clusterUuid: clusterUuid,
        workspaceId: String(props.workspace.id),
        appProjectId: String(projectId),
        namespace: props.workspace.namespace || 'default',
        applicationId: String(props.application.id),
        mode: 'createAppVersion'
      }
    })
  }

  const handleDeleteApplication = async () => {
    if (deleting.value) return

    const appName = props.application.nameCn || props.application.nameEn || '当前服务'

    try {
      await ElMessageBox.confirm(
        `确定要删除服务 "${appName}" 吗？删除后将无法恢复。`,
        '删除服务确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger'
        }
      )

      deleting.value = true
      await deleteApplicationApi(props.application.id)

      ElMessage.success('服务删除成功')

      emit('applicationDeleted')
      emit('refresh')
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除应用失败:', error)
      }
    } finally {
      deleting.value = false
    }
  }

  const loadTargetApplications = async () => {
    if (!props.workspace) return

    try {
      const response = await searchApplicationApi({
        workspaceId: props.workspace.id
      })

      const currentResourceType = normalizeResourceType(props.application.resourceType)
      targetApplications.value = (response || []).filter((app) => {
        return (
          app.id !== props.application.id &&
          normalizeResourceType(app.resourceType) === currentResourceType
        )
      })
    } catch (error) {
      console.error('加载目标应用失败:', error)
    }
  }

  const showMigrateDialog = async (version: OnecProjectVersion) => {
    migratingVersion.value = version
    migrateForm.value = {
      newVersionName: `${version.version}-copy`,
      newApplicationId: null
    }

    await loadTargetApplications()

    if (targetApplications.value.length === 0) {
      return
    }

    migrateDialogVisible.value = true
  }

  const handleMigrateConfirm = async () => {
    if (!migratingVersion.value || !migrateForm.value.newApplicationId) {
      return
    }

    migrating.value = true
    try {
      await migrateVersionOnProjectApi({
        versionId: migratingVersion.value.id,
        newVersionName: migrateForm.value.newVersionName,
        newApplicationId: migrateForm.value.newApplicationId
      })

      ElMessage.success('版本迁移成功')
      migrateDialogVisible.value = false
      emit('refresh')
    } catch (error) {
      console.error('迁移版本失败:', error)
    } finally {
      migrating.value = false
    }
  }

  const handleCommand = async (command: string, version: OnecProjectVersion) => {
    if (!props.cluster || !props.workspace) return

    const clusterUuid =
      props.cluster.clusterUuid || props.cluster.uuid || `cluster-${props.cluster.id}`

    const routeName = getRouteName(props.application.resourceType)

    const projectId = projectStore.selectedProject?.id

    if (!projectId) {
      return
    }

    switch (command) {
      case 'edit':
        if (routeName) {
          router.push({
            name: routeName,
            query: {
              resourceClusterId: String(props.cluster.id),
              clusterUuid: clusterUuid,
              workspaceId: String(props.workspace.id),
              appProjectId: String(projectId),
              namespace: props.workspace.namespace || 'default',
              applicationId: String(props.application.id),
              applicationVersionId: String(version.id),
              mode: 'editAppVersion'
            }
          })
        }
        break

      // 🔥 复制功能 - 添加多版本控制检查
      case 'copy':
        if (!ENABLE_MULTI_VERSION) {
          try {
            await ElMessageBox.confirm(
              '当前暂未开启多版本管理功能，多版本功能需要通过灰度发布或AB测试等方式操作。',
              '多版本管理提示',
              {
                type: 'warning',
                confirmButtonText: '我知道了',
                showCancelButton: false,
                closeOnClickModal: false
              }
            )
          } catch {
            // 用户关闭了对话框
          }
          return
        }

        if (routeName) {
          router.push({
            name: routeName,
            query: {
              resourceClusterId: String(props.cluster.id),
              clusterUuid: clusterUuid,
              workspaceId: String(props.workspace.id),
              appProjectId: String(projectId),
              namespace: props.workspace.namespace || 'default',
              applicationId: String(props.application.id),
              applicationVersionId: String(version.id),
              mode: 'copyAppVersion'
            }
          })
        }
        break

      case 'migrate':
        await showMigrateDialog(version)
        break

      case 'delete':
        if (deleting.value) return
        try {
          await ElMessageBox.confirm(`确定要删除版本 "${version.version}" 吗？`, '删除版本确认', {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消'
          })

          deleting.value = true
          await deleteVersionApi(version.id)
          ElMessage.success('版本删除成功')

          if (selectedVersion.value?.id === version.id) {
            selectedVersion.value = null
            emit('versionSelect', null)
          }

          await loadVersions()
          emit('refresh')
        } catch (error: any) {
          if (error !== 'cancel') {
            console.error('删除版本失败:', error)
          }
        } finally {
          deleting.value = false
        }
        break
    }
  }

  watch(
    () => props.application,
    () => {
      selectedVersion.value = null
      loadVersions()
    }
  )

  onMounted(() => {
    loadVersions()
  })

  defineExpose({
    refresh: loadVersions
  })
</script>

<style lang="scss" scoped>
  .version-cards-optimized {
    .cards-scrollbar {
      height: 72px;

      .cards-list {
        display: flex;
        gap: 10px;
        padding: 2px;
        min-width: 100%;

        .version-item {
          position: relative;
          min-width: 180px;
          max-width: 240px;
          height: 64px;
          padding: 10px 14px;
          background: white;
          border: 2px solid #e4e7ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          display: flex;
          align-items: center;

          &:hover {
            border-color: #409eff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
          }

          &.active {
            border-color: #409eff;
            background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);

            .version-name {
              color: #409eff;
              font-weight: 600;
            }

            .version-badge {
              background: #409eff;
              color: white;
            }
          }

          // 🔥 版本角色样式
          &.role-stable {
            border-color: #67c23a;
            &:hover {
              box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
            }
            &.active {
              background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
            }
          }

          &.role-primary {
            border-color: #409eff;
            &:hover {
              box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
            }
          }

          &.role-canary {
            border-color: #e6a23c;
            &:hover {
              box-shadow: 0 4px 12px rgba(230, 162, 60, 0.15);
            }
            &.active {
              background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
            }
          }

          &.role-blue {
            border-color: #909399;
            &:hover {
              box-shadow: 0 4px 12px rgba(144, 147, 153, 0.15);
            }
          }

          &.role-green {
            border-color: #95de64;
            &:hover {
              box-shadow: 0 4px 12px rgba(149, 222, 100, 0.15);
            }
          }

          &.abnormal {
            border-color: #f56c6c;

            .version-badge {
              background: #f56c6c;
              color: white;
            }

            &:hover {
              border-color: #f56c6c;
              box-shadow: 0 4px 12px rgba(245, 108, 108, 0.15);
            }

            &.active {
              background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
            }
          }

          &.add-item {
            justify-content: center;
            border-style: dashed;
            background: linear-gradient(135deg, #fafafa 0%, #f5f7fa 100%);
            min-width: 160px;
            max-width: 160px;

            &:hover {
              background: linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%);
              border-color: #409eff;
            }

            .add-content {
              display: flex;
              align-items: center;
              gap: 6px;
              color: #409eff;
              font-size: 14px;
              font-weight: 500;
            }
          }

          &.delete-item {
            justify-content: center;
            border-style: dashed;
            border-color: #f56c6c;
            background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
            min-width: 160px;
            max-width: 160px;

            &:hover {
              background: linear-gradient(135deg, #fde2e2 0%, #fef0f0 100%);
              border-color: #f56c6c;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(245, 108, 108, 0.15);
            }

            .delete-content {
              display: flex;
              align-items: center;
              gap: 6px;
              color: #f56c6c;
              font-size: 14px;
              font-weight: 500;
            }
          }

          .version-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            gap: 8px;

            .version-left {
              display: flex;
              align-items: center;
              gap: 10px;
              flex: 1;
              min-width: 0;

              .version-badge {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #ecf5ff 0%, #e6f4ff 100%);
                color: #409eff;
                border-radius: 6px;
                flex-shrink: 0;
                transition: all 0.25s;
              }

              .version-info {
                flex: 1;
                min-width: 0;

                .version-name {
                  font-size: 14px;
                  font-weight: 500;
                  color: #303133;
                  line-height: 1.4;
                  transition: all 0.25s;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  display: block;
                  max-width: 100%;
                }

                .version-role {
                  margin-top: 2px;
                }

                .version-labels {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 4px;
                  margin-top: 4px;

                  .version-label-tag {
                    font-size: 11px;
                    height: 18px;
                    line-height: 18px;
                    padding: 0 6px;
                    border-radius: 3px;
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                }
              }
            }

            .version-right {
              flex-shrink: 0;

              .action-btn {
                opacity: 0;
                transition: opacity 0.2s;
              }
            }

            .status-tag-corner {
              position: absolute;
              right: 6px;
              bottom: 6px;
              font-size: 11px;
              height: 18px;
              line-height: 18px;
              padding: 0 6px;
              border-radius: 3px;
              z-index: 1;
              box-shadow: 0 1px 4px rgba(245, 108, 108, 0.3);
            }
          }

          &:hover .action-btn {
            opacity: 1;
          }
        }
      }
    }

    .app-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
  }
</style>
