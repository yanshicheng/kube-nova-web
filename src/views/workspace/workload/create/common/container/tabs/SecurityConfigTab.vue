<template>
  <div class="security-config-tab">
    <!-- 快速配置按钮 -->
    <div class="quick-actions-bar">
      <div class="actions-title">
        <Zap :size="16" />
        <span>快速配置</span>
      </div>
      <div class="actions-buttons">
        <ElButton size="small" @click="applySecureTemplate">
          <Shield :size="14" />
          安全加固
        </ElButton>
        <ElButton size="small" @click="applyDefaultTemplate">
          <RotateCw :size="14" />
          恢复默认
        </ElButton>
        <ElButton size="small" type="danger" plain @click="clearSecurity">
          <Trash2 :size="14" />
          清空配置
        </ElButton>
      </div>
    </div>

    <!-- 标签页 -->
    <ElTabs v-model="activeTab" type="border-card" class="security-tabs">
      <!-- 基本安全 -->
      <ElTabPane label="基本安全" name="basic">
        <div class="tab-content">
          <ElForm :model="formData" label-width="180px" label-position="left">
            <ElFormItem label="特权模式">
              <div class="switch-with-desc">
                <ElSwitch v-model="formData.privileged" @change="updateSecurity" />
                <span class="switch-desc">
                  {{
                    formData.privileged
                      ? '已启用 - 容器拥有主机所有权限（高风险）'
                      : '已禁用 - 推荐'
                  }}
                </span>
              </div>
            </ElFormItem>

            <ElFormItem label="允许权限提升">
              <div class="switch-with-desc">
                <ElSwitch v-model="formData.allowPrivilegeEscalation" @change="updateSecurity" />
                <span class="switch-desc">
                  {{
                    formData.allowPrivilegeEscalation ? '允许进程获得更多权限' : '不允许权限提升'
                  }}
                </span>
              </div>
            </ElFormItem>

            <ElFormItem label="强制非 Root 运行">
              <div class="switch-with-desc">
                <ElSwitch v-model="formData.runAsNonRoot" @change="updateSecurity" />
                <span class="switch-desc">
                  {{ formData.runAsNonRoot ? '容器必须以非 Root 用户运行' : '允许以任意用户运行' }}
                </span>
              </div>
            </ElFormItem>

            <ElFormItem label="只读根文件系统">
              <div class="switch-with-desc">
                <ElSwitch v-model="formData.readOnlyRootFilesystem" @change="updateSecurity" />
                <span class="switch-desc">
                  {{
                    formData.readOnlyRootFilesystem
                      ? '根文件系统只读（提高安全性）'
                      : '根文件系统可写'
                  }}
                </span>
              </div>
            </ElFormItem>
          </ElForm>
        </div>
      </ElTabPane>

      <!-- 用户与组配置 -->
      <ElTabPane label="用户与组配置" name="user">
        <div class="tab-content">
          <ElForm :model="formData" label-width="180px" label-position="left">
            <ElRow :gutter="20">
              <ElCol :span="12">
                <ElFormItem label="运行用户 ID (UID)">
                  <ElInputNumber
                    v-model="formData.runAsUser"
                    :min="0"
                    :max="65535"
                    placeholder="例如: 1000"
                    style="width: 100%"
                    controls-position="right"
                    @change="updateSecurity"
                  />
                  <div class="field-hint">指定容器进程运行的用户 ID</div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="运行组 ID (GID)">
                  <ElInputNumber
                    v-model="formData.runAsGroup"
                    :min="0"
                    :max="65535"
                    placeholder="例如: 1000"
                    style="width: 100%"
                    controls-position="right"
                    @change="updateSecurity"
                  />
                  <div class="field-hint">指定容器进程运行的组 ID</div>
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElFormItem label="文件系统组 ID (fsGroup)">
              <ElInputNumber
                v-model="formData.fsGroup"
                :min="0"
                :max="65535"
                placeholder="例如: 2000"
                style="width: 100%"
                controls-position="right"
                @change="updateSecurity"
              />
              <div class="field-hint">所有挂载卷的所属组 ID</div>
            </ElFormItem>

            <ElFormItem label="附加组 ID 列表">
              <div class="array-input-list">
                <div
                  v-for="(gid, index) in formData.supplementalGroups"
                  :key="index"
                  class="array-input-item"
                >
                  <span class="item-index">{{ index + 1 }}</span>
                  <ElInputNumber
                    v-model="formData.supplementalGroups[index]"
                    :min="0"
                    :max="65535"
                    placeholder="组 ID"
                    style="flex: 1"
                    controls-position="right"
                    @change="updateSecurity"
                  />
                  <ElButton type="danger" text circle @click="removeSupplementalGroup(index)">
                    <Trash2 :size="16" />
                  </ElButton>
                </div>
                <ElButton
                  type="primary"
                  plain
                  size="small"
                  @click="addSupplementalGroup"
                  style="width: 100%"
                >
                  <Plus :size="14" style="margin-right: 4px" />
                  添加附加组 ID
                </ElButton>
              </div>
              <div class="field-hint">容器进程的附加组列表</div>
            </ElFormItem>
          </ElForm>
        </div>
      </ElTabPane>

      <!-- Linux Capabilities -->
      <ElTabPane label="Linux Capabilities" name="capabilities">
        <div class="tab-content">
          <ElForm :model="formData" label-width="180px" label-position="left">
            <ElFormItem label="添加 Capabilities">
              <ElSelect
                v-model="formData.capabilitiesAdd"
                multiple
                filterable
                placeholder="选择要添加的 Capabilities"
                style="width: 100%"
                @change="updateSecurity"
                :max-collapse-tags="3"
                collapse-tags
                collapse-tags-tooltip
              >
                <ElOption
                  v-for="c in availableCapabilities"
                  :key="c.value"
                  :label="c.value"
                  :value="c.value"
                >
                  <div class="capability-option">
                    <span class="cap-name">{{ c.value }}</span>
                    <span class="cap-desc">{{ c.description }}</span>
                  </div>
                </ElOption>
              </ElSelect>
              <div class="field-hint">授予容器的额外 Linux 能力</div>
            </ElFormItem>

            <ElFormItem label="移除 Capabilities">
              <ElSelect
                v-model="formData.capabilitiesDrop"
                multiple
                filterable
                placeholder="选择要移除的 Capabilities（建议选择 ALL）"
                style="width: 100%"
                @change="updateSecurity"
                :max-collapse-tags="3"
                collapse-tags
                collapse-tags-tooltip
              >
                <ElOption
                  v-for="c in availableCapabilities"
                  :key="c.value"
                  :label="c.value"
                  :value="c.value"
                >
                  <div class="capability-option">
                    <span class="cap-name">{{ c.value }}</span>
                    <span class="cap-desc">{{ c.description }}</span>
                  </div>
                </ElOption>
              </ElSelect>
              <div class="field-hint">从容器移除的 Linux 能力（建议移除 ALL）</div>
            </ElFormItem>

            <!-- Capabilities 说明卡片 -->
            <ElAlert type="warning" :closable="false" style="margin-top: 16px">
              <template #title>常用 Capabilities 说明</template>
              <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 12px; line-height: 1.8">
                <li><strong>ALL</strong>: 所有能力（添加时需谨慎，移除时推荐）</li>
                <li><strong>NET_BIND_SERVICE</strong>: 允许绑定小于 1024 的端口</li>
                <li><strong>SYS_ADMIN</strong>: 执行系统管理操作（高风险）</li>
                <li><strong>CHOWN</strong>: 改变文件所有者</li>
                <li><strong>SETUID/SETGID</strong>: 允许改变进程的用户/组 ID</li>
              </ul>
            </ElAlert>
          </ElForm>
        </div>
      </ElTabPane>

      <!-- SELinux 选项 -->
      <ElTabPane label="SELinux 选项" name="selinux">
        <div class="tab-content">
          <ElForm :model="formData" label-width="180px" label-position="left">
            <ElRow :gutter="20">
              <ElCol :span="12">
                <ElFormItem label="SELinux Level">
                  <ElInput
                    v-model="formData.seLinuxLevel"
                    placeholder="例如: s0:c123,c456"
                    @input="updateSecurity"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="SELinux Role">
                  <ElInput
                    v-model="formData.seLinuxRole"
                    placeholder="例如: sysadm_r"
                    @input="updateSecurity"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElRow :gutter="20">
              <ElCol :span="12">
                <ElFormItem label="SELinux Type">
                  <ElInput
                    v-model="formData.seLinuxType"
                    placeholder="例如: container_t"
                    @input="updateSecurity"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="SELinux User">
                  <ElInput
                    v-model="formData.seLinuxUser"
                    placeholder="例如: system_u"
                    @input="updateSecurity"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElAlert type="info" :closable="false" style="margin-top: 16px">
              <template #title>SELinux 说明</template>
              <p style="margin: 4px 0 0; font-size: 12px; line-height: 1.6">
                SELinux (Security-Enhanced Linux) 提供强制访问控制。仅在启用 SELinux 的系统上有效。
                如果不确定如何配置，建议保持为空使用系统默认值。
              </p>
            </ElAlert>
          </ElForm>
        </div>
      </ElTabPane>

      <!-- 高级选项 -->
      <ElTabPane label="高级选项" name="advanced">
        <div class="tab-content">
          <ElForm :model="formData" label-width="180px" label-position="left">
            <ElFormItem label="Proc Mount 类型">
              <ElSelect
                v-model="formData.procMount"
                placeholder="选择 Proc Mount 类型"
                clearable
                style="width: 100%"
                @change="updateSecurity"
              >
                <ElOption label="Default - 默认挂载方式" value="Default" />
                <ElOption label="Unmasked - 不屏蔽敏感路径" value="Unmasked" />
              </ElSelect>
              <div class="field-hint">定义如何挂载 /proc 文件系统</div>
            </ElFormItem>

            <ElFormItem label="Seccomp Profile 类型">
              <ElSelect
                v-model="formData.seccompProfileType"
                placeholder="选择 Seccomp Profile"
                style="width: 100%"
                @change="updateSecurity"
              >
                <ElOption
                  label="RuntimeDefault - 使用运行时默认配置（推荐）"
                  value="RuntimeDefault"
                />
                <ElOption label="Localhost - 使用本地配置文件" value="Localhost" />
                <ElOption label="Unconfined - 不限制系统调用" value="Unconfined" />
              </ElSelect>
              <div class="field-hint">Seccomp 用于限制容器可以使用的系统调用</div>
            </ElFormItem>

            <ElFormItem
              v-if="formData.seccompProfileType === 'Localhost'"
              label="Seccomp Profile 路径"
            >
              <ElInput
                v-model="formData.seccompLocalhostProfile"
                placeholder="例如: profiles/audit.json"
                @input="updateSecurity"
              />
              <div class="field-hint">相对于 kubelet 的 seccomp 配置目录的路径</div>
            </ElFormItem>

            <ElAlert type="info" :closable="false" style="margin-top: 16px">
              <template #title>高级选项说明</template>
              <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 12px; line-height: 1.8">
                <li>
                  <strong>Proc Mount</strong>: 控制 /proc 文件系统的挂载方式，Default 会屏蔽敏感路径
                </li>
                <li>
                  <strong>Seccomp</strong>: 限制容器可以使用的系统调用，RuntimeDefault
                  使用运行时默认配置
                </li>
                <li>建议使用默认配置，除非有特殊需求</li>
              </ul>
            </ElAlert>
          </ElForm>
        </div>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContainersStore } from '@/store/workload'
