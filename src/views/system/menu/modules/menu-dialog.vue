<template>
  <ElDialog
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="handleCancel"
    width="900px"
    align-center
    class="menu-dialog"
    @closed="handleClosed"
    destroy-on-close
  >
    <ArtForm
      ref="formRef"
      v-model="form"
      :items="formItems"
      :rules="rules"
      :span="width > 640 ? 12 : 24"
      :gutter="20"
      label-width="120px"
      :show-reset="false"
      :show-submit="false"
    >
      <template #menuType>
        <ElRadioGroup v-model="form.menuType" :disabled="isEdit">
          <ElRadioButton :value="1">目录</ElRadioButton>
          <ElRadioButton :value="2">菜单</ElRadioButton>
          <ElRadioButton :value="3">按钮</ElRadioButton>
        </ElRadioGroup>
      </template>

      <template #icon>
        <IconSelector v-model="form.icon" />
      </template>
    </ArtForm>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">确定</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormRules } from 'element-plus'
  import { ElIcon, ElTooltip, ElMessage } from 'element-plus'
  import { QuestionFilled } from '@element-plus/icons-vue'
  import { formatMenuTitle } from '@/utils/router'
  import type { MenuSysMenuTree } from '@/api/portal/menu'
  import type { FormItem } from '@/components/core/forms/art-form/index.vue'
  import ArtForm from '@/components/core/forms/art-form/index.vue'
  import IconSelector from './icon-selector.vue'
  import { useWindowSize } from '@vueuse/core'

  const { width } = useWindowSize()

  /**
   * 创建带 tooltip 的表单标签
   */
  const createLabelTooltip = (label: string, tooltip: string) => {
    return () =>
      h('span', { class: 'flex items-center' }, [
        h('span', label),
        h(
          ElTooltip,
          {
            content: tooltip,
            placement: 'top'
          },
          () => h(ElIcon, { class: 'ml-0.5 cursor-help' }, () => h(QuestionFilled))
        )
      ])
  }

  interface MenuFormData {
    id: number
    parentId: number
    menuType: 1 | 2 | 3 // 1目录 2菜单 3按钮
    name: string
    path: string
    component: string
    redirect: string
    label: string
    title: string
    icon: string
    sort: number
    link: string
    isEnable: boolean
    isMenu: boolean
    keepAlive: boolean
    isHide: boolean
    isIframe: boolean
    isHideTab: boolean
    showBadge: boolean
    showTextBadge: string
    isFirstLevel: boolean
    fixedTab: boolean
    isFullPage: boolean
    activePath: string
    roles: string[]
    status: boolean
    authName: string
    authLabel: string
    authIcon: string
    authSort: number
  }

  interface Props {
    visible: boolean
    editData?: MenuSysMenuTree | any
    type?: 1 | 2 | 3
    parentMenuList?: any[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: MenuFormData): void
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    type: 2,
    parentMenuList: () => []
  })

  const emit = defineEmits<Emits>()

  const formRef = ref()
  const isEdit = ref(false)
  const loading = ref(false)

  const form = reactive<MenuFormData>({
    id: 0,
    parentId: 0,
    menuType: 2,
    name: '',
    path: '',
    component: '',
    redirect: '',
    label: '',
    title: '',
    icon: '',
    sort: 0,
    link: '',
    isEnable: true,
    isMenu: true,
    keepAlive: false,
    isHide: false,
    isIframe: false,
    isHideTab: false,
    showBadge: false,
    showTextBadge: '',
    isFirstLevel: false,
    fixedTab: false,
    isFullPage: false,
    activePath: '',
    roles: [],
    status: true,
    authName: '',
    authLabel: '',
    authIcon: '',
    authSort: 0
  })

  /**
   * 表单验证规则
   */
  const rules = reactive<FormRules>({
    title: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    name: [
      { required: true, message: '请输入路由名称', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: '路由名称必须以字母开头，只能包含字母、数字和下划线',
        trigger: 'blur'
      }
    ],
    path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
    component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
    authName: [{ required: true, message: '请输入按钮名称', trigger: 'blur' }],
    authLabel: [{ required: true, message: '请输入按钮权限标识', trigger: 'blur' }]
  })

  /**
   * 父级菜单选项
   */
  const parentMenuOptions = computed(() => {
    const buildTree = (list: any[], parentId = 0, level = 0): any[] => {
      const result: any[] = []
      list.forEach((item) => {
        if (item.id === form.id) return // 排除自己

        const option = {
          label: `${'　'.repeat(level)}${item.title}`,
          value: item.id
        }

        result.push(option)

        if (item.children && item.children.length > 0) {
          result.push(...buildTree(item.children, item.id, level + 1))
        }
      })
      return result
    }

    return [{ label: '顶级菜单', value: 0 }, ...buildTree(props.parentMenuList || [])]
  })

  /**
   * 表单项配置
   */
  const formItems = computed<FormItem[]>(() => {
    const baseItems: FormItem[] = [
      { label: '菜单类型', key: 'menuType', span: 24 }
    ]

    // Switch 组件的 span
    const switchSpan = width.value < 640 ? 12 : 6

    // 按钮类型
    if (form.menuType === 3) {
      return [
        ...baseItems,
        {
          label: '父级菜单',
          key: 'parentId',
          type: 'select',
          span: 24,
          props: {
            placeholder: '请选择父级菜单',
            options: parentMenuOptions.value
          }
        },
        {
          label: '按钮名称',
          key: 'authName',
          type: 'input',
          props: { placeholder: '如：新增、编辑、删除' }
        },
        {
          label: '权限标识',
          key: 'authLabel',
          type: 'input',
          props: { placeholder: '如：add、edit、delete' }
        },
        {
          label: '按钮图标',
          key: 'authIcon',
          type: 'input',
          props: { placeholder: '选择图标' }
        },
        {
          label: '按钮排序',
          key: 'authSort',
          type: 'number',
          props: { min: 0, controlsPosition: 'right', style: { width: '100%' } }
        },
        { label: '是否启用', key: 'status', type: 'switch', span: switchSpan }
      ]
    }

    // 目录和菜单类型
    const commonItems: FormItem[] = [
      ...baseItems,
      {
        label: '父级菜单',
        key: 'parentId',
        type: 'select',
        span: 24,
        props: {
          placeholder: '请选择父级菜单',
          options: parentMenuOptions.value,
          clearable: true
        }
      },
      {
        label: '菜单名称',
        key: 'title',
        type: 'input',
        props: { placeholder: '请输入菜单名称', clearable: true }
      },
      {
        label: '路由名称',
        key: 'name',
        type: 'input',
        props: { placeholder: '如：User、System（用于路由跳转）', clearable: true }
      },
      {
        label: createLabelTooltip(
          '路由地址',
          '一级菜单：以 / 开头的绝对路径（如 /dashboard）\n二级及以下：相对路径（如 console、user）'
        ),
        key: 'path',
        type: 'input',
        props: { placeholder: '如：/dashboard 或 user', clearable: true }
      },
      {
        label: createLabelTooltip(
          '组件路径',
          '一级父级菜单：填写 /index/index\n具体页面：填写组件路径（如 /system/user）\n目录菜单：留空或填写 LAYOUT'
        ),
        key: 'component',
        type: 'input',
        props: { placeholder: '如：/system/user 或 LAYOUT', clearable: true }
      },
      {
        label: '权限标识',
        key: 'label',
        type: 'input',
        props: { placeholder: '如：User（非必填）', clearable: true }
      },
      {
        label: '菜单图标',
        key: 'icon'
      },
      {
        label: '菜单排序',
        key: 'sort',
        type: 'number',
        props: { min: 0, controlsPosition: 'right', style: { width: '100%' } }
      }
    ]

    // 菜单类型额外字段
    if (form.menuType === 2) {
      commonItems.push(
        {
          label: createLabelTooltip(
            '重定向',
            '访问该路由时自动跳转的地址，常用于父级菜单重定向到第一个子菜单'
          ),
          key: 'redirect',
          type: 'input',
          props: { placeholder: '如：/system/user', clearable: true }
        },
        {
          label: '外部链接',
          key: 'link',
          type: 'input',
          props: { placeholder: '如：https://www.example.com', clearable: true }
        },
        {
          label: '文本徽章',
          key: 'showTextBadge',
          type: 'input',
          props: { placeholder: '如：New、Hot', clearable: true }
        },
        {
          label: createLabelTooltip(
            '激活路径',
            '用于详情页等隐藏菜单，指定高亮显示的父级菜单路径'
          ),
          key: 'activePath',
          type: 'input',
          props: { placeholder: '如：/system/user', clearable: true }
        },
        {
          label: createLabelTooltip(
            '角色权限',
            '前端权限模式：配置角色标识（如 R_SUPER、R_ADMIN）\n后端权限模式：无需配置'
          ),
          key: 'roles',
          type: 'inputtag',
          props: { placeholder: '输入角色标识后按回车，如：R_SUPER' }
        }
      )
    }

    // 开关选项
    commonItems.push(
      { label: '是否启用', key: 'status', type: 'switch', span: switchSpan },
      { label: '显示为菜单', key: 'isMenu', type: 'switch', span: switchSpan },
      { label: '页面缓存', key: 'keepAlive', type: 'switch', span: switchSpan },
      { label: '隐藏菜单', key: 'isHide', type: 'switch', span: switchSpan }
    )

    if (form.menuType === 2) {
      commonItems.push(
        { label: '是否内嵌', key: 'isIframe', type: 'switch', span: switchSpan },
        { label: '显示徽章', key: 'showBadge', type: 'switch', span: switchSpan },
        { label: '固定标签', key: 'fixedTab', type: 'switch', span: switchSpan },
        { label: '标签隐藏', key: 'isHideTab', type: 'switch', span: switchSpan },
        { label: '全屏页面', key: 'isFullPage', type: 'switch', span: switchSpan }
      )
    }

    return commonItems
  })

  /**
   * 对话框标题
   */
  const dialogTitle = computed(() => {
    const typeMap = {
      1: '目录',
      2: '菜单',
      3: '按钮'
    }
    const type = typeMap[form.menuType]
    return isEdit.value ? `编辑${type}` : `新增${type}`
  })

  /**
   * 重置表单数据
   */
  const resetForm = (): void => {
    formRef.value?.reset()
    form.id = 0
    form.parentId = 0
    form.menuType = 2
    form.name = ''
    form.path = ''
    form.component = ''
    form.redirect = ''
    form.label = ''
    form.title = ''
    form.icon = ''
    form.sort = 0
    form.link = ''
    form.isEnable = true
    form.isMenu = true
    form.keepAlive = false
    form.isHide = false
    form.isIframe = false
    form.isHideTab = false
    form.showBadge = false
    form.showTextBadge = ''
    form.isFirstLevel = false
    form.fixedTab = false
    form.isFullPage = false
    form.activePath = ''
    form.roles = []
    form.status = true
    form.authName = ''
    form.authLabel = ''
    form.authIcon = ''
    form.authSort = 0
  }

  /**
   * 加载表单数据（编辑模式）
   */
  const loadFormData = (): void => {
    if (!props.editData) return

    isEdit.value = props.editData.id > 0

    const row = props.editData

    form.id = row.id || 0
    form.parentId = row.parentId || 0
    form.menuType = row.menuType || 2
    form.name = row.name || ''
    form.path = row.path || ''
    form.component = row.component || ''
    form.redirect = row.redirect || ''
    form.label = row.label || ''
    form.title = row.title || ''
    form.icon = row.icon || ''
    form.sort = row.sort || 0
    form.link = row.link || ''
    form.isEnable = row.isEnable === 1
    form.isMenu = row.isMenu === 1
    form.keepAlive = row.keepAlive === 1
    form.isHide = row.isHide === 1
    form.isIframe = row.isIframe === 1
    form.isHideTab = row.isHideTab === 1
    form.showBadge = row.showBadge === 1
    form.showTextBadge = row.showTextBadge || ''
    form.isFirstLevel = row.isFirstLevel === 1
    form.fixedTab = row.fixedTab === 1
    form.isFullPage = row.isFullPage === 1
    form.activePath = row.activePath || ''
    form.status = row.status === 1

    // 解析 roles
    if (row.roles && typeof row.roles === 'string') {
      try {
        form.roles = JSON.parse(row.roles)
      } catch {
        form.roles = []
      }
    } else if (Array.isArray(row.roles)) {
      form.roles = row.roles
    } else {
      form.roles = []
    }

    // 按钮特殊字段
    if (form.menuType === 3) {
      form.authName = row.authName || ''
      form.authLabel = row.authLabel || ''
      form.authIcon = row.authIcon || ''
      form.authSort = row.authSort || 0
    }
  }

  /**
   * 提交表单
   */
  const handleSubmit = async (): Promise<void> => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      emit('submit', { ...form })
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  /**
   * 取消操作
   */
  const handleCancel = (): void => {
    emit('update:visible', false)
  }

  /**
   * 对话框关闭后的回调
   */
  const handleClosed = (): void => {
    resetForm()
    isEdit.value = false
  }

  /**
   * 监听对话框显示状态
   */
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        nextTick(() => {
          if (props.editData) {
            loadFormData()
          } else {
            form.menuType = props.type || 2
          }
        })
      }
    }
  )
</script>

<style scoped lang="scss">
  .menu-dialog {
    :deep(.el-dialog__body) {
      max-height: 70vh;
      overflow-y: auto;
    }
  }
</style>