<!-- views/cluster/node/modules/node-search.vue -->
<template>
  <div class="node-search">
    <ElForm ref="searchFormRef" :model="searchModel" label-width="80px" :inline="true">
      <ElRow :gutter="16">
        <ElCol :xs="24" :sm="12" :md="8" :lg="6">
          <ElFormItem label="节点名称" prop="nodeName">
            <ElInput
              v-model="searchModel.nodeName"
              placeholder="请输入节点名称"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <ElIcon>
                  <Platform />
                </ElIcon>
              </template>
            </ElInput>
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :sm="12" :md="8" :lg="6">
          <ElFormItem label="IP地址" prop="nodeIp">
            <ElInput
              v-model="searchModel.nodeIp"
              placeholder="请输入IP地址"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <ElIcon>
                  <Connection />
                </ElIcon>
              </template>
            </ElInput>
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :sm="12" :md="8" :lg="6">
          <ElFormItem label="节点角色" prop="nodeRole">
            <ElSelect
              v-model="searchModel.nodeRole"
              placeholder="请选择节点角色"
              clearable
              style="width: 100%"
            >
              <ElOption
                v-for="role in roleOptions"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              >
                <div class="option-item">
                  <ElTag :type="role.type" size="small">{{ role.label }}</ElTag>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :sm="12" :md="8" :lg="6">
          <ElFormItem label="节点状态" prop="nodeStatus">
            <ElSelect
              v-model="searchModel.nodeStatus"
              placeholder="请选择节点状态"
              clearable
              style="width: 100%"
            >
              <ElOption
                v-for="status in statusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              >
                <div class="option-item">
                  <ElBadge :is-dot="true" :type="status.type">
                    <span style="margin-left: 12px">{{ status.label }}</span>
                  </ElBadge>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :sm="24" :md="24" :lg="24">
          <ElFormItem label=" " style="margin-left: 10px">
            <ElSpace wrap>
              <ElButton type="primary" :icon="Search" @click="handleSearch"> 搜索</ElButton>
              <ElButton :icon="Refresh" @click="handleReset"> 重置</ElButton>
              <ElButton :icon="Filter" @click="toggleAdvanced">
                {{ showAdvanced ? '收起' : '高级' }}筛选
              </ElButton>
            </ElSpace>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 高级筛选 -->
      <ElCollapse-transition>
        <div v-show="showAdvanced" class="advanced-filter">
          <ElDivider content-position="left">
            <ElIcon>
              <Setting />
            </ElIcon>
            高级筛选条件
          </ElDivider>
          <ElRow :gutter="16">
            <ElCol :xs="24" :sm="12" :md="8" :lg="6">
              <ElFormItem label="架构类型" prop="architecture">
                <ElSelect
                  v-model="searchModel.architecture"
                  placeholder="请选择架构类型"
                  clearable
                  style="width: 100%"
                >
                  <ElOption label="amd64" value="amd64" />
                  <ElOption label="arm64" value="arm64" />
                  <ElOption label="其他" value="other" />
                </ElSelect>
              </ElFormItem>
            </ElCol>

            <ElCol :xs="24" :sm="12" :md="8" :lg="6">
              <ElFormItem label="CPU使用" prop="cpuUsage">
                <ElSlider
                  v-model="searchModel.cpuUsage"
                  :range="true"
                  :max="100"
                  :marks="{
                    0: '0%',
                    50: '50%',
                    100: '100%'
                  }"
                />
              </ElFormItem>
            </ElCol>

            <ElCol :xs="24" :sm="12" :md="8" :lg="6">
              <ElFormItem label="内存使用" prop="memoryUsage">
                <ElSlider
                  v-model="searchModel.memoryUsage"
                  :range="true"
                  :max="100"
                  :marks="{
                    0: '0%',
                    50: '50%',
                    100: '100%'
                  }"
                />
              </ElFormItem>
            </ElCol>

            <ElCol :xs="24" :sm="12" :md="8" :lg="6">
              <ElFormItem label="是否GPU" prop="hasGpu">
                <ElRadioGroup v-model="searchModel.hasGpu">
                  <ElRadio :value="null">全部</ElRadio>
                  <ElRadio :value="true">是</ElRadio>
                  <ElRadio :value="false">否</ElRadio>
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>
      </ElCollapse-transition>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { Search, Refresh, Filter, Setting, Platform, Connection } from '@element-plus/icons-vue'
  import type { FormInstance } from 'element-plus'

  interface SearchForm {
    nodeName: string
    nodeIp: string
    nodeRole: string
    nodeStatus: string
    architecture?: string
    cpuUsage?: [number, number]
    memoryUsage?: [number, number]
    hasGpu?: boolean | null
  }

  interface Props {
    modelValue: Record<string, any>
    clusterUuid?: string
    clusters?: any[]
  }

  interface Emits {
    (e: 'update:modelValue', value: SearchForm): void

    (e: 'update:clusterUuid', value: string): void

    (e: 'search', value: SearchForm): void

    (e: 'reset'): void

    (e: 'cluster-change', value: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 引用
  const searchFormRef = ref<FormInstance>()

  // 状态
  const showAdvanced = ref(false)
  const searchModel = reactive<SearchForm>({
    nodeName: '',
    nodeIp: '',
    nodeRole: '',
    nodeStatus: '',
    architecture: '',
    cpuUsage: [0, 100],
    memoryUsage: [0, 100],
    hasGpu: null
  })

  // 选项配置
  const roleOptions = [
    { label: 'Master', value: 'master', type: 'danger' },
    { label: 'Worker', value: 'worker', type: 'info' },
    { label: 'Edge', value: 'edge', type: 'warning' }
  ]

  const statusOptions = [
    { label: '就绪', value: 'Ready', type: 'success' },
    { label: '未就绪', value: 'NotReady', type: 'danger' },
    { label: '未知', value: 'Unknown', type: 'warning' },
    { label: '维护中', value: 'Maintenance', type: 'info' }
  ]

  // 监听外部值变化
  watch(
    () => props.modelValue,
    (newVal) => {
      Object.assign(searchModel, newVal)
    },
    { immediate: true }
  )

  // 切换高级筛选
  const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value
  }

  // 搜索
  const handleSearch = () => {
    const searchData = { ...searchModel }

    // 过滤掉空值和默认值
    Object.keys(searchData).forEach((key) => {
      const value = searchData[key as keyof SearchForm]
      if (value === '' || value === null || value === undefined) {
        delete searchData[key as keyof SearchForm]
      }
      // 处理范围值
      if (key === 'cpuUsage' || key === 'memoryUsage') {
        const rangeValue = value as [number, number]
        if (rangeValue && rangeValue[0] === 0 && rangeValue[1] === 100) {
          delete searchData[key as keyof SearchForm]
        }
      }
    })

    emit('update:modelValue', searchData)
    emit('search', searchData)
  }

  // 重置
  const handleReset = () => {
    searchFormRef.value?.resetFields()
    searchModel.nodeName = ''
    searchModel.nodeIp = ''
    searchModel.nodeRole = ''
    searchModel.nodeStatus = ''
    searchModel.architecture = ''
    searchModel.cpuUsage = [0, 100]
    searchModel.memoryUsage = [0, 100]
    searchModel.hasGpu = null
    showAdvanced.value = false

    emit('update:modelValue', searchModel)
    emit('reset')
  }
</script>

<style lang="scss" scoped>
  .node-search {
    .option-item {
      display: flex;
      align-items: center;
    }

    .advanced-filter {
      padding-top: 8px;

      :deep(.el-divider) {
        margin: 12px 0 20px;

        .el-divider__text {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: var(--el-text-color-regular);
        }
      }

      :deep(.el-slider) {
        padding: 0 12px;

        .el-slider__marks-text {
          font-size: 12px;
        }
      }
    }

    :deep(.el-form-item) {
      margin-bottom: 12px;

      .el-form-item__label {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }

    :deep(.el-badge) {
      .el-badge__content {
        &.is-dot {
          width: 8px;
          height: 8px;
        }
      }
    }
  }
</style>
