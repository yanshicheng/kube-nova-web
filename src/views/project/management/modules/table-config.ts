import { ref, h } from 'vue'
import type { VNode } from 'vue'
import { ElTag, ElButton, ElTooltip } from 'element-plus'
import type { Router } from 'vue-router'

interface Project {
  id: number
  name: string
  uuid: string
  description: string
  isSystem: number
  adminCount: number
  resourceCount: number
  createdAt: number
}

interface TableConfigHandlers {
  handleAssignMember: (row: Project) => void
  handleViewDetail: (row: Project) => void
  handleEditProject: (row: Project) => void
  handleDeleteProject: (id: number) => void
}

export function useProjectTableConfig() {
  // 状态管理
  const loading = ref(false)
  const showSearchBar = ref(true)
  const deleteLoadingMap = ref<Record<number, boolean>>({})
  const submitLoading = ref(false)

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 创建表格列配置
  const createTableColumns = (handlers: TableConfigHandlers) => {
    const { handleAssignMember, handleViewDetail, handleEditProject, handleDeleteProject } =
      handlers

    const allColumns = [
      {
        prop: 'name',
        label: '项目名称',
        minWidth: 150,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const project = row as Project
          return h('div', { class: 'flex items-center gap-2' }, [
            h('span', { class: 'font-medium' }, project.name || '-'),
            project.isSystem === 1 && h(ElTag, { type: 'info', size: 'small' }, () => '系统')
          ])
        }
      },
      {
        prop: 'uuid',
        label: '项目标识',
        minWidth: 200,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const project = row as Project
          return project.uuid || '-'
        }
      },
      {
        prop: 'description',
        label: '描述',
        minWidth: 200,
        showOverflowTooltip: true,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const project = row as Project
          return project.description || '-'
        }
      },
      {
        prop: 'adminCount',
        label: '管理员',
        width: 100,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const project = row as Project
          const count = project.adminCount || 0
          return h('div', { class: 'flex items-center justify-center gap-1' }, [
            h('i', {
              class: 'iconfont-sys iconsys-user',
              style: 'font-size: 14px; color: #606266;'
            }),
            h('span', count)
          ])
        }
      },
      {
        prop: 'resourceCount',
        label: '资源池',
        width: 100,
        align: 'center' as const,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const project = row as Project
          const count = project.resourceCount || 0
          const type = count > 0 ? 'success' : 'info'
          return h(ElTag, { type, size: 'small' }, () => count + ' 个')
        }
      },
      {
        prop: 'createdAt',
        label: '创建时间',
        width: 180,
        visible: true,
        formatter: (row: Record<string, any>) => {
          const project = row as Project
          return formatTimestamp(project.createdAt)
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 250,
        fixed: 'right' as const,
        visible: true,
        formatter: (row: Record<string, any>): VNode => {
          const project = row as Project
          const isDeleting = deleteLoadingMap.value[project.id] || false
          const isSystemProject = project.isSystem === 1
          const isAnyLoading = isDeleting || submitLoading.value

          return h('div', { class: 'table-operation-buttons' }, [
            // 分配成员按钮
            h(
              ElTooltip,
              {
                content: '分配成员',
                placement: 'top'
              },
              () =>
                h(
                  ElButton,
                  {
                    type: 'primary',
                    size: 'small',
                    disabled: isAnyLoading,
                    onClick: () => handleAssignMember(project)
                  },
                  () => [
                    h('i', {
                      class: 'iconfont-sys iconsys-user-add',
                      style: 'margin-right: 4px;'
                    }),
                    '成员'
                  ]
                )
            ),
            // 查看详情按钮
            h(
              ElTooltip,
              {
                content: '查看项目详情',
                placement: 'top'
              },
              () =>
                h(
                  ElButton,
                  {
                    type: 'info',
                    size: 'small',
                    disabled: isAnyLoading,
                    onClick: () => handleViewDetail(project),
                    style: 'margin-left: 8px;'
                  },
                  () => [
                    h('i', { class: 'iconfont-sys iconsys-eye', style: 'margin-right: 4px;' }),
                    '详情'
                  ]
                )
            ),
            // 编辑项目按钮
            h(
              ElTooltip,
              {
                content: isSystemProject ? '系统项目不可编辑' : '编辑项目',
                placement: 'top',
                disabled: !isSystemProject
              },
              () =>
                h(
                  ElButton,
                  {
                    type: 'warning',
                    size: 'small',
                    disabled: isAnyLoading || isSystemProject,
                    onClick: () => handleEditProject(project),
                    style: 'margin-left: 8px;'
                  },
                  () => [
                    h('i', { class: 'iconfont-sys iconsys-edit', style: 'margin-right: 4px;' }),
                    '编辑'
                  ]
                )
            ),
            // 删除项目按钮
            h(
              ElTooltip,
              {
                content: isSystemProject ? '系统项目不可删除' : '删除项目',
                placement: 'top',
                disabled: !isSystemProject
              },
              () =>
                h(
                  ElButton,
                  {
                    type: 'danger',
                    size: 'small',
                    loading: isDeleting,
                    disabled: isAnyLoading || isSystemProject,
                    onClick: () => handleDeleteProject(project.id),
                    style: 'margin-left: 8px;'
                  },
                  () => [
                    !isDeleting &&
                      h('i', {
                        class: 'iconfont-sys iconsys-delete',
                        style: 'margin-right: 4px;'
                      }),
                    isDeleting ? '删除中' : '删除'
                  ]
                )
            )
          ])
        }
      }
    ]

    const columns = ref(allColumns)

    return {
      columns
    }
  }

  return {
    // 状态
    loading,
    showSearchBar,
    deleteLoadingMap,
    submitLoading,

    // 方法
    createTableColumns,
    formatTimestamp
  }
}