<template>
  <div class="advanced-step">
    <ElTabs v-model="activeTab" class="advanced-tabs">
      <!-- 安全上下文 -->
      <ElTabPane name="security">
        <template #label>
          <div class="tab-label">
            <Shield :size="14" />
            <span>安全上下文</span>
          </div>
        </template>

        <div class="tab-content">
          <div class="config-section">
            <div class="section-header">
              <h4>
                <User :size="16" />
                用户和组配置
              </h4>
            </div>

            <ElForm label-width="140px">
              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        运行用户ID
                        <ElTooltip
                          content="指定Pod中所有容器进程的用户ID，0表示root用户"
                          placement="top"
                        >
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInputNumber
                      v-model="runAsUser"
                      :min="0"
                      placeholder="留空使用默认"
                      style="width: 100%"
                      :controls="false"
                      @change="updateSecurityContextField('runAsUser', $event)"
                    />
                  </ElFormItem>
                </ElCol>

                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        运行组ID
                        <ElTooltip content="指定Pod中所有容器进程的主组ID" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInputNumber
                      v-model="runAsGroup"
                      :min="0"
                      placeholder="留空使用默认"
                      style="width: 100%"
                      :controls="false"
                      @change="updateSecurityContextField('runAsGroup', $event)"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        强制非Root运行
                        <ElTooltip content="强制所有容器以非root用户运行" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElSwitch
                      v-model="runAsNonRoot"
                      @change="updateSecurityContextField('runAsNonRoot', $event)"
                    />
                  </ElFormItem>
                </ElCol>

                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        FSGroup
                        <ElTooltip content="定义Pod的文件系统组ID" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInputNumber
                      v-model="fsGroup"
                      :min="0"
                      placeholder="留空使用默认"
                      style="width: 100%"
                      :controls="false"
                      @change="updateSecurityContextField('fsGroup', $event)"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    FSGroup变更策略
                    <ElTooltip content="控制卷权限和所有权的变更方式" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="fsGroupChangePolicy"
                  clearable
                  style="width: 100%"
                  @change="updateSecurityContextField('fsGroupChangePolicy', $event)"
                >
                  <ElOption label="OnRootMismatch (默认)" value="OnRootMismatch" />
                  <ElOption label="Always" value="Always" />
                </ElSelect>
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    补充组
                    <ElTooltip content="为Pod中的所有容器添加额外的补充组" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <div class="group-tags">
                  <ElTag
                    v-for="(group, index) in supplementalGroups"
                    :key="index"
                    closable
                    @close="removeSupplementalGroup(index)"
                  >
                    {{ group }}
                  </ElTag>
                  <div class="add-group">
                    <ElInputNumber
                      v-model="newSupplementalGroup"
                      :min="0"
                      placeholder="组ID"
                      size="small"
                      @keyup.enter="addSupplementalGroup"
                      style="width: 120px"
                    />
                    <ElButton size="small" @click="addSupplementalGroup">
                      <Plus :size="14" />
                      添加
                    </ElButton>
                  </div>
                </div>
              </ElFormItem>

              <ElDivider />

              <div class="section-header">
                <h4>
                  <Shield :size="16" />
                  SELinux 配置
                </h4>
              </div>

              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem label="Level">
                    <ElInput
                      v-model="seLinuxLevel"
                      placeholder="如: s0:c123,c456"
                      @change="updateSELinuxOptions"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="Role">
                    <ElInput
                      v-model="seLinuxRole"
                      placeholder="如: sysadm_r"
                      @change="updateSELinuxOptions"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem label="Type">
                    <ElInput
                      v-model="seLinuxType"
                      placeholder="如: container_t"
                      @change="updateSELinuxOptions"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="User">
                    <ElInput
                      v-model="seLinuxUser"
                      placeholder="如: system_u"
                      @change="updateSELinuxOptions"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElDivider />

              <div class="section-header">
                <h4>
                  <Lock :size="16" />
                  Seccomp 配置
                </h4>
              </div>

              <ElFormItem label="Seccomp类型">
                <ElSelect
                  v-model="seccompType"
                  clearable
                  style="width: 100%"
                  @change="updateSeccompProfile"
                >
                  <ElOption label="RuntimeDefault (运行时默认)" value="RuntimeDefault" />
                  <ElOption label="Unconfined (不受限)" value="Unconfined" />
                  <ElOption label="Localhost (本地配置文件)" value="Localhost" />
                </ElSelect>
              </ElFormItem>

              <ElFormItem v-if="seccompType === 'Localhost'" label="配置文件路径">
                <ElInput
                  v-model="seccompLocalhostProfile"
                  placeholder="如: profiles/audit.json"
                  @change="updateSeccompProfile"
                />
              </ElFormItem>
            </ElForm>
          </div>
        </div>
      </ElTabPane>

      <!-- 网络配置 -->
      <ElTabPane name="network">
        <template #label>
          <div class="tab-label">
            <Network :size="14" />
            <span>网络配置</span>
          </div>
        </template>

        <div class="tab-content">
          <!-- 主机模式 -->
          <div class="config-section">
            <div class="section-header">
              <h4>
                <Server :size="16" />
                主机模式配置
              </h4>
            </div>

            <ElForm label-width="180px">
              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    主机网络
                    <ElTooltip content="使用主机的网络命名空间" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <div class="switch-with-tag">
                  <ElSwitch
                    v-model="advancedStore.networkConfig.hostNetwork"
                    @change="updateNetworkConfigField('hostNetwork', $event)"
                  />
                  <ElTag v-if="advancedStore.networkConfig.hostNetwork" type="warning" size="small">
                    <AlertTriangle :size="12" />
                    安全警告
                  </ElTag>
                </div>
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    主机PID
                    <ElTooltip content="使用主机的PID命名空间" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <div class="switch-with-tag">
                  <ElSwitch
                    v-model="advancedStore.networkConfig.hostPID"
                    @change="updateNetworkConfigField('hostPID', $event)"
                  />
                  <ElTag v-if="advancedStore.networkConfig.hostPID" type="warning" size="small">
                    <AlertTriangle :size="12" />
                    安全警告
                  </ElTag>
                </div>
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    主机IPC
                    <ElTooltip content="使用主机的IPC命名空间" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <div class="switch-with-tag">
                  <ElSwitch
                    v-model="advancedStore.networkConfig.hostIPC"
                    @change="updateNetworkConfigField('hostIPC', $event)"
                  />
                  <ElTag v-if="advancedStore.networkConfig.hostIPC" type="warning" size="small">
                    <AlertTriangle :size="12" />
                    安全警告
                  </ElTag>
                </div>
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    共享进程命名空间
                    <ElTooltip content="Pod内的容器共享单个进程命名空间" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSwitch
                  v-model="advancedStore.networkConfig.shareProcessNamespace"
                  @change="updateNetworkConfigField('shareProcessNamespace', $event)"
                />
              </ElFormItem>
            </ElForm>
          </div>

          <ElDivider />

          <!-- 网络标识 -->
          <div class="config-section">
            <div class="section-header">
              <h4>
                <Tag :size="16" />
                网络标识
              </h4>
            </div>

            <ElForm label-width="180px">
              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        主机名
                        <ElTooltip content="Pod的主机名，留空则使用Pod名称" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInput
                      v-model="advancedStore.networkConfig.hostname"
                      placeholder="默认为Pod名称"
                      clearable
                      @change="updateNetworkConfigField('hostname', $event)"
                    />
                  </ElFormItem>
                </ElCol>

                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        子域名
                        <ElTooltip content="Pod的子域名，与hostname组合形成FQDN" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInput
                      v-model="advancedStore.networkConfig.subdomain"
                      placeholder="子域名"
                      clearable
                      @change="updateNetworkConfigField('subdomain', $event)"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    设置FQDN为主机名
                    <ElTooltip content="将完全限定域名(FQDN)设置为Pod的主机名" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSwitch
                  v-model="advancedStore.networkConfig.setHostnameAsFQDN"
                  @change="updateNetworkConfigField('setHostnameAsFQDN', $event)"
                />
              </ElFormItem>
            </ElForm>
          </div>

          <ElDivider />

          <!-- DNS配置 -->
          <div class="config-section">
            <div class="section-header">
              <h4>
                <Globe :size="16" />
                DNS配置
              </h4>
            </div>

            <ElForm label-width="180px">
              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    DNS策略
                    <ElTooltip content="DNS解析策略" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="advancedStore.dnsPolicy"
                  style="width: 100%"
                  @change="handleDNSPolicyChange"
                >
                  <ElOption label="ClusterFirst (默认)" value="ClusterFirst" />
                  <ElOption label="ClusterFirstWithHostNet" value="ClusterFirstWithHostNet" />
                  <ElOption label="Default" value="Default" />
                  <ElOption label="None (自定义DNS)" value="None" />
                </ElSelect>
              </ElFormItem>

              <template v-if="advancedStore.dnsPolicy === 'None'">
                <ElFormItem label="DNS服务器">
                  <div class="dns-list">
                    <ElTag
                      v-for="(server, index) in dnsServers"
                      :key="index"
                      closable
                      @close="removeDnsServer(index)"
                    >
                      {{ server }}
                    </ElTag>
                    <div class="add-dns">
                      <ElInput
                        v-model="newDnsServer"
                        placeholder="8.8.8.8"
                        size="small"
                        style="width: 150px"
                        @keyup.enter="addDnsServer"
                      />
                      <ElButton size="small" @click="addDnsServer">
                        <Plus :size="14" />
                        添加
                      </ElButton>
                    </div>
                  </div>
                </ElFormItem>

                <ElFormItem label="搜索域">
                  <div class="dns-list">
                    <ElTag
                      v-for="(search, index) in dnsSearches"
                      :key="index"
                      closable
                      @close="removeDnsSearch(index)"
                    >
                      {{ search }}
                    </ElTag>
                    <div class="add-dns">
                      <ElInput
                        v-model="newDnsSearch"
                        placeholder="example.local"
                        size="small"
                        style="width: 150px"
                        @keyup.enter="addDnsSearch"
                      />
                      <ElButton size="small" @click="addDnsSearch">
                        <Plus :size="14" />
                        添加
                      </ElButton>
                    </div>
                  </div>
                </ElFormItem>

                <ElFormItem label="DNS选项">
                  <div class="dns-options-list">
                    <div v-for="(option, index) in dnsOptions" :key="index" class="dns-option-row">
                      <ElInput
                        v-model="option.name"
                        placeholder="选项名"
                        style="width: 150px"
                        @change="updateDNSConfig"
                      />
                      <ElInput
                        v-model="option.value"
                        placeholder="选项值（可选）"
                        style="width: 150px"
                        @change="updateDNSConfig"
                      />
                      <ElButton
                        type="danger"
                        :icon="Trash2"
                        circle
                        size="small"
                        @click="removeDnsOption(index)"
                      />
                    </div>
                    <ElButton size="small" @click="addDnsOption">
                      <Plus :size="14" />
                      添加选项
                    </ElButton>
                  </div>
                </ElFormItem>
              </template>
            </ElForm>
          </div>

          <ElDivider />

          <!-- 主机别名 -->
          <div class="config-section">
            <div class="section-header">
              <h4>
                <Link :size="16" />
                主机别名
              </h4>
              <ElButton size="small" @click="addHostAliasItem">
                <Plus :size="14" />
                添加别名
              </ElButton>
            </div>

            <div v-if="hostAliases.length === 0" class="empty-state">
              <ElEmpty description="暂无主机别名" :image-size="60" />
            </div>

            <div v-else class="alias-list">
              <div v-for="(alias, index) in hostAliases" :key="index" class="alias-item">
                <ElInput
                  v-model="alias.ip"
                  placeholder="IP地址"
                  style="width: 150px"
                  @change="updateHostAlias(index)"
                />
                <ElInput
                  v-model="alias.hostnamesStr"
                  placeholder="主机名(逗号分隔)"
                  style="flex: 1"
                  @change="updateHostAlias(index)"
                />
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeHostAliasItem(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </ElTabPane>

      <!-- 服务账户 -->
      <ElTabPane name="serviceAccount">
        <template #label>
          <div class="tab-label">
            <Key :size="14" />
            <span>服务账户</span>
          </div>
        </template>

        <div class="tab-content">
          <div class="config-section">
            <ElForm label-width="180px">
              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    服务账户名称
                    <ElTooltip content="用于运行Pod的ServiceAccount" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="serviceAccountName"
                  filterable
                  clearable
                  allow-create
                  placeholder="请选择或输入服务账户"
                  style="width: 100%"
                  :loading="loadingSAList"
                  @focus="handleSASelectFocus"
                  @change="updateServiceAccount"
                >
                  <ElOption
                    v-for="sa in serviceAccountList"
                    :key="sa.name"
                    :label="sa.name"
                    :value="sa.name"
                  >
                    <span>{{ sa.name }}</span>
                    <ElTag v-if="sa.secrets > 0" size="small" type="info" style="margin-left: 8px">
                      {{ sa.secrets }} secrets
                    </ElTag>
                  </ElOption>
                  <template #empty>
                    <div style="padding: 10px; text-align: center; color: #909399">
                      {{ loadingSAList ? '加载中...' : '暂无服务账户' }}
                    </div>
                  </template>
                </ElSelect>
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    自动挂载SA令牌
                    <ElTooltip content="是否自动挂载ServiceAccount的API令牌" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSwitch v-model="automountServiceAccountToken" @change="updateServiceAccount" />
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    镜像拉取密钥
                    <ElTooltip
                      content="用于拉取私有镜像的Secret（仅显示镜像凭证类型）"
                      placement="top"
                    >
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="imagePullSecretNames"
                  multiple
                  filterable
                  clearable
                  placeholder="请选择镜像拉取密钥"
                  style="width: 100%"
                  :loading="loadingSecretList"
                  @focus="handleSecretSelectFocus"
                  @change="handleImagePullSecretChange"
                >
                  <ElOption
                    v-for="secret in dockerSecretList"
                    :key="secret.name"
                    :label="secret.name"
                    :value="secret.name"
                  >
                    <span>{{ secret.name }}</span>
                    <ElTag size="small" type="warning" style="margin-left: 8px">
                      {{ formatSecretType(secret.type) }}
                    </ElTag>
                  </ElOption>
                  <template #empty>
                    <div style="padding: 10px; text-align: center; color: #909399">
                      {{ loadingSecretList ? '加载中...' : '暂无镜像拉取密钥' }}
                    </div>
                  </template>
                </ElSelect>
              </ElFormItem>
            </ElForm>
          </div>
        </div>
      </ElTabPane>

      <!-- 生命周期 -->
      <ElTabPane name="lifecycle">
        <template #label>
          <div class="tab-label">
            <Clock :size="14" />
            <span>生命周期</span>
          </div>
        </template>

        <div class="tab-content">
          <div class="config-section">
            <ElForm label-width="180px">
              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        终止宽限期(秒)
                        <ElTooltip content="Pod终止前的宽限期" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInputNumber
                      v-model="advancedStore.terminationGracePeriodSeconds"
                      :min="0"
                      :max="3600"
                      style="width: 100%"
                      @change="emitValidation"
                    />
                  </ElFormItem>
                </ElCol>

                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        活动截止时间(秒)
                        <ElTooltip content="Pod的最大存活时间" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInputNumber
                      v-model="advancedStore.activeDeadlineSeconds"
                      :min="0"
                      placeholder="留空表示无限制"
                      style="width: 100%"
                      @change="emitValidation"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    重启策略
                    <ElTooltip content="容器退出后的重启策略" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="advancedStore.restartPolicy"
                  style="width: 100%"
                  @change="handleRestartPolicyChange"
                >
                  <ElOption label="Always (默认)" value="Always" />
                  <ElOption label="OnFailure" value="OnFailure" />
                  <ElOption label="Never" value="Never" />
                </ElSelect>
              </ElFormItem>
            </ElForm>
          </div>
        </div>
      </ElTabPane>

      <!-- 优先级 -->
      <ElTabPane name="priority">
        <template #label>
          <div class="tab-label">
            <TrendingUp :size="14" />
            <span>优先级</span>
          </div>
        </template>

        <div class="tab-content">
          <div class="config-section">
            <ElForm label-width="160px">
              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    优先级类
                    <ElTooltip content="预定义的优先级类" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="advancedStore.priorityClassName"
                  clearable
                  style="width: 100%"
                  @change="emitValidation"
                >
                  <ElOption label="system-cluster-critical" value="system-cluster-critical" />
                  <ElOption label="system-node-critical" value="system-node-critical" />
                </ElSelect>
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    优先级值
                    <ElTooltip content="自定义优先级数值，值越大优先级越高" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElInputNumber
                  v-model="advancedStore.priority"
                  :min="-2147483648"
                  :max="1000000000"
                  placeholder="留空使用默认"
                  style="width: 100%"
                  @change="emitValidation"
                />
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    抢占策略
                    <ElTooltip content="当资源不足时是否允许抢占低优先级Pod" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="advancedStore.preemptionPolicy"
                  clearable
                  style="width: 100%"
                  @change="emitValidation"
                >
                  <ElOption label="PreemptLowerPriority (默认)" value="PreemptLowerPriority" />
                  <ElOption label="Never (不抢占)" value="Never" />
                </ElSelect>
              </ElFormItem>
            </ElForm>
          </div>
        </div>
      </ElTabPane>

      <!-- 就绪门控 -->
      <ElTabPane name="readinessGates">
        <template #label>
          <div class="tab-label">
            <CheckCircle2 :size="14" />
            <span>就绪门控</span>
            <ElBadge
              v-if="readinessGates.length > 0"
              :value="readinessGates.length"
              type="primary"
            />
          </div>
        </template>

        <div class="tab-content">
          <div class="config-section">
            <div class="section-header">
              <h4>
                <CheckCircle2 :size="16" />
                就绪门控配置
              </h4>
              <ElButton type="primary" size="small" @click="addReadinessGateItem">
                <Plus :size="14" />
                添加门控
              </ElButton>
            </div>

            <ElAlert type="info" :closable="false" style="margin-bottom: 16px">
              就绪门控提供额外的Pod就绪条件，Pod必须同时满足容器就绪和所有就绪门控条件才被视为就绪
            </ElAlert>

            <div v-if="readinessGates.length === 0" class="empty-state">
              <ElEmpty description="暂无就绪门控" :image-size="60" />
            </div>

            <div v-else class="gates-list">
              <div v-for="(gate, index) in readinessGates" :key="index" class="gate-item">
                <ElInput
                  v-model="gate.conditionType"
                  placeholder="条件类型，如: www.example.com/feature-1"
                  style="flex: 1"
                  @change="updateReadinessGate(index)"
                >
                  <template #prefix>
                    <Tag :size="14" />
                  </template>
                </ElInput>
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeReadinessGateItem(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </ElTabPane>

      <!-- 资源开销 -->
      <ElTabPane name="overhead">
        <template #label>
          <div class="tab-label">
            <Activity :size="14" />
            <span>资源开销</span>
          </div>
        </template>

        <div class="tab-content">
          <div class="config-section">
            <div class="section-header">
              <h4>
                <Activity :size="16" />
                Pod资源开销
              </h4>
            </div>

            <ElAlert type="info" :closable="false" style="margin-bottom: 16px">
              Pod Overhead
              用于声明运行Pod所需的额外资源开销（如虚拟机或沙箱），通常由RuntimeClass自动设置
            </ElAlert>

            <ElForm label-width="120px">
              <ElRow :gutter="20">
                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        CPU开销
                        <ElTooltip content="运行Pod额外需要的CPU资源" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInput
                      v-model="overheadCpu"
                      placeholder="例如: 250m"
                      clearable
                      @change="updateOverhead"
                    >
                      <template #append>毫核</template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>

                <ElCol :span="12">
                  <ElFormItem>
                    <template #label>
                      <span class="label-with-tip">
                        内存开销
                        <ElTooltip content="运行Pod额外需要的内存资源" placement="top">
                          <Info :size="12" class="tip-icon" />
                        </ElTooltip>
                      </span>
                    </template>
                    <ElInput
                      v-model="overheadMemory"
                      placeholder="例如: 120Mi"
                      clearable
                      @change="updateOverhead"
                    >
                      <template #append>MiB</template>
                    </ElInput>
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </div>
        </div>
      </ElTabPane>

      <!-- 其他配置 -->
      <ElTabPane name="other">
        <template #label>
          <div class="tab-label">
            <Settings :size="14" />
            <span>其他配置</span>
          </div>
        </template>

        <div class="tab-content">
          <div class="config-section">
            <ElForm label-width="160px">
              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    启用服务链接
                    <ElTooltip content="是否将服务信息注入为环境变量" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSwitch v-model="advancedStore.enableServiceLinks" @change="emitValidation" />
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    运行时类
                    <ElTooltip content="指定容器运行时" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElInput
                  v-model="advancedStore.runtimeClassName"
                  placeholder="例如: nvidia, kata"
                  clearable
                  @change="emitValidation"
                />
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    调度器名称
                    <ElTooltip content="使用的Kubernetes调度器" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElInput
                  v-model="advancedStore.schedulerName"
                  placeholder="default-scheduler"
                  clearable
                  @change="emitValidation"
                />
              </ElFormItem>

              <ElFormItem>
                <template #label>
                  <span class="label-with-tip">
                    操作系统
                    <ElTooltip content="Pod运行的操作系统类型 (K8s 1.25+)" placement="top">
                      <Info :size="12" class="tip-icon" />
                    </ElTooltip>
                  </span>
                </template>
                <ElSelect
                  v-model="advancedStore.osName"
                  clearable
                  placeholder="选择操作系统"
                  @change="emitValidation"
                >
                  <ElOption label="Linux" value="linux" />
                  <ElOption label="Windows" value="windows" />
                </ElSelect>
              </ElFormItem>
            </ElForm>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>

    <!-- 配置说明 -->
    <ElAlert type="info" :closable="false" show-icon style="margin-top: 20px">
      <template #title>
        <Info :size="16" />
        配置说明
      </template>
      <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 13px; line-height: 20px">
        <li>所有配置项均为可选，未配置时使用 Kubernetes 默认值</li>
        <li>安全上下文配置会影响Pod中所有容器的安全行为</li>
        <li>网络配置中的主机模式选项存在安全风险，请谨慎使用</li>
        <li>DNS策略选择"None"时需要手动配置DNS服务器</li>
        <li>生命周期配置影响Pod的重启和终止行为</li>
        <li>就绪门控用于自定义Pod就绪条件，需要外部控制器支持</li>
        <li>资源开销通常由RuntimeClass自动设置，手动配置需谨慎</li>
      </ul>
    </ElAlert>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount, inject, type Ref } from 'vue'
  import { useAdvancedStore } from '@/store/workload'
  import type { V1PodReadinessGate } from '@kubernetes/client-node'
  import {
    Shield,
    User,
    Info,
    Plus,
    Trash2,
    Lock,
    Network,
    Server,
    AlertTriangle,
    Tag,
    Globe,
    Link,
    Key,
    Clock,
    TrendingUp,
    CheckCircle2,
    Activity,
    Settings
  } from 'lucide-vue-next'
  import { ElMessage } from 'element-plus'
  import {
    getServiceAccountListApi,
    getSecretListApi,
    type ServiceAccountListItem,
    type SecretListItem
  } from '@/api'

  // Props
  interface Props {
    mode?: string
  }

  const props = defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    validate: [result: { valid: boolean; errors: string[]; warnings?: string[] }]
  }>()

  // Store
  const advancedStore = useAdvancedStore()

  // ✅ 使用 inject 获取参数
  const workspaceIdRef = inject<Ref<number>>('workspaceId')
  const clusterUuidRef = inject<Ref<string>>('clusterUuid')
  const namespaceRef = inject<Ref<string>>('namespace')

  // ✅ 使用 computed 安全地获取值
  const workspaceId = computed(() => workspaceIdRef?.value ?? 0)
  const clusterUuid = computed(() => clusterUuidRef?.value ?? '')
  const namespace = computed(() => namespaceRef?.value ?? 'default')

  // UI 状态
  const activeTab = ref('security')

  // ==================== 服务账户和Secret列表 ====================
  const serviceAccountList = ref<ServiceAccountListItem[]>([])
  const secretList = ref<SecretListItem[]>([])
  const loadingSAList = ref(false)
  const loadingSecretList = ref(false)
  const saListLoaded = ref(false)
  const secretListLoaded = ref(false)

  // AbortController
  let saAbortController: AbortController | null = null
  let secretAbortController: AbortController | null = null

  // ✅ 过滤出镜像拉取专用的Secret（dockerconfigjson 和 dockercfg 类型）
  const dockerSecretList = computed(() =>
    secretList.value.filter(
      (s) => s.type === 'kubernetes.io/dockerconfigjson' || s.type === 'kubernetes.io/dockercfg'
    )
  )

  // 格式化Secret类型显示
  function formatSecretType(type: string): string {
    if (type === 'kubernetes.io/dockerconfigjson') return 'dockerconfigjson'
    if (type === 'kubernetes.io/dockercfg') return 'dockercfg'
    return type
  }

  // ✅ 加载 ServiceAccount 列表
  const loadServiceAccountList = async () => {
    if (!clusterUuid.value || !namespace.value) {
      console.warn('[AdvancedStep] clusterUuid 或 namespace 无效，跳过加载 SA 列表')
      return
    }

    if (saListLoaded.value) return

    if (saAbortController) {
      saAbortController.abort()
    }

    saAbortController = new AbortController()
    const signal = saAbortController.signal

    loadingSAList.value = true

    try {
      const response = await getServiceAccountListApi({
        clusterUuid: clusterUuid.value,
        namespace: namespace.value
      })

      if (signal.aborted) return

      serviceAccountList.value = response.items || []
      saListLoaded.value = true
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') return
      console.error('[AdvancedStep] 加载 ServiceAccount 列表失败:', error)
      ElMessage.error('加载服务账户列表失败')
    } finally {
      loadingSAList.value = false
      saAbortController = null
    }
  }

  // ✅ 加载 Secret 列表
  const loadSecretList = async () => {
    if (!workspaceId.value || workspaceId.value === 0) {
      console.warn('[AdvancedStep] workspaceId 无效，跳过加载 Secret 列表')
      return
    }

    if (secretListLoaded.value) return

    if (secretAbortController) {
      secretAbortController.abort()
    }

    secretAbortController = new AbortController()
    const signal = secretAbortController.signal

    loadingSecretList.value = true

    try {
      const response = await getSecretListApi({
        workloadId: workspaceId.value
      })

      if (signal.aborted) return

      secretList.value = response.items || []
      secretListLoaded.value = true
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') return
      console.error('[AdvancedStep] 加载 Secret 列表失败:', error)
      ElMessage.error('加载Secret列表失败')
    } finally {
      loadingSecretList.value = false
      secretAbortController = null
    }
  }

  // ✅ 下拉框获取焦点时加载
  const handleSASelectFocus = async () => {
    if (!saListLoaded.value) {
      await loadServiceAccountList()
    }
  }

  const handleSecretSelectFocus = async () => {
    if (!secretListLoaded.value) {
      await loadSecretList()
    }
  }

  // ✅ 监听参数变化，重置加载状态
  watch([workspaceId, clusterUuid, namespace], () => {
    saListLoaded.value = false
    secretListLoaded.value = false
    serviceAccountList.value = []
    secretList.value = []
  })

  // ==================== 安全上下文 ====================
  const runAsUser = ref<number | undefined>(advancedStore.securityContext.runAsUser)
  const runAsGroup = ref<number | undefined>(advancedStore.securityContext.runAsGroup)
  const runAsNonRoot = ref<boolean | undefined>(advancedStore.securityContext.runAsNonRoot)
  const fsGroup = ref<number | undefined>(advancedStore.securityContext.fsGroup)
  const fsGroupChangePolicy = ref<string | undefined>(
    advancedStore.securityContext.fsGroupChangePolicy
  )
  const supplementalGroups = ref<number[]>(advancedStore.securityContext.supplementalGroups || [])
  const newSupplementalGroup = ref<number>()

  // SELinux
  const seLinuxLevel = ref<string>('')
  const seLinuxRole = ref<string>('')
  const seLinuxType = ref<string>('')
  const seLinuxUser = ref<string>('')

  // Seccomp
  const seccompType = ref<string>('')
  const seccompLocalhostProfile = ref<string>('')

  // ==================== 服务账户 ====================
  const serviceAccountName = ref(advancedStore.serviceAccountName || '')
  const automountServiceAccountToken = ref<boolean | undefined>(
    advancedStore.automountServiceAccountToken
  )
  const imagePullSecretNames = ref<string[]>([])

  // ==================== DNS配置 ====================
  const dnsServers = ref<string[]>([])
  const dnsSearches = ref<string[]>([])
  const dnsOptions = ref<Array<{ name: string; value?: string }>>([])
  const newDnsServer = ref('')
  const newDnsSearch = ref('')

  // ==================== 主机别名 ====================
  interface HostAliasWithStr {
    ip: string
    hostnames?: string[]
    hostnamesStr?: string
  }
  const hostAliases = ref<HostAliasWithStr[]>([])

  // ==================== 就绪门控 ====================
  const readinessGates = ref<V1PodReadinessGate[]>([...advancedStore.readinessGates])

  // ==================== 资源开销 ====================
  const overheadCpu = ref(advancedStore.overhead.cpu || '')
  const overheadMemory = ref(advancedStore.overhead.memory || '')

  // ==================== 方法 ====================

  // 更新安全上下文字段
  function updateSecurityContextField(field: string, value: any) {
    advancedStore.updateSecurityContext({ [field]: value })
    emitValidation()
  }

  // 补充组操作
  function addSupplementalGroup() {
    if (newSupplementalGroup.value !== undefined && newSupplementalGroup.value >= 0) {
      supplementalGroups.value.push(newSupplementalGroup.value)
      advancedStore.updateSecurityContext({ supplementalGroups: supplementalGroups.value })
      newSupplementalGroup.value = undefined
      emitValidation()
    }
  }

  function removeSupplementalGroup(index: number) {
    supplementalGroups.value.splice(index, 1)
    advancedStore.updateSecurityContext({ supplementalGroups: supplementalGroups.value })
    emitValidation()
  }

  // SELinux配置
  function updateSELinuxOptions() {
    const seLinuxOptions: any = {}
    if (seLinuxLevel.value) seLinuxOptions.level = seLinuxLevel.value
    if (seLinuxRole.value) seLinuxOptions.role = seLinuxRole.value
    if (seLinuxType.value) seLinuxOptions.type = seLinuxType.value
    if (seLinuxUser.value) seLinuxOptions.user = seLinuxUser.value

    if (Object.keys(seLinuxOptions).length > 0) {
      advancedStore.updateSecurityContext({ seLinuxOptions })
    }
    emitValidation()
  }

  // Seccomp配置
  function updateSeccompProfile() {
    if (!seccompType.value) {
      advancedStore.updateSecurityContext({ seccompProfile: undefined })
    } else {
      const seccompProfile: any = { type: seccompType.value }
      if (seccompType.value === 'Localhost' && seccompLocalhostProfile.value) {
        seccompProfile.localhostProfile = seccompLocalhostProfile.value
      }
      advancedStore.updateSecurityContext({ seccompProfile })
    }
    emitValidation()
  }

  // 更新网络配置字段
  function updateNetworkConfigField(field: string, value: any) {
    advancedStore.updateNetworkConfig({ [field]: value })
    emitValidation()
  }

  // DNS配置
  function handleDNSPolicyChange(value: string) {
    advancedStore.setDNSPolicy(value)
    if (value !== 'None') {
      advancedStore.updateDNSConfig(undefined)
      dnsServers.value = []
      dnsSearches.value = []
      dnsOptions.value = []
    }
    emitValidation()
  }

  function addDnsServer() {
    if (newDnsServer.value && newDnsServer.value.trim()) {
      dnsServers.value.push(newDnsServer.value.trim())
      newDnsServer.value = ''
      updateDNSConfig()
    }
  }

  function removeDnsServer(index: number) {
    dnsServers.value.splice(index, 1)
    updateDNSConfig()
  }

  function addDnsSearch() {
    if (newDnsSearch.value && newDnsSearch.value.trim()) {
      dnsSearches.value.push(newDnsSearch.value.trim())
      newDnsSearch.value = ''
      updateDNSConfig()
    }
  }

  function removeDnsSearch(index: number) {
    dnsSearches.value.splice(index, 1)
    updateDNSConfig()
  }

  function addDnsOption() {
    dnsOptions.value.push({ name: '', value: '' })
    updateDNSConfig()
  }

  function removeDnsOption(index: number) {
    dnsOptions.value.splice(index, 1)
    updateDNSConfig()
  }

  function updateDNSConfig() {
    if (advancedStore.dnsPolicy === 'None') {
      const config: any = {}
      if (dnsServers.value.length > 0) config.nameservers = dnsServers.value
      if (dnsSearches.value.length > 0) config.searches = dnsSearches.value
      if (dnsOptions.value.length > 0) {
        config.options = dnsOptions.value
          .filter((opt) => opt.name)
          .map((opt) => ({
            name: opt.name,
            ...(opt.value && { value: opt.value })
          }))
      }
      advancedStore.updateDNSConfig(Object.keys(config).length > 0 ? config : undefined)
    }
    emitValidation()
  }

  // 主机别名
  function addHostAliasItem() {
    hostAliases.value.push({ ip: '', hostnames: [], hostnamesStr: '' })
  }

  function removeHostAliasItem(index: number) {
    hostAliases.value.splice(index, 1)
    syncHostAliasesToStore()
  }

  function updateHostAlias(index: number) {
    const alias = hostAliases.value[index]
    if (alias.hostnamesStr) {
      alias.hostnames = alias.hostnamesStr
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    }
    syncHostAliasesToStore()
  }

  function syncHostAliasesToStore() {
    const aliases = hostAliases.value
      .filter((a) => a.ip && a.hostnames && a.hostnames.length > 0)
      .map((a) => ({
        ip: a.ip,
        hostnames: a.hostnames
      }))

    advancedStore.setHostAliases(aliases)
    emitValidation()
  }

  // 服务账户
  function updateServiceAccount() {
    advancedStore.setServiceAccount(
      serviceAccountName.value || undefined,
      automountServiceAccountToken.value
    )
    emitValidation()
  }

  // ✅ 镜像拉取密钥变更处理
  function handleImagePullSecretChange(values: string[]) {
    const secrets = values.map((name) => ({ name }))
    advancedStore.updateImagePullSecrets(secrets)
    emitValidation()
  }

  // 生命周期
  function handleRestartPolicyChange(value: string) {
    advancedStore.setRestartPolicy(value)
    emitValidation()
  }

  // 就绪门控
  function addReadinessGateItem() {
    readinessGates.value.push({ conditionType: '' })
  }

  function removeReadinessGateItem(index: number) {
    readinessGates.value.splice(index, 1)
    syncReadinessGatesToStore()
  }

  function updateReadinessGate(index: number) {
    syncReadinessGatesToStore()
  }

  function syncReadinessGatesToStore() {
    const gates = readinessGates.value
      .filter((g) => g.conditionType && g.conditionType.trim())
      .map((g) => ({ conditionType: g.conditionType.trim() }))

    advancedStore.setReadinessGates(gates)
    emitValidation()
  }

  // 资源开销
  function updateOverhead() {
    const overhead: any = {}
    if (overheadCpu.value) overhead.cpu = overheadCpu.value
    if (overheadMemory.value) overhead.memory = overheadMemory.value
    advancedStore.setOverhead(overhead)
    emitValidation()
  }

  // 发送验证结果
  function emitValidation() {
    const validation = advancedStore.validate()
    emit('validate', validation)
  }

  // 初始化数据
  function loadFromStore() {
    // 加载安全上下文
    const sc = advancedStore.securityContext
    runAsUser.value = sc.runAsUser
    runAsGroup.value = sc.runAsGroup
    runAsNonRoot.value = sc.runAsNonRoot
    fsGroup.value = sc.fsGroup
    fsGroupChangePolicy.value = sc.fsGroupChangePolicy
    supplementalGroups.value = sc.supplementalGroups || []

    if (sc.seLinuxOptions) {
      seLinuxLevel.value = sc.seLinuxOptions.level || ''
      seLinuxRole.value = sc.seLinuxOptions.role || ''
      seLinuxType.value = sc.seLinuxOptions.type || ''
      seLinuxUser.value = sc.seLinuxOptions.user || ''
    }

    if (sc.seccompProfile) {
      seccompType.value = sc.seccompProfile.type || ''
      seccompLocalhostProfile.value = sc.seccompProfile.localhostProfile || ''
    }

    // 加载服务账户
    serviceAccountName.value = advancedStore.serviceAccountName || ''
    automountServiceAccountToken.value = advancedStore.automountServiceAccountToken
    imagePullSecretNames.value = advancedStore.imagePullSecrets
      .map((s) => s.name || '')
      .filter(Boolean)

    // 加载DNS配置
    if (advancedStore.dnsConfig) {
      dnsServers.value = advancedStore.dnsConfig.nameservers || []
      dnsSearches.value = advancedStore.dnsConfig.searches || []
      dnsOptions.value =
        advancedStore.dnsConfig.options?.map((opt) => ({
          name: opt.name || '',
          value: opt.value
        })) || []
    }

    // 加载主机别名
    hostAliases.value = advancedStore.hostAliases.map((alias) => ({
      ip: alias.ip || '',
      hostnames: alias.hostnames || [],
      hostnamesStr: (alias.hostnames || []).join(', ')
    }))

    // 加载就绪门控
    readinessGates.value = [...advancedStore.readinessGates]

    // 加载资源开销
    overheadCpu.value = advancedStore.overhead.cpu || ''
    overheadMemory.value = advancedStore.overhead.memory || ''
  }

  // 验证
  async function validate(): Promise<boolean> {
    const validation = advancedStore.validate()
    emitValidation()
    return validation.valid
  }

  // 初始化
  onMounted(() => {
    loadFromStore()
    emitValidation()
  })

  // ✅ 组件卸载时取消所有请求
  onBeforeUnmount(() => {
    if (saAbortController) {
      saAbortController.abort()
    }
    if (secretAbortController) {
      secretAbortController.abort()
    }
  })

  // 导出
  defineExpose({
    validate
  })
