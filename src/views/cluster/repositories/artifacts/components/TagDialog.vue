<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`标签详情 - ${tag?.name || ''}`"
    width="700px"
  >
    <div v-if="tag" class="tag-dialog">
      <!-- 基本信息 -->
      <div class="info-section">
        <h4 class="section-title">
          <Tag :size="16" />
          基本信息
        </h4>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="标签名称">
            <div class="tag-name-cell">
              <span class="tag-name">{{ tag.name }}</span>
              <ElButton :icon="Copy" size="small" link @click="copyText(tag.name)" />
            </div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag v-if="tag.immutable" type="warning" size="small">
              <Lock :size="12" />
              不可变
            </ElTag>
            <ElTag v-if="tag.signed" type="success" size="small">
              <ShieldCheck :size="12" />
              已签名
            </ElTag>
            <ElTag v-if="!tag.immutable && !tag.signed" type="info" size="small"> 普通标签 </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="推送时间">
            {{ formatDateTime(tag.pushTime) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="拉取时间">
            {{ tag.pullTime ? formatDateTime(tag.pullTime) : '从未拉取' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 拉取命令 -->
      <div class="info-section">
        <h4 class="section-title">
          <Terminal :size="16" />
          拉取命令
        </h4>
        <div class="code-block">
          <pre>{{ pullCommand }}</pre>
          <ElButton :icon="Copy" size="small" @click="copyText(pullCommand)" class="copy-btn">
            复制
          </ElButton>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="info-section">
        <ElAlert type="info" :closable="false" show-icon>
          <template #title>
            <div class="alert-title">使用说明</div>
          </template>
          <ul class="usage-tips">
            <li>使用上面的命令可以拉取该标签的镜像</li>
            <li>不可变标签一旦创建后无法修改或删除</li>
            <li>已签名标签表示镜像已通过内容信任验证</li>
          </ul>
        </ElAlert>
      </div>

      <!-- 操作按钮 -->
      <div class="info-section">
        <h4 class="section-title">
          <Settings :size="16" />
          操作
        </h4>
        <div class="action-buttons">
          <ElButton type="primary" :icon="Copy" @click="copyPullCommand"> 复制拉取命令 </ElButton>
          <ElButton v-if="!tag.immutable" type="danger" :icon="Trash2" @click="handleDelete">
            删除标签
          </ElButton>
          <ElTooltip v-else content="不可变标签无法删除" placement="top">
            <ElButton type="danger" :icon="Trash2" disabled>删除标签</ElButton>
          </ElTooltip>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:modelValue', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Tag, Lock, ShieldCheck, Copy, Terminal, Settings, Trash2 } from 'lucide-vue-next'

  interface TagInfo {
    id: number
    name: string
    pushTime: number
    pullTime?: number
    immutable: boolean
    signed: boolean
  }

  interface Props {
    modelValue: boolean
    tag: TagInfo | null
    registryUrl: string
    projectName: string
    repositoryName: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'delete', tag: TagInfo): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 拉取命令
  const pullCommand = computed(() => {
    if (!props.tag) return ''
    const host = props.registryUrl.replace(/^https?:\/\//, '')
    return `docker pull ${host}/${props.projectName}/${props.repositoryName}:${props.tag.name}`
  })

  // 格式化日期时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 复制文本
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('已复制到剪贴板')
    } catch {
    }
  }

  // 复制拉取命令
  const copyPullCommand = () => {
    copyText(pullCommand.value)
  }

  // 删除标签
  const handleDelete = async () => {
    if (!props.tag) return

    try {
      await ElMessageBox.confirm(
        `确定要删除标签 "${props.tag.name}" 吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      emit('delete', props.tag)
      emit('update:modelValue', false)
    } catch (error) {
      // 用户取消
    }
  }
</script>

<style lang="scss" scoped>
  .tag-dialog {
    .info-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .tag-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .tag-name {
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 14px;
        font-weight: 500;
      }
    }

    .code-block {
      position: relative;
      background: #f5f7fa;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
      padding: 16px;

      pre {
        margin: 0;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 13px;
        color: var(--el-text-color-primary);
        white-space: pre-wrap;
        word-break: break-all;
      }

      .copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
      }
    }

    .alert-title {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .usage-tips {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.8;

      li {
        margin-bottom: 4px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
</style>
