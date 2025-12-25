<template>
  <el-select
    v-model="selectedChannelIds"
    placeholder="请选择告警渠道"
    multiple
    filterable
    collapse-tags
    collapse-tags-tooltip
    :loading="loading"
    style="width: 100%"
    @change="handleChange"
  >
    <el-option
      v-for="channel in filteredChannelList"
      :key="channel.id"
      :label="`${channel.channelName} (${getChannelTypeName(channel.channelType)})`"
      :value="channel.id"
    >
      <div class="channel-option">
        <span class="channel-name">{{ channel.channelName }}</span>
        <el-tag size="small" type="info">{{ getChannelTypeName(channel.channelType) }}</el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { searchAlertChannelsApi, type AlertChannels } from '@/api/portal/alert'
  import { getChannelTypeName } from './channel-helper'

  interface Props {
    modelValue?: number[]
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'change'])

  const selectedChannelIds = ref<number[]>(props.modelValue || [])
  const loading = ref(false)
  const channelList = ref<AlertChannels[]>([])
  const filterText = ref('')

  // 过滤后的渠道列表
  const filteredChannelList = computed(() => {
    if (!filterText.value) return channelList.value
    const text = filterText.value.toLowerCase()
    return channelList.value.filter(
      (channel) =>
        channel.channelName.toLowerCase().includes(text) ||
        getChannelTypeName(channel.channelType).toLowerCase().includes(text)
    )
  })

  // 加载所有渠道（取消分页）
  const loadChannels = async () => {
    loading.value = true
    try {
      // searchAlertChannelsApi 返回 SearchAlertChannelsResponse，包含 items 数组
      const res = await searchAlertChannelsApi()
      channelList.value = res.items || []
    } catch (error) {
      // 错误已统一处理
    } finally {
      loading.value = false
    }
  }

  // 选择变化
  const handleChange = (value: number[]) => {
    emit('update:modelValue', value)
    emit('change', value)
  }

  // 监听外部值变化
  watch(
    () => props.modelValue,
    (val) => {
      selectedChannelIds.value = val || []
    }
  )

  // 初始化
  onMounted(() => {
    loadChannels()
  })
</script>

<style scoped lang="scss">
  .channel-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;

    .channel-name {
      font-weight: 500;
      color: #303133;
      flex: 1;
    }
  }
</style>