import { Shield, Zap, RotateCw, Trash2, Plus } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const containersStore = useContainersStore()

// 获取当前容器
const container = computed(() => containersStore.selectedContainer)

// 当前激活的标签页
const activeTab = ref('basic')

// 可用的 Capabilities 列表
const availableCapabilities = [
  { value: 'ALL', label: 'ALL', description: '所有能力' },
  { value: 'CHOWN', label: 'CHOWN', description: '改变文件所有者' },
  { value: 'DAC_OVERRIDE', label: 'DAC_OVERRIDE', description: '忽略文件 DAC 访问限制' },
  { value: 'FOWNER', label: 'FOWNER', description: '忽略文件属主 ID 的限制' },
  { value: 'FSETID', label: 'FSETID', description: '允许设置文件 setuid 位' },
  { value: 'KILL', label: 'KILL', description: '允许对不属于自己的进程发送信号' },
  { value: 'SETGID', label: 'SETGID', description: '允许改变进程的组 ID' },
  { value: 'SETUID', label: 'SETUID', description: '允许改变进程的用户 ID' },
  { value: 'SETPCAP', label: 'SETPCAP', description: '修改进程的 capabilities' },
  { value: 'NET_BIND_SERVICE', label: 'NET_BIND_SERVICE', description: '绑定小于 1024 的端口' },
  { value: 'NET_RAW', label: 'NET_RAW', description: '使用 RAW 和 PACKET socket' },
  { value: 'SYS_CHROOT', label: 'SYS_CHROOT', description: '允许使用 chroot()' },
  { value: 'MKNOD', label: 'MKNOD', description: '允许使用 mknod()' },
  { value: 'AUDIT_WRITE', label: 'AUDIT_WRITE', description: '写入审计日志' },
  { value: 'SETFCAP', label: 'SETFCAP', description: '设置文件 capabilities' },
  { value: 'NET_ADMIN', label: 'NET_ADMIN', description: '执行网络管理任务' },
  { value: 'SYS_ADMIN', label: 'SYS_ADMIN', description: '执行系统管理操作' },
  { value: 'SYS_PTRACE', label: 'SYS_PTRACE', description: '跟踪任意进程' },
  { value: 'SYS_TIME', label: 'SYS_TIME', description: '修改系统时钟' }
]

