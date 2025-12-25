<template>
  <el-select
    v-model="selectedUserId"
    placeholder="请选择用户"
    filterable
    remote
    reserve-keyword
    :remote-method="handleSearch"
    :loading="loading"
    style="width: 100%"
    @change="handleChange"
  >
    <el-option
      v-for="user in userList"
      :key="user.id"
      :label="`${user.nickname} (${user.username})`"
      :value="user.id"
    >
      <div class="user-option">
        <span class="user-name">{{ user.nickname }}</span>
        <span class="user-username">@{{ user.username }}</span>
      </div>
    </el-option>

    <!-- 加载更多 -->
    <template #footer>
      <div v-if="hasMore" class="select-footer">
        <el-button text @click="handleLoadMore" size="small"> 加载更多... </el-button>
      </div>
    </template>
  </el-select>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { searchUserApi, type UserSysUser } from '@/api/portal/user'

  interface Props {
    modelValue?: number
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'change'])

  const selectedUserId = ref<number | undefined>(props.modelValue)
  const loading = ref(false)
  const userList = ref<UserSysUser[]>([])
  const currentPage = ref(1)
  const pageSize = ref(20)
  const hasMore = ref(false)
  const searchKeyword = ref('')

  // 加载用户列表
  const loadUsers = async (keyword: string = '', page: number = 1, append: boolean = false) => {
    loading.value = true
    try {
      const res = await searchUserApi({
        page,
        pageSize: pageSize.value,
        username: keyword,
        nickname: keyword
      })

      if (append) {
        userList.value = [...userList.value, ...(res.items || [])]
      } else {
        userList.value = res.items || []
      }

      hasMore.value = (res.total || 0) > page * pageSize.value
      currentPage.value = page
    } catch (error) {
      console.error('加载用户列表失败', error)
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = (query: string) => {
    searchKeyword.value = query
    loadUsers(query, 1, false)
  }

  // 加载更多
  const handleLoadMore = () => {
    loadUsers(searchKeyword.value, currentPage.value + 1, true)
  }

  // 选择变化
  const handleChange = (value: number) => {
    emit('update:modelValue', value)
    emit('change', value)
  }

  // 监听外部值变化
  watch(
    () => props.modelValue,
    (val) => {
      selectedUserId.value = val
    }
  )

  // 初始化
  onMounted(() => {
    loadUsers()
  })
</script>

<style scoped lang="scss">
  .user-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;

    .user-name {
      font-weight: 500;
      color: #303133;
      flex: 1;
    }

    .user-username {
      font-size: 13px;
      color: #909399;
    }
  }

  .select-footer {
    padding: 8px;
    text-align: center;
    border-top: 1px solid #ebeef5;

    .el-button {
      width: 100%;
      color: #409eff;
    }
  }
</style>