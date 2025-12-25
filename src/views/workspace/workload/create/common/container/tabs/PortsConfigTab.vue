<template>
  <div class="ports-config-tab">
    <div class="tab-header">
      <div class="tab-description">
        <Info :size="16" />
        <span>配置容器暴露的端口，端口名称将自动生成</span>
      </div>
      <ElSpace>
        <ElButton size="small" @click="addCommonPorts">
          <Zap :size="14" style="margin-right: 4px" />
          常用端口
        </ElButton>
        <ElButton type="primary" size="small" @click="addPort">
          <Plus :size="14" style="margin-right: 4px" />
          添加端口
        </ElButton>
      </ElSpace>
    </div>

    <ElEmpty v-if="localPorts.length === 0" description="暂无端口配置" :image-size="80">
      <ElButton type="primary" plain @click="addPort">
        <Plus :size="14" style="margin-right: 4px" />
        添加第一个端口
      </ElButton>
    </ElEmpty>

    <div v-else class="ports-list">
      <div v-for="(port, index) in localPorts" :key="`port-${index}`" class="port-item">
        <div class="port-header">
          <div class="port-title">
            <Network :size="14" />
            <span>端口 {{ index + 1 }}</span>
            <ElTag v-if="port.name" size="small" type="success">{{ port.name }}</ElTag>
          </div>
          <ElButton type="danger" text size="small" @click="removePort(index)" :icon="Trash2" />
        </div>

        <ElRow :gutter="12">
          <ElCol :span="6">
            <ElFormItem size="small">
              <template #label>
                <span class="label-text">
                  协议
                  <ElTooltip content="选择端口使用的协议类型" placement="top">
                    <Info :size="11" class="hint-icon" />
                  </ElTooltip>
                </span>
              </template>
              <ElSelect
                v-model="port.protocol"
                size="small"
                @change="() => handleProtocolChange(index)"
              >
                <ElOption label="TCP" value="TCP" />
                <ElOption label="UDP" value="UDP" />
                <ElOption label="SCTP" value="SCTP" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem size="small" required>
              <template #label>
                <span class="label-text">
                  容器端口
                  <ElTooltip content="容器内部监听的端口号" placement="top">
                    <Info :size="11" class="hint-icon" />
                  </ElTooltip>
                </span>
              </template>
              <ElInputNumber
                v-model="port.containerPort"
                :min="1"
                :max="65535"
                :controls="false"
                size="small"
                placeholder="8080"
                class="full-width"
                @change="() => handlePortChange(index)"
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem size="small">
              <template #label>
                <span class="label-text">
                  端口名称
                  <ElTooltip content="端口的标识名称，自动生成" placement="top">
                    <Info :size="11" class="hint-icon" />
                  </ElTooltip>
                </span>
              </template>
              <ElInput
                v-model="port.name"
                size="small"
                :placeholder="getAutoPortName(port)"
                @input="debouncedUpdate"
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem size="small">
              <template #label>
                <span class="label-text">
                  主机端口
                  <ElTooltip content="映射到主机的端口号（可选）" placement="top">
                    <Info :size="11" class="hint-icon" />
                  </ElTooltip>
                </span>
              </template>
              <ElInputNumber
                v-model="port.hostPort"
                :min="0"
                :max="65535"
                :controls="false"
                size="small"
                placeholder="可选"
                class="full-width"
                @change="debouncedUpdate"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow :gutter="12" v-if="port.hostPort">
          <ElCol :span="12">
            <ElFormItem size="small">
              <template #label>
                <span class="label-text">
                  主机 IP
                  <ElTooltip content="绑定到主机的 IP 地址（可选）" placement="top">
                    <Info :size="11" class="hint-icon" />
                  </ElTooltip>
                </span>
              </template>
              <ElInput
                v-model="port.hostIP"
                size="small"
                placeholder="0.0.0.0"
                @input="debouncedUpdate"
              >
                <template #prefix>
                  <Globe :size="12" />
                </template>
              </ElInput>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useContainersStore } from '@/store/workload'
  import { Plus, Info, Network, Trash2, Globe, Zap } from 'lucide-vue-next'
  import { ElMessage } from 'element-plus'

  const containersStore = useContainersStore()

  // 本地端口数据
  const localPorts = ref<any[]>([])

  // 防抖更新
  let updateTimer: NodeJS.Timeout | null = null
  const debouncedUpdate = () => {
    if (updateTimer) clearTimeout(updateTimer)
    updateTimer = setTimeout(() => {
      updatePorts()
    }, 300)
  }

  // 加载端口数据
  const loadPorts = () => {
    const container = containersStore.selectedContainer
    localPorts.value = container?.ports ? [...container.ports] : []
  }

  // 生成自动端口名称
  function getAutoPortName(port: any): string {
    if (!port.containerPort) return ''
    const protocol = (port.protocol || 'TCP').toLowerCase()
    return `${protocol}-${port.containerPort}`
  }

  // 处理协议变化（自动更新名称）
  function handleProtocolChange(index: number) {
    const port = localPorts.value[index]
    if (port.containerPort && port.protocol) {
      // 如果名称是自动生成的格式，则自动更新
      const oldName = port.name
      const autoNamePattern = /^(tcp|udp|sctp)-\d+$/
      if (!oldName || autoNamePattern.test(oldName)) {
        port.name = getAutoPortName(port)
      }
    }
    updatePorts()
  }

  // 处理端口号变化（自动生成名称）
  function handlePortChange(index: number) {
    const port = localPorts.value[index]
    if (port.containerPort && port.protocol) {
      // 如果名称为空或是自动生成的格式，则自动更新
      const oldName = port.name
      const autoNamePattern = /^(tcp|udp|sctp)-\d+$/
      if (!oldName || autoNamePattern.test(oldName)) {
        port.name = getAutoPortName(port)
      }
    }
    updatePorts()
  }

  // 添加端口
  function addPort() {
    const newPort = {
      name: '',
      containerPort: 8080,
      protocol: 'TCP',
      hostPort: undefined,
      hostIP: ''
    }

    localPorts.value.push(newPort)

    // 自动生成名称
    setTimeout(() => {
      handlePortChange(localPorts.value.length - 1)
    }, 0)
  }

  // 删除端口
  function removePort(index: number) {
    localPorts.value.splice(index, 1)
    updatePorts()
  }

  // 更新端口配置到 store
  function updatePorts() {
    const container = containersStore.selectedContainer
    if (!container) return

    containersStore.updateContainer(container.id, { ports: localPorts.value })
  }

  // 添加常用端口
  function addCommonPorts() {
    const commonPorts = [
      { name: 'http', containerPort: 80, protocol: 'TCP' },
      { name: 'https', containerPort: 443, protocol: 'TCP' },
      { name: 'mysql', containerPort: 3306, protocol: 'TCP' },
      { name: 'redis', containerPort: 6379, protocol: 'TCP' },
      { name: 'postgres', containerPort: 5432, protocol: 'TCP' },
      { name: 'mongodb', containerPort: 27017, protocol: 'TCP' },
      { name: 'grpc', containerPort: 50051, protocol: 'TCP' }
    ]

    // 只添加不存在的端口
    const existingPorts = new Set(localPorts.value.map((p) => p.containerPort))
    const portsToAdd = commonPorts.filter((p) => !existingPorts.has(p.containerPort))

    if (portsToAdd.length === 0) {
      ElMessage.info('所有常用端口已添加')
      return
    }

    localPorts.value.push(...portsToAdd)
    updatePorts()
    ElMessage.success(`已添加 ${portsToAdd.length} 个常用端口`)
  }

  // 监听选中容器变化
  watch(
    () => containersStore.selectedContainerId,
    () => {
      loadPorts()
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .ports-config-tab {
    padding: 8px 0;

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ebeef5;

      .tab-description {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #606266;
      }
    }

    .ports-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .port-item {
        padding: 12px;
        background: #fafbfc;
        border-radius: 6px;
        border: 1px solid #e4e7ed;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 6px rgba(64, 158, 255, 0.08);
        }

        .port-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e8eaed;

          .port-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 600;
            color: #303133;
          }
        }

        ::v-deep(.el-form-item) {
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        ::v-deep(.el-form-item__label) {
          font-size: 12px;
          color: #606266;
          line-height: 24px;
          padding: 0;
        }

        .label-text {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;

          .hint-icon {
            color: #909399;
            cursor: help;
            transition: color 0.2s;

            &:hover {
              color: #409eff;
            }
          }
        }

        .full-width {
          width: 100%;
        }

        ::v-deep(.el-input__inner),
        ::v-deep(.el-input__wrapper) {
          font-size: 13px;
        }

        ::v-deep(.el-select) {
          width: 100%;
        }
      }
    }
  }
</style>