</script>

<style lang="scss" scoped>
  .advanced-step {
    .advanced-tabs {
      ::v-deep(.el-tabs__header) {
        background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
        padding: 8px 12px;
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
      }

      ::v-deep(.el-tabs__item) {
        padding: 0 16px;
        height: 36px;
        line-height: 36px;
        border-radius: 6px 6px 0 0;
        transition: all 0.2s;

        &:hover:not(.is-active) {
          background: rgba(64, 158, 255, 0.08);
        }

        &.is-active {
          background: white;
          color: #409eff;
          font-weight: 500;
        }

        .tab-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
      }

      ::v-deep(.el-tabs__active-bar) {
        display: none;
      }
    }

    .tab-content {
      padding: 20px;
      min-height: 400px;
    }

    .config-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 15px;
          color: #303133;
        }
      }
    }

    .label-with-tip {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      .tip-icon {
        color: #909399;
        cursor: help;
        transition: color 0.2s;

        &:hover {
          color: #409eff;
        }
      }
    }

    .switch-with-tag {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .group-tags,
    .dns-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;

      .add-group,
      .add-dns {
        display: flex;
        gap: 8px;
      }
    }

    .dns-options-list {
      .dns-option-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
    }

    .alias-list,
    .gates-list {
      .alias-item,
      .gate-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 8px;
        margin-bottom: 12px;
      }
    }

    .empty-state {
      padding: 40px;
      background: #f5f7fa;
      border-radius: 8px;
    }

    // ✅ 下拉选项样式
    :deep(.el-select-dropdown__item) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      height: 34px;
      line-height: 34px;

      .el-tag {
        flex-shrink: 0;
      }
    }
  }
</style>
