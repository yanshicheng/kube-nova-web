<template>
  <div class="token-center-container">
    <div class="page-header">
      <div class="header-left">
        <h2>密钥中心</h2>
        <p>管理您的API密钥，用于系统集成和自动化操作</p>
      </div>
      <div class="header-right">
        <ElButton type="primary" @click="showCreateDialog = true">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          创建密钥
        </ElButton>
      </div>
    </div>

    <div class="token-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <ArtSvgIcon icon="ri:key-line" class="text-2xl" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalTokens }}</div>
          <div class="stat-label">总密钥数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <ArtSvgIcon icon="ri:checkbox-circle-line" class="text-2xl" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ activeTokens }}</div>
          <div class="stat-label">活跃密钥</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon expired">
          <ArtSvgIcon icon="ri:time-line" class="text-2xl" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ expiredTokens }}</div>
          <div class="stat-label">已过期</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon permanent">
          <ArtSvgIcon icon="ri:infinity-line" class="text-2xl" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ permanentTokens }}</div>
          <div class="stat-label">永久密钥</div>
        </div>
      </div>
    </div>

    <div class="token-list">
      <ElTable
        :data="tokenList"
        v-loading="loading"
        stripe
        style="width: 100%"
        empty-text="暂无密钥"
      >
        <ElTableColumn label="名称" prop="name" min-width="120">
          <template #default="{ row }">
            <div class="token-name">
              <ArtSvgIcon icon="ri:key-2-line" class="text-base" />
              {{ row.name }}
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="密钥" prop="token" min-width="300">
          <template #default="{ row }">
            <div class="token-value">
              <span v-if="!row.showToken">{{ maskToken(row.token) }}</span>
              <span v-else class="token-text">{{ row.token }}</span>
              <ElButton
                link
                size="small"
                @click="toggleTokenVisibility(row)"
                style="margin-left: 8px"
              >
                <ArtSvgIcon :icon="row.showToken ? 'ri:eye-off-line' : 'ri:eye-line'" />
              </ElButton>
              <ElButton link size="small" @click="copyToken(row.token)">
                <ArtSvgIcon icon="ri:file-copy-line" />
              </ElButton>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="类型" prop="type" width="120">
          <template #default="{ row }">
            <ElTag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="状态" prop="status" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="过期时间" prop="expireTime" width="180">
          <template #default="{ row }">
            <span v-if="row.type === 3">永不过期</span>
            <span v-else>{{ formatExpireTime(row.expireTime) }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="创建时间" prop="createdAt" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <ElButton link type="danger" size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-wrapper">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建密钥对话框 -->
    <ElDialog
      v-model="showCreateDialog"
      title="创建密钥"
      width="450px"
      :close-on-click-modal="false"
    >
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <ElFormItem label="名称" prop="name">
          <ElInput
            v-model="createForm.name"
            placeholder="请输入密钥名称"
            maxlength="50"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="类型" prop="type">
          <ElSelect v-model="createForm.type" placeholder="请选择" style="width: 100%">
            <ElOption label="临时密钥（24小时）" :value="1" />
            <ElOption label="长期密钥（90天）" :value="2" />
            <ElOption label="永久密钥（永不过期）" :value="3" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="状态" prop="status">
          <ElRadioGroup v-model="createForm.status">
            <ElRadio :label="1">启用</ElRadio>
            <ElRadio :label="0">禁用</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="handleCancelCreate">取消</ElButton>
        <ElButton type="primary" @click="handleCreate" :loading="createLoading">
          {{ createLoading ? '创建中...' : '创建' }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 新创建的密钥展示对话框 -->
    <ElDialog
      v-model="showNewTokenDialog"
      title="密钥创建成功"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="new-token-content">
        <ElAlert
          title="请妥善保管您的密钥"
          type="warning"
          description="这是密钥唯一一次完整显示的机会，关闭后将无法再次查看完整密钥。请立即复制并安全保存。"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />

        <div class="token-display">
          <div class="token-label">密钥名称</div>
          <div class="token-value-box">{{ newTokenName }}</div>

          <div class="token-label">密钥值</div>
          <div class="token-value-box">
            <code>{{ newToken }}</code>
            <ElButton type="primary" size="small" @click="copyNewToken" style="margin-left: 12px">
              复制密钥
            </ElButton>
          </div>
        </div>
      </div>

      <template #footer>
        <ElButton type="primary" @click="closeNewTokenDialog">我已保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { addTokenApi, deleteTokenApi, searchTokenApi } from '@/api/portal'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  defineOptions({ name: 'UserToken' })

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  // 状态
  const loading = ref(false)
  const createLoading = ref(false)
  const showCreateDialog = ref(false)
  const showNewTokenDialog = ref(false)
  const newToken = ref('')
  const newTokenName = ref('')
  const tokenList = ref<any[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 表单
  const createFormRef = ref<FormInstance>()
  const createForm = reactive({
    name: '',
    type: 1,
    status: 1
  })

  // 验证规则
  const createRules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入密钥名称', trigger: 'blur' },
      { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择密钥类型', trigger: 'change' }]
  })

  // 计算属性 - 使用total而不是tokenList.length
  const totalTokens = computed(() => total.value)
  const activeTokens = computed(
    () => tokenList.value.filter((t) => t.status === 1 && !isExpired(t)).length
  )
  const expiredTokens = computed(() => tokenList.value.filter((t) => isExpired(t)).length)
  const permanentTokens = computed(() => tokenList.value.filter((t) => t.type === 3).length)

  // 获取密钥列表
  const fetchTokenList = async () => {
    loading.value = true
    try {
      const userId = (userInfo.value as any).id || userInfo.value.userId
      if (!userId) {
        console.error('用户ID不存在')
        return
      }

      const response = await searchTokenApi({
        page: currentPage.value,
        pageSize: pageSize.value,
        ownerType: 1,
        ownerId: userId,
        orderStr: 'created_at',
        isAsc: false
      })

      // 处理响应
      if (response) {
        tokenList.value = response.items.map((item: any) => ({
          ...item,
          showToken: false
        }))
        total.value = response.total || 0
      } else {
        throw new Error('响应数据格式错误')
      }
    } catch (error: any) {
      console.error('获取密钥列表失败:', error)
      const errorMsg = error.response?.data?.message || error.message || '获取密钥列表失败'
      tokenList.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  // 创建密钥
  const handleCreate = async () => {
    const valid = await createFormRef.value?.validate()
    if (!valid) return

    createLoading.value = true
    try {
      const userId = userInfo.value.id || userInfo.value.userId
      if (!userId) {
        throw new Error('用户ID不存在')
      }

      const response: any = await addTokenApi({
        ownerType: 1,
        ownerId: userId,
        name: createForm.name,
        type: createForm.type,
        status: createForm.status
      })

      // 处理响应
      let tokenValue = ''
      if (response && response.data && response.data.token) {
        tokenValue = response.data.token
      } else if (response && response.token) {
        tokenValue = response.token
      } else if (response && typeof response === 'string') {
        tokenValue = response
      } else {
        throw new Error('未返回有效的密钥')
      }

      newToken.value = tokenValue
      newTokenName.value = createForm.name
      showCreateDialog.value = false
      showNewTokenDialog.value = true

      // 重置表单
      resetCreateForm()

      // 刷新列表
      await fetchTokenList()

      ElMessage.success('密钥创建成功')
    } catch (error: any) {
      console.error('创建密钥失败:', error)
      const errorMsg = error.response?.data?.message || error.message || '创建密钥失败'
    } finally {
      createLoading.value = false
    }
  }

  // 取消创建
  const handleCancelCreate = () => {
    showCreateDialog.value = false
    resetCreateForm()
  }

  // 重置创建表单
  const resetCreateForm = () => {
    createFormRef.value?.resetFields()
    createForm.name = ''
    createForm.type = 1
    createForm.status = 1
  }

  // 删除密钥
  const handleDelete = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定要删除密钥"${row.name}"吗？删除后将无法恢复。`, '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      })

      await deleteTokenApi(row.id)
      ElMessage.success('删除成功')
      await fetchTokenList()
    } catch (error: any) {
      if (error === 'cancel') {
        return
      }
      console.error('删除失败:', error)
      const errorMsg = error.response?.data?.message || error.message || '删除失败'
    }
  }

  // 工具函数
  const maskToken = (token: string) => {
    if (!token) return ''
    const len = token.length
    if (len <= 8) return '********'
    return token.substring(0, 4) + '****' + token.substring(len - 4)
  }

  const toggleTokenVisibility = (row: any) => {
    row.showToken = !row.showToken
  }

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      ElMessage.success('复制成功')
    } catch (error) {
      const input = document.createElement('input')
      input.value = token
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand('copy')
        ElMessage.success('复制成功')
      } catch {}
      document.body.removeChild(input)
    }
  }

  const copyNewToken = async () => {
    try {
      await navigator.clipboard.writeText(newToken.value)
      ElMessage.success('密钥已复制到剪贴板')
    } catch (error) {
      const input = document.createElement('input')
      input.value = newToken.value
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand('copy')
        ElMessage.success('密钥已复制到剪贴板')
      } catch {}
      document.body.removeChild(input)
    }
  }

  const closeNewTokenDialog = () => {
    showNewTokenDialog.value = false
    newToken.value = ''
    newTokenName.value = ''
  }

  const getTypeLabel = (type: number) => {
    const typeMap: Record<number, string> = {
      1: '临时密钥',
      2: '长期密钥',
      3: '永久密钥'
    }
    return typeMap[type] || '未知'
  }

  const getTypeTagType = (type: number): any => {
    const typeMap: Record<number, string> = {
      1: 'info',
      2: 'warning',
      3: 'success'
    }
    return typeMap[type] || 'info'
  }

  const isExpired = (token: any) => {
    if (token.type === 3) return false
    if (!token.expireTime) return false
    return token.expireTime * 1000 < Date.now()
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatExpireTime = (timestamp: number) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    const now = new Date()

    if (date < now) {
      return '已过期'
    }

    const diff = date.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `剩余 ${days} 天 ${hours} 小时`
    } else if (hours > 0) {
      return `剩余 ${hours} 小时`
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `剩余 ${minutes} 分钟`
    }
  }

  const handleSizeChange = (val: number) => {
    pageSize.value = val
    currentPage.value = 1
    fetchTokenList()
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    fetchTokenList()
  }

  onMounted(() => {
    fetchTokenList()
  })
</script>

<style lang="scss" scoped>
  .token-center-container {
    height: 100%;
    background: var(--art-main-bg-color);
    border-radius: calc(var(--custom-radius) + 4px);
    padding: 24px;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .header-left {
        h2 {
          font-size: 24px;
          margin-bottom: 8px;
          color: var(--art-text-gray-800);
        }

        p {
          color: var(--art-gray-600);
          font-size: 14px;
        }
      }
    }

    .token-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;

      .stat-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid var(--art-border-color);
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #6b7280;

          &.active {
            background: #dcfce7;
            color: #16a34a;
          }

          &.expired {
            background: #fee2e2;
            color: #dc2626;
          }

          &.permanent {
            background: #dbeafe;
            color: #2563eb;
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--art-text-gray-800);
            line-height: 1;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: var(--art-gray-600);
          }
        }
      }
    }

    .token-list {
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid var(--art-border-color);

      .token-name {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .token-value {
        display: flex;
        align-items: center;
        font-family: 'Monaco', 'Courier New', monospace;

        .token-text {
          font-size: 12px;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 4px;
          max-width: 300px;
          word-break: break-all;
        }

        .el-button {
          padding: 0 4px;
        }
      }

      .pagination-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
    }
  }

  .new-token-content {
    .token-display {
      .token-label {
        font-size: 14px;
        color: var(--art-gray-600);
        margin-bottom: 8px;
      }

      .token-value-box {
        background: #f3f4f6;
        border: 1px solid var(--art-border-dashed-color);
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        code {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          word-break: break-all;
          flex: 1;
          margin-right: 12px;
        }
      }
    }
  }

  @media screen and (max-width: 768px) {
    .token-center-container {
      padding: 16px;

      .token-stats {
        grid-template-columns: 1fr;
      }

      .token-list {
        overflow-x: auto;
      }
    }
  }
</style>
