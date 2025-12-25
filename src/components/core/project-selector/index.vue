<template>
  <div class="art-project-selector">
    <ElSelect
      v-model="selectedProjectId"
      filterable
      clearable
      placeholder="选择项目支持搜索"
      :loading="loading"
      @change="handleProjectChange"
      @clear="handleClear"
      @visible-change="handleVisibleChange"
      class="project-select"
      popper-class="art-project-popper"
    >
      <ElOption v-for="item in projects" :key="item.id" :label="item.name" :value="item.id">
        <div class="option-item">
          <div class="option-left">
            <span class="project-icon">
              <Settings v-if="item.isSystem === 1" :size="16" />
              <FolderOpen v-else :size="16" />
            </span>
            <span class="project-name">{{ item.name }}</span>
          </div>
          <span class="project-badge" :class="item.isSystem === 1 ? 'system' : 'normal'">
            {{ item.isSystem === 1 ? '系统' : '普通' }}
          </span>
        </div>
      </ElOption>

      <template #empty>
        <div class="empty">暂无项目数据</div>
      </template>
    </ElSelect>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue'
  import { ElSelect, ElOption, ElMessage } from 'element-plus'
  import { useProjectStore } from '@/store/modules/project'
  import { mittBus } from '@/utils/sys'
  import { Settings, FolderOpen } from 'lucide-vue-next'

  defineOptions({ name: 'ArtProjectSelector' })

  const projectStore = useProjectStore()

  const projects = computed(() => projectStore.projects)
  const selectedProject = computed(() => projectStore.selectedProject)
  const loading = computed(() => projectStore.loading)

  const selectedProjectId = ref<number | undefined>()

  watch(selectedProject, (newVal) => {
    if (newVal) {
      selectedProjectId.value = newVal.id
    } else {
      selectedProjectId.value = undefined
    }
  })

  onMounted(async () => {
    await projectStore.fetchProjects()

    if (selectedProject.value) {
      selectedProjectId.value = selectedProject.value.id
    }
  })

  // 处理下拉框显示/隐藏
  const handleVisibleChange = async (visible: boolean) => {
    if (visible) {
      await projectStore.fetchProjects()
    }
  }

  const handleProjectChange = async (id: number | undefined) => {
    if (id) {
      const project = projects.value.find((p) => p.id === id)
      if (project) {
        projectStore.selectProject(project)
        mittBus.emit('projectChanged', project)

        ElMessage({
          message: `已切换到「${project.name}」项目`,
          type: 'success',
          duration: 2000
        })
      }
    }
  }

  const handleClear = async () => {
    selectedProjectId.value = undefined
    projectStore.clearSelection()
    mittBus.emit('projectChanged', null)

    ElMessage({
      message: '已清除项目选择',
      type: 'info',
      duration: 2000
    })
  }
</script>

<style lang="scss" scoped>
  .art-project-selector {
    .project-select {
      width: 240px;

      :deep(.el-input__wrapper) {
        height: 36px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }

        &.is-focus {
          background: white;
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);

          .el-input__inner {
            color: #303133;
          }
        }
      }

      :deep(.el-input__inner) {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;

        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }
</style>

<style lang="scss">
  .art-project-popper {
    min-width: 320px !important;

    .el-select-dropdown__wrap {
      min-height: 300px !important;
      max-height: 300px !important;
    }

    .el-select-dropdown__item {
      height: auto !important;
      line-height: normal !important;
      padding: 0 !important;
      margin: 0 !important;

      &.hover {
        background-color: transparent !important;

        .option-item {
          background-color: #f5f7fa;
        }
      }

      &.selected {
        background-color: transparent !important;
        font-weight: normal !important;

        .option-item {
          background-color: #ecf5ff;

          .project-name {
            color: #409eff;
            font-weight: 500;
          }
        }
      }

      .option-item {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 10px 16px !important;
        border-radius: 4px;
        transition: background-color 0.2s;
        gap: 12px;
        height: auto !important;
        box-sizing: border-box;

        .option-left {
          display: flex !important;
          align-items: center !important;
          flex: 1;
          min-width: 0;
          gap: 10px;

          .project-icon {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0;
            color: #606266;
            width: 16px;
            height: 16px;
            line-height: 1;

            svg {
              display: block;
              width: 100%;
              height: 100%;
            }
          }

          .project-name {
            font-size: 14px;
            color: #303133;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0 !important;
            padding: 0 !important;
            vertical-align: middle;
          }
        }

        .project-badge {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 4px 10px !important;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1 !important;
          white-space: nowrap;
          flex-shrink: 0;
          height: auto !important;
          margin: 0 !important;
          vertical-align: middle;

          &.system {
            background-color: #fef0f0;
            color: #f56c6c;
          }

          &.normal {
            background-color: #f0f9ff;
            color: #409eff;
          }
        }
      }
    }

    .empty {
      padding: 20px;
      text-align: center;
      color: #909399;
      font-size: 14px;
    }
  }
</style>