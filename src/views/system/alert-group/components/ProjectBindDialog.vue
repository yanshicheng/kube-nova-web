<template>
  <el-dialog
    v-model="visible"
    title="项目绑定管理"
    width="700px"
    @close="handleClose"
    class="project-bind-dialog modern-dialog"
  >
    <div v-loading="loading" class="bind-content">
      <!-- 已绑定项目 -->
      <div v-if="boundProject" class="bound-section">
        <el-alert type="success" :closable="false" show-icon>
          <template #title>
            <div class="alert-title">
              <el-icon><SuccessFilled /></el-icon>
              已绑定项目
            </div>
          </template>
        </el-alert>
        <div class="bound-project">
          <div class="project-info">
            <div class="project-name">
              <el-icon color="#409eff" :size="24"><OfficeBuilding /></el-icon>
              <span>{{ boundProject.name }}</span>
            </div>
            <div class="project-meta">
              <el-tag size="default">{{ boundProject.uuid }}</el-tag>
              <span class="project-desc">{{ boundProject.description || '暂无描述' }}</span>
            </div>
            <div class="project-stats">
              <div class="stat-item">
                <el-icon><User /></el-icon>
                <span>管理员：{{ boundProject.adminCount || 0 }} 人</span>
              </div>
              <div class="stat-item">
                <el-icon><Files /></el-icon>
                <span>资源：{{ boundProject.resourceCount || 0 }} 个</span>
              </div>
            </div>
          </div>
          <el-button type="danger" @click="handleUnbind" :icon="Close">
            解除绑定
          </el-button>
        </div>
      </div>

      <!-- 未绑定 - 选择项目 -->
      <div v-else class="unbind-section">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <div class="alert-title">
              <el-icon><InfoFilled /></el-icon>
              该告警组暂未绑定项目
            </div>
          </template>
        </el-alert>

        <el-form :model="form" label-width="80px" style="margin-top: 24px">
          <el-form-item label="选择项目">
            <el-select
              v-model="form.projectId"
              placeholder="请搜索并选择要绑定的项目"
              filterable
              clearable
              style="width: 100%"
              @change="handleProjectChange"
            >
              <el-option
                v-for="project in availableProjects"
                :key="project.id"
                :label="project.name"
                :value="project.id"
              >
                <div class="project-option">
                  <span class="project-name">{{ project.name }}</span>
                  <el-tag size="small" type="info">{{ project.uuid }}</el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 选中项目的详细信息 -->
          <div v-if="selectedProject" class="selected-project-info">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="项目名称">
                {{ selectedProject.name }}
              </el-descriptions-item>
              <el-descriptions-item label="项目标识">
                {{ selectedProject.uuid }}
              </el-descriptions-item>
              <el-descriptions-item label="项目描述">
                {{ selectedProject.description || '暂无描述' }}
              </el-descriptions-item>
              <el-descriptions-item label="管理员数量">
                {{ selectedProject.adminCount || 0 }} 人
              </el-descriptions-item>
              <el-descriptions-item label="资源数量">
                {{ selectedProject.resourceCount || 0 }} 个
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-form>
      </div>

      <!-- 说明 -->
      <div class="tips">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            <div class="tip-content">
              <p><strong>注意事项：</strong></p>
              <ul>
                <li>一个告警组只能绑定一个项目（一对一关系）</li>
                <li>绑定后，该项目的告警将自动关联到此告警组</li>
                <li>解绑后，需要重新配置告警规则</li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="large">
          {{ boundProject ? '关闭' : '取消' }}
        </el-button>
        <el-button
          v-if="!boundProject"
          type="primary"
          :loading="submitLoading"
          :disabled="!form.projectId"
          @click="handleBind"
          size="large"
        >
          <el-icon v-if="!submitLoading"><Link /></el-icon>
          {{ submitLoading ? '绑定中...' : '确认绑定' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    OfficeBuilding,
    Close,
    InfoFilled,
    SuccessFilled,
    Link,
    User,
    Files
  } from '@element-plus/icons-vue'
  import {
    bindAlertGroupAppsApi,
    unbindAlertGroupAppsApi,
    searchAlertGroupAppsApi
  } from '@/api/portal/alert'
  import { searchProjectApi, getProjectApi, type Project } from '@/api/manager/project'

  interface Props {
    modelValue: boolean
    groupId?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const submitLoading = ref(false)
  const boundProject = ref<Project | null>(null)
  const boundRelationId = ref<number>()
  const availableProjects = ref<Project[]>([])

  const form = reactive({
    projectId: undefined as number | undefined
  })

  const selectedProject = computed(() => {
    return availableProjects.value.find((p) => p.id === form.projectId)
  })

  // 加载已绑定的项目
  const loadBoundProject = async () => {
    if (!props.groupId) return

    loading.value = true
    try {
      const res = await searchAlertGroupAppsApi({
        groupId: props.groupId,
        appType: 'project'
      })

      if (res.items && res.items.length > 0) {
        const relation = res.items[0]
        boundRelationId.value = relation.id

        const project = await getProjectApi(relation.appId)
        boundProject.value = project
      } else {
        boundProject.value = null
        boundRelationId.value = undefined
        await loadAvailableProjects()
      }
    } catch (error) {
      boundProject.value = null
      boundRelationId.value = undefined
      await loadAvailableProjects()
    } finally {
      loading.value = false
    }
  }

  // 加载可用项目列表
  const loadAvailableProjects = async () => {
    try {
      const res = await searchProjectApi({ page: 1, pageSize: 100 })
      availableProjects.value = res.items || []
    } catch (error) {
      // 错误已统一处理
    }
  }

  // 项目选择变化
  const handleProjectChange = (projectId: number | undefined) => {
    // 可以在这里做一些额外处理
  }

  // 绑定项目
  const handleBind = async () => {
    if (!form.projectId || !props.groupId) return

    submitLoading.value = true
    try {
      await bindAlertGroupAppsApi({
        groupId: props.groupId,
        appId: form.projectId,
        appType: 'project'
      })
      ElMessage.success('绑定项目成功')
      visible.value = false
      emit('success')
    } finally {
      submitLoading.value = false
    }
  }

  // 解绑项目
  const handleUnbind = async () => {
    if (!boundRelationId.value) return

    try {
      await ElMessageBox.confirm(
        '解绑后，该项目的告警将不再关联到此告警组，确定要继续吗？',
        '确认解绑',
        {
          type: 'warning',
          confirmButtonText: '确定解绑',
          cancelButtonText: '取消'
        }
      )

      loading.value = true
      await unbindAlertGroupAppsApi(boundRelationId.value)
      ElMessage.success('解绑项目成功')
      boundProject.value = null
      boundRelationId.value = undefined
      await loadAvailableProjects()
      emit('success')
    } catch (error) {
      if (error !== 'cancel') {
        // 错误已统一处理
      }
    } finally {
      loading.value = false
    }
  }

  // 关闭对话框
  const handleClose = () => {
    form.projectId = undefined
    boundProject.value = null
    boundRelationId.value = undefined
    availableProjects.value = []
  }

  watch(
    [() => visible.value, () => props.groupId],
    ([isVisible, groupId]) => {
      if (isVisible && groupId) {
        loadBoundProject()
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .project-bind-dialog.modern-dialog {
    :deep(.el-dialog__header) {
      padding: 24px 24px 20px;
      border-bottom: 1px solid #e4e7ed;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      .el-dialog__title {
        color: white;
        font-weight: 600;
        font-size: 18px;
      }

      .el-dialog__close {
        color: white;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }

    :deep(.el-dialog__body) {
      padding: 0;
      background: #fafbfc;
    }

    .bind-content {
      padding: 24px;
      min-height: 200px;

      .alert-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }

      .bound-section {
        .el-alert {
          margin-bottom: 20px;
        }

        .bound-project {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px;
          border: 2px solid #e4e7ed;
          border-radius: 12px;
          background: white;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

          .project-info {
            flex: 1;

            .project-name {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 18px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 16px;
            }

            .project-meta {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;

              .project-desc {
                font-size: 14px;
                color: #606266;
              }
            }

            .project-stats {
              display: flex;
              gap: 24px;

              .stat-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                color: #909399;

                .el-icon {
                  color: #409eff;
                }
              }
            }
          }
        }
      }

      .unbind-section {
        .el-alert {
          margin-bottom: 20px;
        }

        .selected-project-info {
          margin-top: 16px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
      }

      .tips {
        margin-top: 24px;

        .tip-content {
          p {
            margin: 0 0 8px;
          }

          ul {
            margin: 0;
            padding-left: 20px;

            li {
              margin: 4px 0;
              font-size: 13px;
              line-height: 1.8;
            }
          }
        }
      }
    }

    .project-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;

      .project-name {
        flex: 1;
        font-weight: 500;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e4e7ed;
      background: white;

      .el-button {
        min-width: 100px;
      }
    }
  }
</style>