// 表单数据 - 使用 K8s 默认值
const formData = ref({
  // 基本安全设置 - K8s 默认值
  privileged: false,
  allowPrivilegeEscalation: true,
  runAsNonRoot: false,
  readOnlyRootFilesystem: false,

  // 用户与组
  runAsUser: undefined as number | undefined,
  runAsGroup: undefined as number | undefined,
  fsGroup: undefined as number | undefined,
  supplementalGroups: [] as number[],

  // Capabilities
  capabilitiesAdd: [] as string[],
  capabilitiesDrop: [] as string[],

  // SELinux
  seLinuxLevel: '',
  seLinuxRole: '',
  seLinuxType: '',
  seLinuxUser: '',

  // 高级选项
  procMount: 'Default',
  seccompProfileType: 'RuntimeDefault',
  seccompLocalhostProfile: ''
})

// 从容器加载配置
watch(
  () => container.value,
  (newContainer) => {
    if (newContainer && newContainer.securityContext) {
      const sc = newContainer.securityContext

      // 基本设置
      formData.value.privileged = sc.privileged || false
      formData.value.allowPrivilegeEscalation = sc.allowPrivilegeEscalation !== false
      formData.value.runAsNonRoot = sc.runAsNonRoot || false
      formData.value.readOnlyRootFilesystem = sc.readOnlyRootFilesystem || false

      // 用户与组
      formData.value.runAsUser = sc.runAsUser
      formData.value.runAsGroup = sc.runAsGroup
      formData.value.fsGroup = sc.fsGroup
      formData.value.supplementalGroups = sc.supplementalGroups || []

      // Capabilities
      formData.value.capabilitiesAdd = sc.capabilities?.add || []
      formData.value.capabilitiesDrop = sc.capabilities?.drop || []

      // SELinux
      formData.value.seLinuxLevel = sc.seLinuxOptions?.level || ''
      formData.value.seLinuxRole = sc.seLinuxOptions?.role || ''
      formData.value.seLinuxType = sc.seLinuxOptions?.type || ''
      formData.value.seLinuxUser = sc.seLinuxOptions?.user || ''

      // 高级选项
      formData.value.procMount = sc.procMount || 'Default'
      formData.value.seccompProfileType = sc.seccompProfile?.type || 'RuntimeDefault'
      formData.value.seccompLocalhostProfile = sc.seccompProfile?.localhostProfile || ''
    } else {
      resetToDefaults()
    }
  },
  { immediate: true }
)

