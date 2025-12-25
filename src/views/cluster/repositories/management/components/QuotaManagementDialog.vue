<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="配额管理"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="quota-management-dialog" v-loading="loading">
      <div class="project-info">
        <div class="info-label">项目名称:</div>
        <div class="info-value">{{ project?.name }}</div>
      </div>

      <!-- 当前配额信息 -->
      <div v-if="quotaInfo" class="current-quota">
        <div class="section-title">
          <HardDrive :size="16" />
          当前配额使用情况
        </div>

        <div class="quota-stats">
          <div class="stat-card">
            <div class="stat-label">存储配额</div>
            <div class="stat-value">
              {{ formatStorageLimit(quotaInfo.storageLimit) }}
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">已使用</div>
            <div class="stat-value">{{ formatSize(quotaInfo.storageUsed || 0) }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">使用率</div>
            <div class="stat-value">
              <ElProgress
                :percentage="usagePercentage"
                :color="getProgressColor(usagePercentage)"
                :stroke-width="10"
              />
            </div>
          </div>
        </div>

        <!-- 制品数量统计 -->
        <div v-if="quotaInfo.countLimit !== undefined" class="quota-stats" style="margin-top: 16px">
          <div class="stat-card">
            <div class="stat-label">制品数量限额</div>
            <div class="stat-value">
              {{ quotaInfo.countLimit === -1 ? '无限制' : quotaInfo.countLimit }}
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">已使用</div>
            <div class="stat-value">{{ quotaInfo.countUsed || 0 }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">剩余</div>
            <div class="stat-value">
              {{
                quotaInfo.countLimit === -1
                  ? '无限制'
                  : quotaInfo.countLimit - (quotaInfo.countUsed || 0)
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- 配额设置 -->
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        style="margin-top: 20px"
      >
        <ElFormItem label="存储限额" prop="storageLimit">
          <div class="storage-limit-input">
            <ElInputNumber
              v-model="formData.storageLimit"
              :min="-1"
              :step="1"
              placeholder="-1表示无限制"
              style="width: 200px"
            />
            <ElSelect v-model="formData.storageUnit" style="width: 100px">
              <ElOption label="B" value="B" />
              <ElOption label="KB" value="KB" />
              <ElOption label="MB" value="MB" />
              <ElOption label="GB" value="GB" />
              <ElOption label="TB" value="TB" />
            </ElSelect>
          </div>
          <div class="form-tip">-1 表示无限制</div>
        </ElFormItem>

        <ElFormItem label="制品数量限额" prop="countLimit">
          <ElInputNumber
            v-model="formData.countLimit"
            :min="-1"
            :step="10"
            placeholder="-1表示无限制"
            style="width: 100%"
          />
          <div class="form-tip">-1 表示无限制</div>
        </ElFormItem>
      </ElForm>

      <!-- 预警说明 -->
      <ElAlert type="info" :closable="false" show-icon style="margin-top: 20px">
        <template #title>配额说明</template>
        <ul class="tips-list">
          <li>存储限额用于限制项目可使用的存储空间</li>
          <li>制品数量限额用于限制项目可存储的制品数量</li>
          <li>设置为 -1 表示不限制</li>
          <li>建议根据实际需求合理设置配额，避免资源浪费</li>
        </ul>
      </ElAlert>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit" :loading="submitting"> 保存 </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { HardDrive } from 'lucide-vue-next'
  import { getProjectQuotaApi, updateProjectQuotaApi, type RegistryProject } from '@/api'

  interface QuotaInfo {
    storageLimit: number
    storageUsed?: number
    countLimit?: number
    countUsed?: number
  }

  interface Props {
    modelValue: boolean
    registryUuid: string
    project?: RegistryProject
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const submitting = ref(false)

  const quotaInfo = ref<QuotaInfo>()

  const formData = reactive({
    storageLimit: -1,
    storageUnit: 'GB',
    countLimit: -1
  })

  const formRules: FormRules = {
    storageLimit: [{ required: true, message: '请输入存储限额', trigger: 'blur' }],
    countLimit: [{ required: true, message: '请输入制品数量限额', trigger: 'blur' }]
  }

  // 使用率
  const usagePercentage = computed(() => {
    if (!quotaInfo.value || quotaInfo.value.storageLimit === -1) return 0
    if (quotaInfo.value.storageLimit === 0) return 0
    const used = quotaInfo.value.storageUsed || 0
    return Math.round((used / quotaInfo.value.storageLimit) * 100)
  })

  // 获取进度条颜色
  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return '#67c23a'
    if (percentage < 80) return '#e6a23c'
    return '#f56c6c'
  }

  // 格式化大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // 格式化存储限额
  const formatStorageLimit = (bytes: number) => {
    if (bytes === -1) return '无限制'
    return formatSize(bytes)
  }

  // 获取配额信息
  const fetchQuotaInfo = async () => {
    if (!props.project) return

    loading.value = true
    try {
      const response = await getProjectQuotaApi(props.project.name, props.registryUuid)
      quotaInfo.value = response.data

      // 更新表单数据 - 将字节转换为合适的单位
      const limit = quotaInfo.value.storageLimit
      if (limit === -1) {
        formData.storageLimit = -1
        formData.storageUnit = 'GB'
      } else {
        // 自动选择合适的单位
        if (limit >= 1024 * 1024 * 1024 * 1024) {
          formData.storageLimit = Math.round(limit / (1024 * 1024 * 1024 * 1024))
          formData.storageUnit = 'TB'
        } else if (limit >= 1024 * 1024 * 1024) {
          formData.storageLimit = Math.round(limit / (1024 * 1024 * 1024))
          formData.storageUnit = 'GB'
        } else if (limit >= 1024 * 1024) {
          formData.storageLimit = Math.round(limit / (1024 * 1024))
          formData.storageUnit = 'MB'
        } else if (limit >= 1024) {
          formData.storageLimit = Math.round(limit / 1024)
          formData.storageUnit = 'KB'
        } else {
          formData.storageLimit = limit
          formData.storageUnit = 'B'
        }
      }

      formData.countLimit = quotaInfo.value.countLimit || -1
    } catch (error) {
      console.error('获取配额信息失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!formRef.value || !props.project) return

    try {
      await formRef.value.validate()

      submitting.value = true
      await updateProjectQuotaApi(props.project.name, {
        registryUuid: props.registryUuid,
        storageLimit: formData.storageLimit,
        storageUnit: formData.storageUnit,
        countLimit: formData.countLimit
      })

      ElMessage.success('保存成功')
      emit('update:modelValue', false)
      emit('success')
    } catch (error: any) {
      console.error('保存失败:', error)
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        fetchQuotaInfo()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .quota-management-dialog {
    .project-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      margin-bottom: 20px;
      border-radius: 4px;
      background: var(--el-fill-color-light);

      .info-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }

      .info-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        font-family: 'Monaco', 'Consolas', monospace;
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 16px;
    }

    .current-quota {
      padding: 16px;
      border-radius: 4px;
      background: var(--el-fill-color-light);

      .quota-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        .stat-card {
          .stat-label {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            margin-bottom: 8px;
          }

          .stat-value {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .storage-limit-input {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .form-tip {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .tips-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.8;

      li {
        margin-bottom: 4px;
      }
    }
  }
</style>
