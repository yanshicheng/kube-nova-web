<template>
  <ElTable :data="data" v-loading="loading" style="width: 100%" @expand-change="handleExpand">
    <ElTableColumn type="expand">
      <template #default="{ row }">
        <div class="artifact-details">
          <div class="detail-section">
            <h4>标签列表</h4>
            <div class="tags-list">
              <div v-for="tag in row.tags" :key="tag.id" class="tag-item">
                <div class="tag-info">
                  <Tag :size="16" />
                  <span class="tag-name">{{ tag.name }}</span>
                  <ElTag v-if="tag.immutable" size="small" type="warning">
                    <Lock :size="12" />
                    不可变
                  </ElTag>
                  <ElTag v-if="tag.signed" size="small" type="success">
                    <ShieldCheck :size="12" />
                    已签名
                  </ElTag>
                </div>
                <div class="tag-meta">
                  <span>推送: {{ formatDateTime(tag.pushTime) }}</span>
                  <span v-if="tag.pullTime">拉取: {{ formatDateTime(tag.pullTime) }}</span>
                </div>
                <div class="tag-actions">
                  <ElButton
                    type="primary"
                    size="small"
                    link
                    :icon="Copy"
                    @click="$emit('copy-command', row.repositoryName, tag)"
                  >
                    复制命令
                  </ElButton>
                  <ElButton
                    type="danger"
                    size="small"
                    link
                    :icon="Trash2"
                    @click="$emit('delete-tag', row.repositoryName, tag)"
                  >
                    删除
                  </ElButton>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>制品信息</h4>
            <ElDescriptions :column="2" border size="small">
              <ElDescriptionsItem label="类型">
                {{ row.type }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="大小">
                {{ formatSize(row.size) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="摘要" :span="2">
                <div class="digest-cell">
                  <span class="digest-text">{{ row.digest }}</span>
                  <ElButton
                    :icon="Copy"
                    size="small"
                    link
                    @click="$emit('copy-text', row.digest)"
                  />
                </div>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="媒体类型" :span="2">
                {{ row.manifestMediaType }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="推送时间">
                {{ formatDateTime(row.pushTime) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="拉取时间">
                {{ row.pullTime ? formatDateTime(row.pullTime) : '-' }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="制品摘要" min-width="200">
      <template #default="{ row }">
        <div class="digest-cell">
          <span class="digest-text">{{ formatDigest(row.digest) }}</span>
          <ElButton :icon="Copy" size="small" link @click="$emit('copy-text', row.digest)" />
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="标签" width="200">
      <template #default="{ row }">
        <div class="tags-preview">
          <ElTag
            v-for="(tag, index) in row.tags.slice(0, 3)"
            :key="tag.id"
            size="small"
            style="margin-right: 4px"
          >
            {{ tag.name }}
          </ElTag>
          <ElTag v-if="row.tags.length > 3" size="small" type="info">
            +{{ row.tags.length - 3 }}
          </ElTag>
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="大小" width="100">
      <template #default="{ row }">
        {{ formatSize(row.size) }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="推送时间" width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.pushTime) }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="操作" width="150" fixed="right">
      <template #default="{ row }">
        <ElButton
          type="danger"
          size="small"
          link
          :icon="Trash2"
          @click="$emit('delete-artifact', row.repositoryName, row)"
        >
          删除制品
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>
</template>

<script setup lang="ts">
  import { Tag, Lock, ShieldCheck, Copy, Trash2 } from 'lucide-vue-next'
  import type { Artifact } from '@/api'

  interface Props {
    data: Artifact[]
    loading?: boolean
  }

  interface Emits {
    (e: 'expand', row: Artifact): void
    (e: 'copy-command', repoName: string, tag: any): void
    (e: 'copy-text', text: string): void
    (e: 'delete-tag', repoName: string, tag: any): void
    (e: 'delete-artifact', repoName: string, artifact: Artifact): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDigest = (digest: string) => {
    if (!digest) return '-'
    if (digest.length > 20) {
      return digest.substring(0, 12) + '...' + digest.substring(digest.length - 8)
    }
    return digest
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const handleExpand = (row: Artifact) => {
    emit('expand', row)
  }
</script>

<style lang="scss" scoped>
  .artifact-details {
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;

    .detail-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .tags-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .tag-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--el-bg-color);
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 6px;

          .tag-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .tag-name {
              font-size: 14px;
              font-weight: 500;
              font-family: 'Monaco', 'Consolas', monospace;
            }
          }

          .tag-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }

          .tag-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }

  .digest-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    .digest-text {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .tags-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
</style>