// 重置为 K8s 默认值
function resetToDefaults() {
  formData.value = {
    privileged: false,
    allowPrivilegeEscalation: true,
    runAsNonRoot: false,
    readOnlyRootFilesystem: false,
    runAsUser: undefined,
    runAsGroup: undefined,
    fsGroup: undefined,
    supplementalGroups: [],
    capabilitiesAdd: [],
    capabilitiesDrop: [],
    seLinuxLevel: '',
    seLinuxRole: '',
    seLinuxType: '',
    seLinuxUser: '',
    procMount: 'Default',
    seccompProfileType: 'RuntimeDefault',
    seccompLocalhostProfile: ''
  }
}

// 更新安全上下文
function updateSecurity() {
  if (!container.value) return

  const securityContext: any = {}

  // 基本设置
  if (formData.value.privileged) {
    securityContext.privileged = true
  }
  if (!formData.value.allowPrivilegeEscalation) {
    securityContext.allowPrivilegeEscalation = false
  }
  if (formData.value.runAsNonRoot) {
    securityContext.runAsNonRoot = true
  }
  if (formData.value.readOnlyRootFilesystem) {
    securityContext.readOnlyRootFilesystem = true
  }

  // 用户与组
  if (formData.value.runAsUser !== undefined) {
    securityContext.runAsUser = formData.value.runAsUser
  }
  if (formData.value.runAsGroup !== undefined) {
    securityContext.runAsGroup = formData.value.runAsGroup
  }
  if (formData.value.fsGroup !== undefined) {
    securityContext.fsGroup = formData.value.fsGroup
  }
  if (formData.value.supplementalGroups.length > 0) {
    securityContext.supplementalGroups = formData.value.supplementalGroups
  }

  // Capabilities
  if (formData.value.capabilitiesAdd.length > 0 || formData.value.capabilitiesDrop.length > 0) {
    securityContext.capabilities = {}
    if (formData.value.capabilitiesAdd.length > 0) {
      securityContext.capabilities.add = formData.value.capabilitiesAdd
    }
    if (formData.value.capabilitiesDrop.length > 0) {
      securityContext.capabilities.drop = formData.value.capabilitiesDrop
    }
  }

  // SELinux
  if (
    formData.value.seLinuxLevel ||
    formData.value.seLinuxRole ||
    formData.value.seLinuxType ||
    formData.value.seLinuxUser
  ) {
    securityContext.seLinuxOptions = {}
    if (formData.value.seLinuxLevel)
      securityContext.seLinuxOptions.level = formData.value.seLinuxLevel
    if (formData.value.seLinuxRole)
      securityContext.seLinuxOptions.role = formData.value.seLinuxRole
    if (formData.value.seLinuxType)
      securityContext.seLinuxOptions.type = formData.value.seLinuxType
    if (formData.value.seLinuxUser)
      securityContext.seLinuxOptions.user = formData.value.seLinuxUser
  }

  // 高级选项
  if (formData.value.procMount && formData.value.procMount !== 'Default') {
    securityContext.procMount = formData.value.procMount
  }

  if (formData.value.seccompProfileType) {
    securityContext.seccompProfile = {
      type: formData.value.seccompProfileType
    }
    if (
      formData.value.seccompProfileType === 'Localhost' &&
      formData.value.seccompLocalhostProfile
    ) {
      securityContext.seccompProfile.localhostProfile = formData.value.seccompLocalhostProfile
    }
  }

  containersStore.updateContainer(container.value.id, {
    securityContext: Object.keys(securityContext).length > 0 ? securityContext : undefined
  })
}

