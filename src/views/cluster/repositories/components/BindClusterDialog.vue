<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="绑定集群"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="bind-cluster-dialog">
      <ElAlert title="绑定说明" type="info" :closable="false" style="margin-bottom: 20px">
        <template #default> 将镜像仓库绑定到集群后，该集群可以使用此仓库拉取和推送镜像 </template>
      </ElAlert>

      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <ElFormItem label="仓库" prop="registryName">
          <ElInput :model-value="registry?.name" disabled />
        </ElFormItem>

        <ElFormItem label="选择集群" prop="clusterUuid">
          <ElSelect
            v-model="formData.clusterUuid"
            placeholder="请选择要绑定的集群"
            style="width: 100%"
            loading-text="加载中..."
            :loading="loadingClusters"
            filterable
          >
            <ElOption
              v-for="cluster in availableClusters"
              :key="cluster.uuid"
              :label="cluster.name"
              :value="cluster.uuid"
            >
              <div class="cluster-option">
                <Server :size="16" />
                <span>{{ cluster.name }}</span>
                <ElTag v-if="cluster.environment" size="small" :type="getEnvType(cluster.environment)">
                  {{ getEnvText(cluster.environment) }}
                </ElTag>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <div v-if="boundClusters.length > 0" class="bound-clusters">
        <div class="section-title">已绑定的集群</div>
        <div class="cluster-list">
          <div v-for="item in boundClusters" :key="item.id" class="cluster-item">
            <div class="cluster-info">
              <Server :size="16" />
              <span>{{ item.clusterUuid }}</span>
            </div>
            <ElButton type="danger" size="small" :icon="Trash2" @click="handleUnbind(item)" text>
              解绑
            </ElButton>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit" :loading="submitting"> 绑定 </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Server, Trash2 } from 'lucide-vue-next'
import {
  bindRegistryToClusterApi,
  unbindRegistryFromClusterApi,
  listRegistryClustersApi,
  type ContainerRegistry,
  type RegistryCluster
} from '@/api'
import { searchClusterApi, type Cluster } from '@/api'

interface Props {
  modelValue: boolean
  registry?: ContainerRegistry
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const loadingClusters = ref(false)

const formData = reactive({
  clusterUuid: ''
})

const formRules: FormRules = {
  clusterUuid: [{ required: true, message: '请选择集群', trigger: 'change' }]
}

// 可用集群列表
const availableClusters = ref<Cluster[]>([])

// 已绑定的集群
const boundClusters = ref<RegistryCluster[]>([])

// 获取可用集群列表
const fetchAvailableClusters = async () => {
  loadingClusters.value = true
  try {
    const response = await searchClusterApi({
      page: 1,
      pageSize: 100
    })
    availableClusters.value = response.items || []
  } catch (error) {
    console.error('获取集群列表失败:', error)
  } finally {
    loadingClusters.value = false
  }
}

// 获取已绑定的集群
const fetchBoundClusters = async () => {
  if (!props.registry) return

  try {
    const response = await listRegistryClustersApi({
      registryId: props.registry.id
    })
    boundClusters.value = response.data || []
  } catch (error) {
    console.error('获取已绑定集群失败:', error)
  }
}

// 提交绑定
const handleSubmit = async () => {
  if (!formRef.value || !props.registry) return

  try {
    await formRef.value.validate()

    submitting.value = true
    await bindRegistryToClusterApi({
      registryId: props.registry.id,
      clusterUuid: formData.clusterUuid
    })

    ElMessage.success('绑定成功')
    emit('update:modelValue', false)
    emit('success')
  } catch (error: any) {
    console.error('绑定失败:', error)
  } finally {
    submitting.value = false
  }
}

// 解绑
const handleUnbind = async (item: RegistryCluster) => {
  try {
    await unbindRegistryFromClusterApi(item.id)
    ElMessage.success('解绑成功')
    fetchBoundClusters()
    emit('success')
  } catch (error: any) {
    console.error('解绑失败:', error)
  }
}

const getEnvType = (env: string) => {
  const types: Record<string, any> = {
    development: 'info',
    testing: 'warning',
    staging: 'success',
    production: 'danger'
  }
  return types[env] || 'info'
}

const getEnvText = (env: string) => {
  const texts: Record<string, string> = {
    development: '开发',
    testing: '测试',
    staging: '预发',
    production: '生产'
  }
  return texts[env] || env
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      formData.clusterUuid = ''
      fetchAvailableClusters()
      fetchBoundClusters()
    }
  }
)
</script>

<style lang="scss" scoped>
.bind-cluster-dialog {
  .cluster-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bound-clusters {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--el-border-color-lighter);

    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
    }

    .cluster-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .cluster-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-radius: 4px;
        background: var(--el-fill-color-light);

        .cluster-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
      }
    }
  }
}
</style>