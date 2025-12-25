<template>
  <div class="alert-channel-page">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-input
            v-model="searchForm.channelName"
            placeholder="搜索渠道名称"
            clearable
            style="width: 240px"
            prefix-icon="Search"
          />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="searchForm.channelType"
            placeholder="渠道类型"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="type in channelTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增渠道</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 内容卡片 -->
    <el-card class="content-card" shadow="never">
      <!-- 卡片列表 -->
      <div v-loading="loading" class="channel-grid">
        <transition-group name="card">
          <el-card
            v-for="channel in tableData"
            :key="channel.id"
            class="channel-card"
            :class="{ 'is-selected': selectedChannelId === channel.id }"
            shadow="hover"
            @click="selectedChannelId = channel.id"
          >
            <!-- 卡片头部 -->
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <div class="channel-icon-wrapper">
                    <img
                      v-if="getChannelImageUrl(channel.channelType)"
                      :src="getChannelImageUrl(channel.channelType)"
                      class="channel-type-icon channel-image-icon"
                      alt=""
                    />
                    <component
                      v-else
                      :is="getChannelIcon(channel.channelType)"
                      class="channel-type-icon"
                      :style="{ color: getChannelColor(channel.channelType) }"
                    />
                  </div>
                  <div class="channel-info">
                    <h3 class="channel-name">{{ channel.channelName }}</h3>
                    <el-tag :type="getChannelTagType(channel.channelType)" size="small">
                      {{ getChannelTypeName(channel.channelType) }}
                    </el-tag>
                  </div>
                </div>
                <el-dropdown
                  v-if="channel.channelType !== 'site_message'"
                  trigger="click"
                  @command="(cmd) => handleCommand(cmd, channel)"
                >
                  <el-button type="info" text circle>
                    <el-icon size="20"><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="test" :icon="Connection">
                        <span class="dropdown-item-text">测试</span>
                      </el-dropdown-item>
                      <el-dropdown-item command="edit" :icon="Edit">
                        <span class="dropdown-item-text">编辑配置</span>
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" :icon="Delete" divided>
                        <span class="dropdown-item-text danger">删除渠道</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="content-section">
                <div class="section-label">
                  <el-icon><InfoFilled /></el-icon>
                  <span>描述</span>
                </div>
                <div class="section-value">
                  {{ channel.description || '暂无描述' }}
                </div>
              </div>

              <el-divider class="content-divider" />

              <div class="content-grid">
                <div class="grid-item">
                  <div class="item-label">
                    <el-icon class="item-icon"><RefreshRight /></el-icon>
                    <span>重试次数</span>
                  </div>
                  <div class="item-value">{{ channel.retryTimes }} 次</div>
                </div>
                <div class="grid-item">
                  <div class="item-label">
                    <el-icon class="item-icon"><Timer /></el-icon>
                    <span>超时时间</span>
                  </div>
                  <div class="item-value">{{ channel.timeout }} 秒</div>
                </div>
                <div class="grid-item">
                  <div class="item-label">
                    <el-icon class="item-icon"><TrendCharts /></el-icon>
                    <span>速率限制</span>
                  </div>
                  <div class="item-value">
                    {{ channel.rateLimit === 0 ? '无限制' : `${channel.rateLimit} 次/分钟` }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 卡片底部 -->
            <template #footer>
              <div class="card-footer">
                <div class="footer-info">
                  <el-tooltip content="创建人" placement="top">
                    <div class="footer-item">
                      <el-icon><User /></el-icon>
                      <span>{{ channel.createdBy }}</span>
                    </div>
                  </el-tooltip>
                  <el-tooltip content="创建时间" placement="top">
                    <div class="footer-item">
                      <el-icon><Clock /></el-icon>
                      <span>{{ formatTime(channel.createdAt) }}</span>
                    </div>
                  </el-tooltip>
                </div>
                <el-button
                  v-if="channel.channelType !== 'site_message'"
                  type="success"
                  size="small"
                  :icon="Connection"
                  @click.stop="handleTest(channel)"
                  plain
                >
                  测试
                </el-button>
              </div>
            </template>
          </el-card>
        </transition-group>

        <!-- 空状态 -->
        <el-empty
          v-if="!loading && tableData.length === 0"
          description="暂无渠道数据"
          class="empty-state"
          :image-size="180"
        >
          <el-button type="primary" :icon="Plus" @click="handleAdd" size="large">
            创建第一个渠道
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <channel-form-dialog
      v-model="dialogVisible"
      :channel-id="currentChannelId"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Search,
    Refresh,
    Plus,
    Edit,
    Delete,
    Connection,
    MoreFilled,
    InfoFilled,
    RefreshRight,
    Timer,
    TrendCharts,
    User,
    Clock
  } from '@element-plus/icons-vue'
  import {
    searchAlertChannelsApi,
    deleteAlertChannelsApi,
    testLinkApi,
    type AlertChannels
  } from '@/api/portal/alert'
  import { formatTime } from '@/utils/date'
  import {
    getChannelIcon,
    getChannelImageUrl,
    getChannelColor,
    getChannelGradient,
    getChannelTypeName,
    channelTypes
  } from './components/channel-helper'
  import ChannelFormDialog from './components/ChannelFormDialog.vue'

  // 搜索表单
  const searchForm = reactive({
    channelName: '',
    channelType: ''
  })

  // 表格数据
  const loading = ref(false)
  const tableData = ref<AlertChannels[]>([])

  // 对话框
  const dialogVisible = ref(false)
  const currentChannelId = ref<number>()
  const selectedChannelId = ref<number>()

  // 获取渠道标签类型
  const getChannelTagType = (type: string) => {
    const typeMap: Record<string, any> = {
      dingtalk: 'primary',
      wechat: 'success',
      feishu: 'info',
      email: 'danger',
      sms: 'warning',
      voice_call: 'info',
      webhook: 'success',
      site_message: 'info'
    }
    return typeMap[type] || 'info'
  }

  // 搜索
  const handleSearch = async () => {
    loading.value = true
    selectedChannelId.value = undefined
    try {
      // 不传分页参数，获取所有数据
      const res = await searchAlertChannelsApi(searchForm)
      tableData.value = res.items || []
    } catch (error) {
      console.error('查询失败', error)
    } finally {
      loading.value = false
    }
  }

  // 重置
  const handleReset = () => {
    searchForm.channelName = ''
    searchForm.channelType = ''
    handleSearch()
  }

  // 新增
  const handleAdd = () => {
    currentChannelId.value = undefined
    dialogVisible.value = true
  }

  // 编辑
  const handleEdit = (channel: AlertChannels) => {
    currentChannelId.value = channel.id
    dialogVisible.value = true
  }

  // 删除
  const handleDelete = async (channel: AlertChannels) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除渠道"${channel.channelName}"吗?删除后将无法恢复。`,
        '删除确认',
        {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消'
        }
      )
      await deleteAlertChannelsApi(channel.id)
      ElMessage.success('删除成功')
      handleSearch()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败', error)
      }
    }
  }

  // 测试连接
  const handleTest = async (channel: AlertChannels) => {
    // 判断是否需要输入接收人（邮件和短信需要）
    const needRecipients = ['email', 'sms'].includes(channel.channelType)

    let toNotifys: string[] = []

    if (needRecipients) {
      try {
        const inputType = channel.channelType === 'email' ? '邮箱地址' : '手机号码'
        const placeholder =
          channel.channelType === 'email'
            ? '请输入邮箱地址，多个用逗号分隔'
            : '请输入手机号码，多个用逗号分隔'

        const { value } = await ElMessageBox.prompt(`请输入测试${inputType}`, '测试连接', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: placeholder,
          inputValidator: (value) => {
            if (!value || !value.trim()) {
              return `请输入${inputType}`
            }
            return true
          }
        })

        // 分割并清理空格
        toNotifys = value
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item)

        if (toNotifys.length === 0) {
          ElMessage.warning(`请输入有效的${inputType}`)
          return
        }
      } catch (error) {
        // 用户取消了输入
        return
      }
    }

    const loadingMsg = ElMessage({
      message: '正在测试连接...',
      type: 'info',
      duration: 0,
      icon: Connection
    })

    try {
      await testLinkApi({
        channelType: channel.channelType,
        config: channel.config,
        toNotifys: toNotifys
      })

      loadingMsg.close()
      ElMessage.success({
        message: '✓ 连接测试成功！渠道配置正常',
        duration: 3000,
        showClose: true
      })
    } catch (error) {
      loadingMsg.close()
      console.error('连接测试失败', error)
    }
  }

  // 下拉菜单命令处理
  const handleCommand = (command: string, channel: AlertChannels) => {
    switch (command) {
      case 'edit':
        handleEdit(channel)
        break
      case 'test':
        handleTest(channel)
        break
      case 'delete':
        handleDelete(channel)
        break
    }
  }

  // 保存成功后的回调
  const handleSuccess = () => {
    handleSearch()
  }

  // 初始化
  onMounted(() => {
    handleSearch()
  })
</script>

<style scoped lang="scss">
  .alert-channel-page {
    background: #f5f7fa;
    min-height: calc(100vh - 60px);

    .search-card {
      margin-bottom: 24px;
      border-radius: 12px;
      border: none;

      :deep(.el-card__body) {
        padding: 20px;
      }
    }

    .content-card {
      border-radius: 12px;
      border: none;
      min-height: 500px;
      display: flex;
      flex-direction: column;

      :deep(.el-card__body) {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    }

    .channel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
      flex: 1;
      align-content: start;

      .channel-card {
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 2px solid transparent;
        background: white;
        cursor: pointer;
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.08),
          0 1px 4px rgba(0, 0, 0, 0.04);

        &:hover {
          transform: translateY(-6px);
          border-color: rgba(64, 158, 255, 0.4);
          box-shadow:
            0 12px 28px rgba(64, 158, 255, 0.25),
            0 6px 16px rgba(64, 158, 255, 0.15) !important;
        }

        &.is-selected {
          border-color: #409eff;

          &:hover {
            box-shadow:
              0 12px 28px rgba(64, 158, 255, 0.25),
              0 6px 16px rgba(64, 158, 255, 0.15) !important;
          }
        }

        :deep(.el-card__header) {
          padding: 0;
          border: none;
        }

        :deep(.el-card__body) {
          padding: 16px;
        }

        :deep(.el-card__footer) {
          padding: 12px 16px;
          background: #fafbfc;
          border-top: 1px solid #ebeef5;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);

          .header-left {
            display: flex;
            align-items: center;
            gap: 14px;
            flex: 1;
            min-width: 0;

            .channel-icon-wrapper {
              width: 48px;
              height: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;

              .channel-type-icon {
                width: 40px;
                height: 40px;

                &.channel-image-icon {
                  object-fit: contain;
                }
              }
            }

            .channel-info {
              display: flex;
              flex-direction: column;
              gap: 6px;
              min-width: 0;
              flex: 1;

              .channel-name {
                font-size: 17px;
                font-weight: 600;
                color: #303133;
                margin: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.3;
              }
            }
          }
        }

        .card-content {
          .content-section {
            margin-bottom: 12px;

            .section-label {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              font-weight: 600;
              color: #606266;
              margin-bottom: 6px;

              .el-icon {
                font-size: 15px;
                color: #909399;
              }
            }

            .section-value {
              font-size: 13px;
              color: #606266;
              line-height: 1.6;
              padding-left: 21px;
            }
          }

          .content-divider {
            margin: 12px 0;
          }

          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 12px;

            .grid-item {
              .item-label {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                color: #909399;
                margin-bottom: 5px;

                .item-icon {
                  font-size: 14px;
                }
              }

              .item-value {
                font-size: 15px;
                font-weight: 600;
                color: #303133;
              }
            }
          }
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .footer-info {
            display: flex;
            gap: 16px;

            .footer-item {
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 12px;
              color: #909399;

              .el-icon {
                font-size: 14px;
              }
            }
          }
        }
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      padding: 40px 0;
    }
  }

  .dropdown-item-text {
    &.danger {
      color: #f56c6c;
    }
  }

  // 卡片过渡动画
  .card-enter-active,
  .card-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-enter-from {
    opacity: 0;
    transform: translateY(20px);
  }

  .card-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }
</style>