// 添加附加组
function addSupplementalGroup() {
  formData.value.supplementalGroups.push(0)
}

// 删除附加组
function removeSupplementalGroup(index: number) {
  formData.value.supplementalGroups.splice(index, 1)
  updateSecurity()
}

// 应用安全加固配置
function applySecureTemplate() {
  formData.value.privileged = false
  formData.value.allowPrivilegeEscalation = false
  formData.value.runAsNonRoot = true
  formData.value.readOnlyRootFilesystem = true
  formData.value.runAsUser = 1000
  formData.value.runAsGroup = 1000
  formData.value.capabilitiesAdd = []
  formData.value.capabilitiesDrop = ['ALL']
  formData.value.seccompProfileType = 'RuntimeDefault'
  updateSecurity()
  ElMessage.success('已应用安全加固配置')
}

// 恢复默认配置
function applyDefaultTemplate() {
  resetToDefaults()
  updateSecurity()
  ElMessage.success('已恢复 K8s 默认配置')
}

// 清空配置
function clearSecurity() {
  if (!container.value) return
  containersStore.updateContainer(container.value.id, {
    securityContext: undefined
  })
  resetToDefaults()
  ElMessage.success('已清空安全上下文配置')
}
</script>

<style lang="scss" scoped>
.security-config-tab {
  .quick-actions-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    margin-bottom: 16px;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 8px;

    .actions-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      white-space: nowrap;

      :deep(svg) {
        color: #409eff;
      }
    }

    .actions-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .el-button {
        :deep(svg) {
          margin-right: 4px;
        }
      }
    }
  }

  .security-tabs {
    ::v-deep(.el-tabs__content) {
      padding: 0;
    }

    .tab-content {
      padding: 20px;
      min-height: 400px;
    }
  }

  .switch-with-desc {
    display: flex;
    align-items: center;
    gap: 12px;

    .switch-desc {
      font-size: 13px;
      color: #606266;
    }
  }

  .field-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.5;
  }

  .array-input-list {
    width: 100%;

    .array-input-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .item-index {
        min-width: 28px;
        height: 28px;
        line-height: 28px;
        text-align: center;
        background: #409eff;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
        flex-shrink: 0;
      }
    }
  }

  .capability-option {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .cap-name {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
    }

    .cap-desc {
      font-size: 11px;
      color: #909399;
    }
  }

  ::v-deep(.el-form-item) {
    margin-bottom: 18px;
  }
}
</style>