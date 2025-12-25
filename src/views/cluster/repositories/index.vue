<template>
  <div class="repositories-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Container :size="28" />
          镜像仓库管理
        </h1>
        <p class="page-description"
          >管理和配置容器镜像仓库,支持 Harbor、Docker Registry 等多种类型</p
        >
      </div>
      <div class="header-actions">
        <ElButton type="primary" :icon="Plus" @click="handleCreate">创建仓库</ElButton>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <ElCard class="filter-card" shadow="never">
      <div class="filter-wrapper">
        <div class="filter-left">
          <ElInput
            v-model="searchParams.name"
            placeholder="搜索仓库名称..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            style="width: 300px"
          />

          <ElSelect
            v-model="searchParams.env"
            placeholder="环境"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <ElOption label="开发" value="dev" />
            <ElOption label="测试" value="test" />
            <ElOption label="预发" value="staging" />
            <ElOption label="生产" value="prod" />
          </ElSelect>

          <ElSelect
            v-model="searchParams.type"
            placeholder="仓库类型"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <ElOption label="Harbor" value="harbor" />
            <ElOption label="Docker Registry" value="docker-registry" />
            <ElOption label="Nexus" value="nexus" />
          </ElSelect>

          <ElSelect
            v-model="searchParams.status"
            placeholder="状态"
            clearable
            style="width: 120px"
            @change="handleSearch"
          >
            <ElOption label="启用" :value="1" />
            <ElOption label="禁用" :value="0" />
          </ElSelect>
        </div>

        <div class="filter-right">
          <ElRadioGroup v-model="viewMode" @change="handleViewChange">
            <ElRadioButton value="card">
              <span class="button-content">
                <LayoutGrid :size="16" />
                <span>卡片</span>
              </span>
            </ElRadioButton>
            <ElRadioButton value="list">
              <span class="button-content">
                <List :size="16" />
                <span>列表</span>
              </span>
            </ElRadioButton>
          </ElRadioGroup>
          <ElButton :icon="RefreshCw" @click="fetchRegistries">刷新</ElButton>
        </div>
      </div>
    </ElCard>

    <!-- 内容区域 -->
    <ElCard class="content-card" shadow="never" v-loading="loading">
      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card' && registries.length > 0" class="card-grid">
        <RepositoryCard
          v-for="registry in registries"
          :key="registry.id"
          :registry="registry"
          @manage="handleManage"
          @bind-cluster="handleBindCluster"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>

      <!-- 列表视图 -->
      <RepositoryTable
        v-else-if="viewMode === 'list' && registries.length > 0"
        :data="registries"
        @manage="handleManage"
        @bind-cluster="handleBindCluster"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- 空状态 -->
      <ElEmpty v-else description="暂无镜像仓库" :image-size="120">
        <ElButton type="primary" :icon="Plus" @click="handleCreate">创建第一个仓库</ElButton>
      </ElEmpty>

      <!-- 分页 -->
      <div v-if="registries.length > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.pageSize"
          :total="total"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </ElCard>

    <!-- 创建/编辑对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '创建镜像仓库' : '编辑镜像仓库'"
      width="700px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        @submit.prevent="handleSubmit"
      >
        <ElFormItem label="仓库名称" prop="name">
          <ElInput v-model="formData.name" placeholder="请输入仓库名称" />
        </ElFormItem>

        <ElFormItem label="仓库类型" prop="type">
          <ElSelect v-model="formData.type" placeholder="请选择仓库类型" style="width: 100%">
            <ElOption label="Harbor" value="harbor">
              <div class="type-option">
                <Server :size="16" />
                <span>Harbor - 企业级容器镜像仓库</span>
              </div>
            </ElOption>
            <ElOption label="Docker Registry" value="docker-registry">
              <div class="type-option">
                <Package :size="16" />
                <span>Docker Registry - 官方镜像仓库</span>
              </div>
            </ElOption>
            <ElOption label="Nexus" value="nexus">
              <div class="type-option">
                <Database :size="16" />
                <span>Nexus - 制品管理平台</span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="环境类型" prop="env">
          <ElRadioGroup v-model="formData.env">
            <ElRadio value="dev">开发</ElRadio>
            <ElRadio value="test">测试</ElRadio>
            <ElRadio value="staging">预发</ElRadio>
            <ElRadio value="prod">生产</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem label="仓库地址" prop="url">
          <ElInput v-model="formData.url" placeholder="例如: https://harbor.example.com">
            <template #prefix>
              <Globe :size="16" />
            </template>
          </ElInput>
        </ElFormItem>

        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="formData.username" placeholder="请输入用户名">
            <template #prefix>
              <User :size="16" />
            </template>
          </ElInput>
        </ElFormItem>

        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <Lock :size="16" />
            </template>
          </ElInput>
        </ElFormItem>

        <ElFormItem label="跳过证书验证">
          <ElSwitch v-model="formData.insecure" />
          <span class="form-tip">如果使用自签名证书，请开启此选项</span>
        </ElFormItem>

        <ElFormItem v-if="!formData.insecure" label="CA证书" prop="caCert">
          <ElInput
            v-model="formData.caCert"
            type="textarea"
            :rows="4"
            placeholder="可选：粘贴CA证书内容"
          />
        </ElFormItem>

        <ElFormItem label="状态">
          <ElSwitch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </ElFormItem>

        <ElFormItem label="描述" prop="description">
          <ElInput
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入仓库描述"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleTestConnection" :loading="testing">
          测试连接
        </ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 绑定集群对话框 -->
    <BindClusterDialog
      v-model="bindDialogVisible"
      :registry="currentRegistry"
      @success="handleBindSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    Container,
    Plus,
    Search,
    LayoutGrid,
    List,
    RefreshCw,
    Globe,
    User,
    Lock,
    Server,
    Package,
    Database
  } from 'lucide-vue-next'
  import RepositoryCard from './components/RepositoryCard.vue'
  import RepositoryTable from './components/RepositoryTable.vue'
  import BindClusterDialog from './components/BindClusterDialog.vue'
  import {
    listRegistriesApi,
    createRegistryApi,
    updateRegistryApi,
    deleteRegistryApi,
    testRegistryConnectionApi,
    type ContainerRegistry,
    type CreateRegistryRequest,
    type UpdateRegistryRequest
  } from '@/api'

  const router = useRouter()

  // 视图模式
  const viewMode = ref<'card' | 'list'>('card')

  // 仓库列表
  const registries = ref<ContainerRegistry[]>([])
  const total = ref(0)
  const loading = ref(false)

  // 搜索参数
  const searchParams = reactive({
    page: 1,
    pageSize: 12,
    name: '',
    env: '',
    type: '',
    status: undefined as number | undefined
  })

  // 对话框
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const testing = ref(false)

  // 表单数据
  const formData = reactive({
    id: 0,
    name: '',
    type: 'harbor',
    env: 'dev',
    url: '',
    username: '',
    password: '',
    insecure: false,
    caCert: '',
    status: 1,
    description: ''
  })

  // 表单验证规则
  const formRules: FormRules = {
    name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择仓库类型', trigger: 'change' }],
    env: [{ required: true, message: '请选择环境类型', trigger: 'change' }],
    url: [
      { required: true, message: '请输入仓库地址', trigger: 'blur' },
      {
        pattern: /^https?:\/\/.+/,
        message: '请输入正确的URL地址',
        trigger: 'blur'
      }
    ],
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  }

  // 绑定集群
  const bindDialogVisible = ref(false)
  const currentRegistry = ref<ContainerRegistry>()

  // 获取仓库列表
  const fetchRegistries = async () => {
    loading.value = true
    try {
      const response = await listRegistriesApi(searchParams)
      registries.value = response.data || []
      total.value = response.total || 0
    } catch (error) {
      console.error('获取仓库列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = () => {
    searchParams.page = 1
    fetchRegistries()
  }

  // 视图切换
  const handleViewChange = () => {
    localStorage.setItem('repositories-view-mode', viewMode.value)
  }

  // 分页
  const handleSizeChange = () => {
    searchParams.page = 1
    fetchRegistries()
  }

  const handlePageChange = () => {
    fetchRegistries()
  }

  // 创建仓库
  const handleCreate = () => {
    dialogMode.value = 'create'
    Object.assign(formData, {
      id: 0,
      name: '',
      type: 'harbor',
      env: 'dev',
      url: '',
      username: '',
      password: '',
      insecure: false,
      caCert: '',
      status: 1,
      description: ''
    })
    dialogVisible.value = true
  }

  // 编辑仓库
  const handleEdit = (registry: ContainerRegistry) => {
    dialogMode.value = 'edit'
    Object.assign(formData, {
      id: registry.id,
      name: registry.name,
      type: registry.type,
      env: registry.env,
      url: registry.url,
      username: registry.username,
      password: '',
      insecure: registry.insecure,
      caCert: registry.caCert || '',
      status: registry.status,
      description: registry.description || ''
    })
    dialogVisible.value = true
  }

  // 删除仓库
  const handleDelete = async (registry: ContainerRegistry) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除仓库 "${registry.name}" 吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await deleteRegistryApi(registry.id)
      ElMessage.success('删除成功')
      fetchRegistries()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除仓库失败:', error)
      }
    }
  }

  // 管理仓库 - 跳转到项目管理页面，传递 registryUrl 和 registryName
  const handleManage = (registry: ContainerRegistry) => {
    router.push({
      name: 'RegistryProjects',
      params: {
        registryUuid: registry.uuid
      },
      query: {
        registryUrl: registry.url,
        registryName: registry.name
      }
    })
  }

  // 绑定集群
  const handleBindCluster = (registry: ContainerRegistry) => {
    currentRegistry.value = registry
    bindDialogVisible.value = true
  }

  // 绑定成功
  const handleBindSuccess = () => {
    ElMessage.success('绑定成功')
    fetchRegistries()
  }

  // 测试连接
  const handleTestConnection = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      testing.value = true
      const response = await testRegistryConnectionApi({
        url: formData.url,
        username: formData.username,
        password: formData.password,
        insecure: formData.insecure,
        caCert: formData.caCert,
        type: formData.type
      })

      if (response.data.success) {
        ElMessage.success('连接测试成功')
      } else {
      }
    } catch (error: any) {
      console.error('测试连接失败:', error)
    } finally {
      testing.value = false
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      submitting.value = true

      if (dialogMode.value === 'create') {
        const createData: CreateRegistryRequest = {
          name: formData.name,
          type: formData.type,
          env: formData.env,
          url: formData.url,
          username: formData.username,
          password: formData.password,
          insecure: formData.insecure,
          caCert: formData.caCert || undefined,
          status: formData.status,
          description: formData.description || undefined,
          createdBy: 'admin'
        }
        await createRegistryApi(createData)
        ElMessage.success('创建成功')
      } else {
        const updateData: UpdateRegistryRequest = {
          name: formData.name,
          type: formData.type,
          env: formData.env,
          url: formData.url,
          username: formData.username,
          password: formData.password,
          insecure: formData.insecure,
          caCert: formData.caCert || undefined,
          status: formData.status,
          description: formData.description || undefined,
          updatedBy: 'admin'
        }
        await updateRegistryApi(formData.id, updateData)
        ElMessage.success('保存成功')
      }

      dialogVisible.value = false
      fetchRegistries()
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  // 初始化
  onMounted(() => {
    // 恢复视图模式
    const savedViewMode = localStorage.getItem('repositories-view-mode')
    if (savedViewMode === 'list' || savedViewMode === 'card') {
      viewMode.value = savedViewMode
    }

    fetchRegistries()
  })
</script>

<style lang="scss" scoped>
  .repositories-container {
    padding: 20px;

    /* 修复按钮内图标和文字的水平排列 */
    .button-content {
      display: inline-flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 4px !important;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;

      .header-left {
        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 8px 0;
        }

        .page-description {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin: 0;
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }

    .filter-card {
      margin-bottom: 16px;

      .filter-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;

        .filter-left {
          flex: 1;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }
      }
    }

    .content-card {
      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }

      .pagination-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }

    .type-option {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .form-tip {
      margin-left: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
