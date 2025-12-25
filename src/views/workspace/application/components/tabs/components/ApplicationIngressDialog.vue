<template>
  <ElDialog
    :model-value="visible"
    :title="dialogType === 'add' ? '创建 Ingress' : '编辑 Ingress'"
    width="900px"
    top="2vh"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
    @closed="handleClosed"
  >
    <!-- 编辑模式切换 -->
    <div class="mode-switch">
      <ElRadioGroup v-model="editMode" size="small">
        <ElRadioButton value="form">
          <div class="radio-content">
            <FormInput :size="13" />
            <span>表单编辑</span>
          </div>
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <div class="radio-content">
            <Code :size="13" />
            <span>YAML 编辑</span>
          </div>
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="dataLoading" style="text-align: center; padding: 30px">
      <ElSkeleton :rows="6" animated />
      <div style="margin-top: 12px; color: #909399; font-size: 13px">正在加载 Ingress 配置...</div>
    </div>

    <!-- 表单模式 -->
    <div v-else-if="editMode === 'form'" class="form-content">
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="120px" size="">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-header">
            <Database :size="14" />
            <span>基础信息</span>
          </div>

          <ElFormItem label="Ingress 名称" prop="name" required>
            <ElInput
              v-model="formData.name"
              placeholder="例如: my-ingress"
              :disabled="dialogType === 'edit'"
              maxlength="63"
              show-word-limit
            >
              <template #suffix>
                <ElTooltip content="小写字母、数字、连字符，以字母或数字开头结尾" placement="top">
                  <HelpCircle :size="13" class="help-icon" />
                </ElTooltip>
              </template>
            </ElInput>
          </ElFormItem>

          <ElFormItem label="Ingress Class" prop="ingressClassName" required>
            <ElSelect
              v-model="formData.ingressClassName"
              placeholder="选择 IngressClass"
              filterable
              style="width: 100%"
              :loading="ingressClassLoading"
              @visible-change="handleIngressClassVisibleChange"
            >
              <ElOption
                v-for="ic in ingressClasses"
                :key="ic.name"
                :label="ic.name"
                :value="ic.name"
              >
                <div class="option-item">
                  <span class="option-name">{{ ic.name }}</span>
                  <ElTag v-if="ic.isDefault" type="success" size="small">默认</ElTag>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>
        </div>

        <!-- 路由规则 -->
        <div class="form-section">
          <div class="section-header">
            <Route :size="14" />
            <span>路由规则</span>
            <ElTooltip placement="top">
              <template #content>
                <div>• 配置 Host 和路径映射</div>
                <div>• 支持精确/前缀/正则匹配</div>
                <div>• URL 重写在"高级配置"中统一设置</div>
              </template>
              <HelpCircle :size="13" class="help-icon" />
            </ElTooltip>
          </div>

          <div class="rules-container">
            <div v-for="(rule, ruleIndex) in formData.rules" :key="ruleIndex" class="rule-card">
              <div class="rule-card-header">
                <span class="rule-title">规则 {{ ruleIndex + 1 }}</span>
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeRule(ruleIndex)"
                />
              </div>

              <div class="rule-card-body">
                <!-- Host 域名 -->
                <div class="form-item">
                  <label class="field-label">
                    <span style="color: #f56c6c">* </span>
                    Host 域名
                    <ElTooltip placement="top">
                      <template #content>
                        <div>• 集群域名：前缀(必填) + 集群域名后缀(必填)</div>
                        <div>• 自定义域名：输入完整域名(必填)</div>
                      </template>
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </label>

                  <!-- 域名模式切换 -->
                  <ElRadioGroup v-model="rule.hostMode" size="small" style="margin-bottom: 8px">
                    <ElRadioButton value="cluster">集群域名</ElRadioButton>
                    <ElRadioButton value="custom">自定义域名</ElRadioButton>
                  </ElRadioGroup>

                  <!-- 集群域名模式 -->
                  <div v-if="rule.hostMode === 'cluster'" class="host-input-group">
                    <ElInput
                      v-model="rule.hostPrefix"
                      placeholder="前缀 (必填)"
                      style="flex: 1"
                      maxlength="200"
                    >
                      <template #prepend> <span style="color: #f56c6c">* </span>前缀 </template>
                    </ElInput>

                    <ElSelect
                      v-model="rule.hostSuffix"
                      placeholder="选择域名后缀 (必填)"
                      filterable
                      style="flex: 1; margin-left: 8px"
                      :loading="domainSuffixLoading"
                      @visible-change="handleDomainSuffixVisibleChange"
                    >
                      <template #prefix>
                        <Globe :size="14" />
                      </template>
                      <ElOption
                        v-for="suffix in domainSuffixes"
                        :key="suffix"
                        :label="suffix"
                        :value="suffix"
                      >
                        <div style="display: flex; align-items: center; gap: 6px">
                          <span>{{ suffix }}</span>
                          <ElTag type="success" size="small">集群域名</ElTag>
                        </div>
                      </ElOption>
                    </ElSelect>
                  </div>

                  <!-- 自定义域名模式 -->
                  <div v-else-if="rule.hostMode === 'custom'">
                    <ElInput
                      v-model="rule.customHost"
                      placeholder="例如: example.com (必填)"
                      maxlength="253"
                    >
                      <template #prepend>
                        <Globe :size="14" />
                      </template>
                    </ElInput>
                  </div>

                  <!-- 域名预览 -->
                  <div v-if="getFullHostDisplay(rule)" class="host-preview">
                    <InfoIcon :size="12" />
                    <span>完整域名: </span>
                    <span class="preview-domain">{{ getFullHostDisplay(rule) }}</span>
                  </div>

                  <!-- 集群模式验证提示 -->
                  <div
                    v-if="rule.hostMode === 'cluster' && (!rule.hostPrefix || !rule.hostSuffix)"
                    class="host-error-hint"
                  >
                    <AlertCircle :size="12" />
                    <span>集群域名模式下，前缀和后缀都必须填写</span>
                  </div>

                  <!-- 自定义域名必填提示 -->
                  <div
                    v-if="rule.hostMode === 'custom' && !rule.customHost"
                    class="host-error-hint"
                  >
                    <AlertCircle :size="12" />
                    <span>自定义域名模式下，必须输入完整域名</span>
                  </div>
                </div>

                <!-- 路径列表 -->
                <div class="paths-section">
                  <div class="paths-header">
                    <span>路径配置</span>
                    <ElButton
                      type="primary"
                      :icon="Plus"
                      size="small"
                      plain
                      @click="addPath(ruleIndex)"
                    >
                      添加路径
                    </ElButton>
                  </div>

                  <div v-for="(path, pathIndex) in rule.paths" :key="pathIndex" class="path-card">
                    <div class="path-card-header">
                      <span>路径 {{ pathIndex + 1 }}</span>
                      <ElButton
                        type="danger"
                        :icon="Trash2"
                        circle
                        size="small"
                        @click="removePath(ruleIndex, pathIndex)"
                      />
                    </div>

                    <div class="path-card-body">
                      <!-- 第一行：路径 + 匹配类型 -->
                      <div class="two-columns">
                        <div class="form-item">
                          <label class="field-label">
                            路径
                            <ElTooltip
                              content="URL 路径。正则: /api/(.*)，前缀: /api，精确: /api/v1"
                              placement="top"
                            >
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <ElInput v-model="path.path" placeholder="/api" />
                        </div>

                        <div class="form-item">
                          <label class="field-label">
                            匹配类型
                            <ElTooltip placement="top">
                              <template #content>
                                <div>• Prefix: 前缀匹配</div>
                                <div>• Exact: 精确匹配</div>
                                <div>• ImplementationSpecific: 正则</div>
                              </template>
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <ElSelect
                            v-model="path.pathType"
                            style="width: 100%"
                            @change="handlePathTypeChange(path.pathType)"
                          >
                            <ElOption label="前缀匹配" value="Prefix" />
                            <ElOption label="精确匹配" value="Exact" />
                            <ElOption label="正则匹配" value="ImplementationSpecific" />
                          </ElSelect>
                        </div>
                      </div>

                      <!-- 第二行：Service + 端口 -->
                      <div class="two-columns">
                        <div class="form-item">
                          <label class="field-label">
                            后端 Service
                            <ElTooltip content="选择后端服务" placement="top">
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <ElSelect
                            v-model="path.serviceName"
                            placeholder="选择 Service"
                            filterable
                            clearable
                            style="width: 100%"
                            :loading="serviceLoading"
                            @visible-change="handleServiceVisibleChange"
                            @change="handleServiceChange(ruleIndex, pathIndex)"
                          >
                            <ElOption
                              v-for="svc in availableServices"
                              :key="svc.name"
                              :label="formatServiceLabel(svc)"
                              :value="svc.name"
                            >
                              <div class="service-option">
                                <span class="service-name">{{ svc.name }}</span>
                                <ElTag
                                  v-if="svc.version && svc.version > 0"
                                  type="success"
                                  size="small"
                                >
                                  {{ svc.versionName }}
                                </ElTag>
                                <ElTag v-else type="info" size="small">全部版本</ElTag>
                              </div>
                            </ElOption>
                          </ElSelect>
                        </div>

                        <div class="form-item">
                          <label class="field-label">
                            目标端口
                            <ElTooltip content="Service 的目标端口" placement="top">
                              <HelpCircle :size="11" class="help-icon" />
                            </ElTooltip>
                          </label>
                          <ElSelect
                            v-model="path.servicePort"
                            placeholder="选择端口"
                            style="width: 100%"
                            :disabled="!path.serviceName"
                            :loading="portLoadingMap[`${ruleIndex}-${pathIndex}`]"
                            @visible-change="
                              (visible) =>
                                handlePortVisibleChange(
                                  visible,
                                  ruleIndex,
                                  pathIndex,
                                  path.serviceName
                                )
                            "
                          >
                            <ElOption
                              v-for="port in portOptionsMap[`${ruleIndex}-${pathIndex}`] || []"
                              :key="port.port"
                              :label="formatPortLabel(port)"
                              :value="port.port"
                            />
                          </ElSelect>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addRule" style="margin-top: 8px">
            添加规则
          </ElButton>
        </div>

        <!-- 默认后端 -->
        <div class="form-section">
          <div class="section-header">
            <Server :size="14" />
            <span>默认后端</span>
            <span class="optional-mark">可选</span>
            <ElTooltip placement="top">
              <template #content>
                <div>当所有路由规则都不匹配时，流量会转发到默认后端</div>
                <div>通常用于处理 404 错误页面</div>
              </template>
              <HelpCircle :size="13" class="help-icon" />
            </ElTooltip>
          </div>

          <div class="default-backend-switch">
            <ElSwitch
              v-model="formData.defaultBackendEnabled"
              size="small"
              active-text="启用默认后端"
            />
          </div>

          <template v-if="formData.defaultBackendEnabled">
            <div class="two-columns">
              <div class="form-item">
                <label class="field-label">
                  Service 名称
                  <ElTooltip content="默认后端服务" placement="top">
                    <HelpCircle :size="11" class="help-icon" />
                  </ElTooltip>
                </label>
                <ElSelect
                  v-model="formData.defaultBackend.serviceName"
                  placeholder="选择 Service"
                  filterable
                  clearable
                  style="width: 100%"
                  :loading="serviceLoading"
                  @visible-change="handleServiceVisibleChange"
                  @change="handleDefaultBackendServiceChange"
                >
                  <ElOption
                    v-for="svc in availableServices"
                    :key="svc.name"
                    :label="formatServiceLabel(svc)"
                    :value="svc.name"
                  >
                    <div class="service-option">
                      <span class="service-name">{{ svc.name }}</span>
                      <ElTag v-if="svc.version && svc.version > 0" type="success" size="small">
                        {{ svc.versionName }}
                      </ElTag>
                      <ElTag v-else type="info" size="small">全部版本</ElTag>
                    </div>
                  </ElOption>
                </ElSelect>
              </div>

              <div class="form-item">
                <label class="field-label">
                  目标端口
                  <ElTooltip content="默认后端端口" placement="top">
                    <HelpCircle :size="11" class="help-icon" />
                  </ElTooltip>
                </label>
                <ElSelect
                  v-model="formData.defaultBackend.servicePort"
                  placeholder="选择端口"
                  style="width: 100%"
                  :disabled="!formData.defaultBackend.serviceName"
                  :loading="defaultBackendPortLoading"
                  @visible-change="
                    (visible) =>
                      handleDefaultBackendPortVisibleChange(
                        visible,
                        formData.defaultBackend.serviceName
                      )
                  "
                >
                  <ElOption
                    v-for="port in defaultBackendPorts"
                    :key="port.port"
                    :label="formatPortLabel(port)"
                    :value="port.port"
                  />
                </ElSelect>
              </div>
            </div>
          </template>
        </div>

        <!-- TLS 证书 -->
        <div class="form-section">
          <div class="section-header">
            <Lock :size="14" />
            <span>TLS 证书配置</span>
            <span class="optional-mark">可选</span>
          </div>

          <div v-if="formData.tls.length > 0" class="tls-list">
            <div v-for="(tls, tlsIndex) in formData.tls" :key="tlsIndex" class="tls-item">
              <div class="tls-item-header">
                <span>证书 {{ tlsIndex + 1 }}</span>
                <ElButton
                  type="danger"
                  :icon="Trash2"
                  circle
                  size="small"
                  @click="removeTLS(tlsIndex)"
                />
              </div>

              <div class="tls-item-body">
                <div class="form-item">
                  <label class="field-label">Secret 名称</label>
                  <ElSelect
                    v-model="tls.secretName"
                    placeholder="选择 TLS Secret"
                    filterable
                    clearable
                    style="width: 100%"
                    :loading="secretLoading"
                    @visible-change="handleSecretVisibleChange"
                  >
                    <ElOption
                      v-for="secret in availableSecrets"
                      :key="secret.name"
                      :label="secret.name"
                      :value="secret.name"
                    >
                      <div class="option-item">
                        <span class="option-name">{{ secret.name }}</span>
                        <ElTag type="success" size="small">TLS</ElTag>
                      </div>
                    </ElOption>
                  </ElSelect>
                </div>

                <div class="form-item">
                  <label class="field-label">
                    适用域名
                    <ElTooltip content="多个域名用逗号分隔" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </label>
                  <ElInput
                    v-model="tls.hostsInput"
                    placeholder="example.com,www.example.com"
                    @blur="parseTLSHosts(tlsIndex)"
                  />
                </div>
              </div>
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addTLS"> 添加 TLS 证书 </ElButton>
        </div>

        <!-- 高级配置 -->
        <div class="form-section">
          <div class="section-header">
            <Settings :size="14" />
            <span>高级配置 (Annotations)</span>
            <span class="optional-mark">可选</span>
          </div>

          <ElTabs v-model="activeAnnotationTab" type="border-card" class="annotation-tabs">
            <!-- 基础配置 -->
            <ElTabPane label="基础配置" name="basic">
              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">强制 HTTPS 重定向</span>
                    <ElTooltip content="HTTP 自动跳转 HTTPS" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElSwitch v-model="annotations.sslRedirect" size="small" />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">SSL 透传</span>
                    <ElTooltip content="将 SSL 连接直接传递给后端" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElSwitch v-model="annotations.sslPassthrough" size="small" />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">后端协议</span>
                    <ElTooltip content="后端服务使用的协议" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElSelect
                    v-model="annotations.backendProtocol"
                    placeholder="默认 HTTP"
                    clearable
                    style="width: 100%"
                  >
                    <ElOption label="HTTP" value="HTTP" />
                    <ElOption label="HTTPS" value="HTTPS" />
                    <ElOption label="GRPC" value="GRPC" />
                    <ElOption label="GRPCS" value="GRPCS" />
                    <ElOption label="AJP" value="AJP" />
                    <ElOption label="FCGI" value="FCGI" />
                  </ElSelect>
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">最大请求体大小</span>
                    <ElTooltip content="默认 1m，支持 k/m/g，0 表示禁用" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.proxyBodySize"
                    placeholder="10m"
                    clearable
                    style="width: 100%"
                  />
                </div>
              </div>
            </ElTabPane>

            <!-- 会话保持 -->
            <ElTabPane label="会话保持" name="affinity">
              <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 12px">
                <template #title>
                  Nginx Ingress 支持两种会话保持模式：Cookie（基于 Cookie）和 IP Hash（基于客户端
                  IP）
                </template>
              </ElAlert>

              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">启用会话保持</span>
                    <ElTooltip content="保持客户端请求到同一后端 Pod" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElSwitch v-model="annotations.affinityEnabled" size="small" />
                </div>

                <template v-if="annotations.affinityEnabled">
                  <div class="config-item">
                    <div class="config-header">
                      <span class="config-label">会话保持模式</span>
                      <ElTooltip placement="top">
                        <template #content>
                          <div>• Cookie: 基于 Cookie（推荐）</div>
                          <div>• IP Hash: 基于客户端 IP</div>
                        </template>
                        <HelpCircle :size="11" class="help-icon" />
                      </ElTooltip>
                    </div>
                    <ElRadioGroup v-model="annotations.affinityMode" size="small">
                      <ElRadio value="cookie">Cookie 模式</ElRadio>
                      <ElRadio value="ip-hash">IP Hash 模式</ElRadio>
                    </ElRadioGroup>
                  </div>

                  <template v-if="annotations.affinityMode === 'cookie'">
                    <div class="config-item">
                      <div class="config-header">
                        <span class="config-label">Cookie 名称</span>
                        <ElTooltip content="会话 Cookie 的名称" placement="top">
                          <HelpCircle :size="11" class="help-icon" />
                        </ElTooltip>
                      </div>
                      <ElInput
                        v-model="annotations.sessionCookieName"
                        placeholder="route"
                        style="width: 100%"
                      />
                    </div>

                    <div class="config-item">
                      <div class="config-header">
                        <span class="config-label">Cookie 过期时间 (秒)</span>
                        <ElTooltip content="默认 172800 (48小时)" placement="top">
                          <HelpCircle :size="11" class="help-icon" />
                        </ElTooltip>
                      </div>
                      <ElInputNumber
                        v-model="annotations.sessionCookieExpires"
                        :min="60"
                        :max="604800"
                        controls-position="right"
                        style="width: 100%"
                      />
                    </div>

                    <div class="config-item">
                      <div class="config-header">
                        <span class="config-label">Cookie Max-Age (秒)</span>
                        <ElTooltip content="Cookie 最大存活时间" placement="top">
                          <HelpCircle :size="11" class="help-icon" />
                        </ElTooltip>
                      </div>
                      <ElInputNumber
                        v-model="annotations.sessionCookieMaxAge"
                        :min="60"
                        :max="604800"
                        controls-position="right"
                        style="width: 100%"
                      />
                    </div>

                    <div class="config-item">
                      <div class="config-header">
                        <span class="config-label">出错时重置 Cookie</span>
                        <ElTooltip content="后端失败时是否重新分配" placement="top">
                          <HelpCircle :size="11" class="help-icon" />
                        </ElTooltip>
                      </div>
                      <ElSwitch v-model="annotations.sessionCookieChangeOnFailure" size="small" />
                    </div>
                  </template>

                  <template v-if="annotations.affinityMode === 'ip-hash'">
                    <div class="config-item">
                      <ElAlert type="info" :closable="false" show-icon>
                        <template #title>
                          IP Hash 模式使用 $remote_addr
                          作为哈希键，相同IP的请求会被路由到同一后端，适用于不支持 Cookie 的客户端
                        </template>
                      </ElAlert>
                    </div>
                  </template>
                </template>
              </div>
            </ElTabPane>

            <!-- URL 重写 -->
            <ElTabPane label="URL 重写" name="rewrite">
              <ElAlert
                v-if="hasRegexPath"
                type="warning"
                :closable="false"
                show-icon
                style="margin-bottom: 12px"
              >
                <template #title> 检测到您使用了正则路径匹配，已自动启用正则匹配功能 </template>
              </ElAlert>

              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">启用正则匹配</span>
                    <ElTooltip placement="top">
                      <template #content>
                        <div>当路径类型选择"正则"时必须启用此选项</div>
                        <div style="margin-top: 4px">系统会根据路径配置自动管理</div>
                      </template>
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <div>
                    <ElSwitch
                      v-model="annotations.useRegex"
                      :disabled="hasRegexPath"
                      size="small"
                    />
                    <div v-if="hasRegexPath" class="config-hint">
                      <InfoIcon :size="11" />
                      <span>已自动启用（检测到正则路径）</span>
                    </div>
                  </div>
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">重写目标路径</span>
                    <ElTooltip placement="top">
                      <template #content>
                        <div>将请求路径重写到后端，例如:</div>
                        <div>• / (重写为根路径)</div>
                        <div>• /$1 (使用第1个捕获组)</div>
                        <div>• /$2 (使用第2个捕获组)</div>
                        <div style="color: #f56c6c; margin-top: 4px"
                          >⚠️ 全局生效，应用于所有路径</div
                        >
                      </template>
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.rewriteTarget"
                    placeholder="例如: /$1"
                    clearable
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">应用根路径重定向</span>
                    <ElTooltip content="访问 / 时重定向到指定路径" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.appRoot"
                    placeholder="/app"
                    clearable
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">配置片段 (configuration-snippet)</span>
                    <ElTooltip placement="top">
                      <template #content>
                        <div>自定义 Nginx location 配置指令</div>
                        <div>例如: rewrite ^/old/(.*)$ /new/$1 break;</div>
                      </template>
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.configurationSnippet"
                    type="textarea"
                    :rows="2"
                    placeholder="rewrite ^/old-path/(.*)$ /new-path/$1 break;"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">Server 片段 (server-snippet)</span>
                    <ElTooltip content="自定义 Nginx server 配置指令" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.serverSnippet"
                    type="textarea"
                    :rows="2"
                    placeholder="more_set_headers 'X-Custom-Header: value';"
                    style="width: 100%"
                  />
                </div>
              </div>
            </ElTabPane>

            <!-- CORS -->
            <ElTabPane label="CORS" name="cors">
              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">启用 CORS</span>
                  </div>
                  <ElSwitch v-model="annotations.enableCors" size="small" />
                </div>

                <template v-if="annotations.enableCors">
                  <div class="config-item">
                    <div class="config-header">
                      <span class="config-label">允许的来源</span>
                      <ElTooltip content="* 表示所有域名" placement="top">
                        <HelpCircle :size="11" class="help-icon" />
                      </ElTooltip>
                    </div>
                    <ElInput
                      v-model="annotations.corsAllowOrigin"
                      placeholder="*"
                      style="width: 100%"
                    />
                  </div>

                  <div class="config-item">
                    <div class="config-header">
                      <span class="config-label">允许的方法</span>
                    </div>
                    <ElInput
                      v-model="annotations.corsAllowMethods"
                      placeholder="GET, POST, PUT, DELETE, OPTIONS"
                      style="width: 100%"
                    />
                  </div>

                  <div class="config-item">
                    <div class="config-header">
                      <span class="config-label">允许的请求头</span>
                    </div>
                    <ElInput
                      v-model="annotations.corsAllowHeaders"
                      type="textarea"
                      :rows="2"
                      placeholder="Authorization, Content-Type"
                      style="width: 100%"
                    />
                  </div>

                  <div class="config-item">
                    <div class="config-header">
                      <span class="config-label">允许凭证</span>
                      <ElTooltip content="是否允许发送 Cookie" placement="top">
                        <HelpCircle :size="11" class="help-icon" />
                      </ElTooltip>
                    </div>
                    <ElSwitch v-model="annotations.corsAllowCredentials" size="small" />
                  </div>

                  <div class="config-item">
                    <div class="config-header">
                      <span class="config-label">预检缓存时间 (秒)</span>
                      <ElTooltip content="OPTIONS 请求的缓存时间" placement="top">
                        <HelpCircle :size="11" class="help-icon" />
                      </ElTooltip>
                    </div>
                    <ElInputNumber
                      v-model="annotations.corsMaxAge"
                      :min="0"
                      controls-position="right"
                      style="width: 100%"
                    />
                  </div>
                </template>
              </div>
            </ElTabPane>

            <!-- 限流 -->
            <ElTabPane label="限流" name="rate-limit">
              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">每秒请求数 (RPS)</span>
                    <ElTooltip content="限制每个 IP 每秒请求数，留空不限制" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInputNumber
                    v-model="annotations.limitRps"
                    :min="1"
                    :max="10000"
                    placeholder="留空不限制"
                    clearable
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">每分钟请求数 (RPM)</span>
                    <ElTooltip content="限制每个 IP 每分钟请求数，留空不限制" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInputNumber
                    v-model="annotations.limitRpm"
                    :min="1"
                    :max="100000"
                    placeholder="留空不限制"
                    clearable
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">连接数限制</span>
                    <ElTooltip content="限制每个 IP 同时连接数，留空不限制" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInputNumber
                    v-model="annotations.limitConnections"
                    :min="1"
                    :max="1000"
                    placeholder="留空不限制"
                    clearable
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">白名单 IP</span>
                    <ElTooltip content="这些 IP 不受限流限制，逗号分隔" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.limitWhitelist"
                    placeholder="192.168.1.1, 10.0.0.0/8"
                    clearable
                    style="width: 100%"
                  />
                </div>
              </div>
            </ElTabPane>

            <!-- 超时 -->
            <ElTabPane label="超时" name="timeout">
              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">连接超时 (秒)</span>
                    <ElTooltip content="建立连接超时，默认 60 秒" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInputNumber
                    v-model="annotations.proxyConnectTimeout"
                    :min="1"
                    :max="600"
                    clearable
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">读取超时 (秒)</span>
                    <ElTooltip content="读取响应超时，默认 60 秒" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInputNumber
                    v-model="annotations.proxyReadTimeout"
                    :min="1"
                    :max="600"
                    clearable
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">发送超时 (秒)</span>
                    <ElTooltip content="发送请求超时，默认 60 秒" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInputNumber
                    v-model="annotations.proxySendTimeout"
                    :min="1"
                    :max="600"
                    clearable
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>
              </div>
            </ElTabPane>

            <!-- 安全 -->
            <ElTabPane label="安全" name="security">
              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">SSL 协议</span>
                    <ElTooltip content="允许的 SSL/TLS 协议版本" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.sslProtocols"
                    placeholder="TLSv1.2 TLSv1.3"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">IP 白名单</span>
                    <ElTooltip content="只允许这些 IP 段访问，逗号分隔" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.whitelistSourceRange"
                    type="textarea"
                    :rows="2"
                    placeholder="192.168.1.0/24, 10.0.0.0/8"
                    clearable
                    style="width: 100%"
                  />
                </div>
              </div>
            </ElTabPane>

            <!-- 高级 -->
            <ElTabPane label="高级" name="advanced">
              <div class="config-list">
                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">WebSocket 服务</span>
                    <ElTooltip content="需要 WebSocket 支持的服务名，逗号分隔" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.websocketServices"
                    placeholder="service1,service2"
                    clearable
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">客户端缓冲区大小</span>
                    <ElTooltip content="默认 1m" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.clientBodyBufferSize"
                    placeholder="1m"
                    clearable
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">代理缓冲区大小</span>
                    <ElTooltip content="默认 4k" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.proxyBufferSize"
                    placeholder="4k"
                    clearable
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">代理缓冲区数量</span>
                    <ElTooltip content="默认 4" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInputNumber
                    v-model="annotations.proxyBuffersNumber"
                    :min="1"
                    clearable
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>

                <div class="config-item">
                  <div class="config-header">
                    <span class="config-label">自定义 HTTP 错误</span>
                    <ElTooltip content="需要自定义错误页的状态码，逗号分隔" placement="top">
                      <HelpCircle :size="11" class="help-icon" />
                    </ElTooltip>
                  </div>
                  <ElInput
                    v-model="annotations.customHttpErrors"
                    placeholder="404,503"
                    clearable
                    style="width: 100%"
                  />
                </div>
              </div>
            </ElTabPane>

            <!-- 自定义注解 -->
            <ElTabPane label="自定义注解" name="custom">
              <div class="custom-annotations">
                <div
                  v-for="(anno, index) in annotations.customAnnotations"
                  :key="index"
                  class="custom-row"
                >
                  <ElInput
                    v-model="anno.key"
                    placeholder="nginx.ingress.kubernetes.io/xxx"
                    style="flex: 1"
                  />
                  <ElInput
                    v-model="anno.value"
                    placeholder="值"
                    style="flex: 1; margin-left: 8px"
                  />
                  <ElButton
                    type="danger"
                    :icon="Trash2"
                    circle
                    size="small"
                    style="margin-left: 8px"
                    @click="removeCustomAnnotation(index)"
                  />
                </div>
                <ElButton
                  type="primary"
                  :icon="Plus"
                  plain
                  size="small"
                  @click="addCustomAnnotation"
                  style="margin-top: 8px"
                >
                  添加注解
                </ElButton>
              </div>
            </ElTabPane>
          </ElTabs>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <div class="section-header">
            <Tag :size="14" />
            <span>标签 (Labels)</span>
            <span class="optional-mark">可选</span>
          </div>

          <div v-if="formData.labels.length > 0" class="labels-list">
            <div v-for="(item, index) in formData.labels" :key="index" class="label-row">
              <ElInput v-model="item.key" placeholder="键" style="width: 180px" maxlength="63" />
              <span class="separator">=</span>
              <ElInput v-model="item.value" placeholder="值" style="flex: 1" maxlength="63" />
              <ElButton
                type="danger"
                :icon="Trash2"
                circle
                size="small"
                @click="removeLabel(index)"
              />
            </div>
          </div>

          <ElButton type="primary" :icon="Plus" plain @click="addLabel"> 添加标签 </ElButton>
        </div>
      </ElForm>
    </div>

    <!-- YAML 模式 -->
    <div v-else-if="editMode === 'yaml'" class="yaml-content">
      <ArtYamlEditor v-model="yamlContent" height="550" @change="handleYamlChange" />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">
        {{ dialogType === 'add' ? '创建' : '更新' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick, onMounted, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import yaml from 'js-yaml'
  import {
    Database,
    Route,
    Lock,
    Settings,
    Tag,
    FormInput,
    Code,
    Plus,
    Trash2,
    HelpCircle,
    Info as InfoIcon,
    Server,
    Globe,
    AlertCircle
  } from 'lucide-vue-next'
  import {
    createIngressApi,
    updateIngressApi,
    getIngressYamlApi,
    getApplicationServiceListApi,
    getServiceDetailApi,
    getSecretListApi,
    getClusterIngressDomainsApi,
    type IngressListItem,
    type ProjectWorkspace,
    type ApplicationServiceListResponse,
    type SecretListItem,
    type ServicePort,
    type OnecProjectApplication
  } from '@/api'
  import {
    getIngressClassListApi,
    type IngressClassListItem
  } from '@/api/workload/cluster-resource'
  import ArtYamlEditor from '@/components/yaml-editor-pro/index.vue'

  interface Props {
    visible: boolean
    dialogType: 'add' | 'edit'
    ingressData?: IngressListItem
    workspace: ProjectWorkspace | null
    application: OnecProjectApplication
  }

  interface KeyValue {
    key: string
    value: string
  }

  interface Path {
    path: string
    pathType: string
    serviceName: string
    servicePort: string | number
  }

  interface Rule {
    hostMode: 'cluster' | 'custom'
    hostPrefix: string
    hostSuffix: string
    customHost: string
    paths: Path[]
  }

  interface TLS {
    secretName: string
    hosts: string[]
    hostsInput: string
  }

  interface DefaultBackend {
    serviceName: string
    servicePort: string | number
  }

  const props = withDefaults(defineProps<Props>(), {
    ingressData: undefined
  })

  const emit = defineEmits(['close', 'success'])

  const handleClose = (val: boolean) => {
    if (!val) {
      emit('close')
    }
  }

  const formRef = ref()
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const dataLoading = ref(false)
  const yamlContent = ref('')
  const activeAnnotationTab = ref<string>('basic')

  // 加载状态
  const ingressClassLoading = ref(false)
  const serviceLoading = ref(false)
  const secretLoading = ref(false)
  const domainSuffixLoading = ref(false)
  const portLoadingMap = ref<Record<string, boolean>>({})
  const defaultBackendPortLoading = ref(false)

  // 数据列表
  const ingressClasses = ref<IngressClassListItem[]>([])
  const availableServices = ref<ApplicationServiceListResponse[]>([])
  const availableSecrets = ref<SecretListItem[]>([])
  const domainSuffixes = ref<string[]>([])
  const portOptionsMap = ref<Record<string, ServicePort[]>>({})
  const defaultBackendPorts = ref<ServicePort[]>([])

  const formData = ref({
    name: '',
    ingressClassName: 'nginx',
    rules: [] as Rule[],
    defaultBackendEnabled: false,
    defaultBackend: {
      serviceName: '',
      servicePort: ''
    } as DefaultBackend,
    tls: [] as TLS[],
    labels: [] as KeyValue[]
  })

  // Annotations - 超时默认值设置为 60
  const annotations = ref({
    useRegex: false,
    sslRedirect: false,
    sslPassthrough: false,
    backendProtocol: '',
    proxyBodySize: '',

    affinityEnabled: false,
    affinityMode: 'cookie' as 'cookie' | 'ip-hash',
    sessionCookieName: 'route',
    sessionCookieExpires: 172800,
    sessionCookieMaxAge: 172800,
    sessionCookieChangeOnFailure: false,

    rewriteTarget: '',
    appRoot: '',
    configurationSnippet: '',
    serverSnippet: '',

    enableCors: false,
    corsAllowOrigin: '*',
    corsAllowMethods: 'GET, POST, PUT, DELETE, OPTIONS',
    corsAllowHeaders:
      'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization',
    corsAllowCredentials: false,
    corsMaxAge: 1728000,

    limitRps: undefined as number | undefined,
    limitRpm: undefined as number | undefined,
    limitConnections: undefined as number | undefined,
    limitWhitelist: '',

    proxyConnectTimeout: 60,
    proxyReadTimeout: 60,
    proxySendTimeout: 60,

    sslProtocols: '',
    whitelistSourceRange: '',

    websocketServices: '',
    clientBodyBufferSize: '',
    proxyBufferSize: '',
    proxyBuffersNumber: undefined as number | undefined,
    customHttpErrors: '',

    customAnnotations: [] as KeyValue[]
  })

  const formRules = {
    name: [
      { required: true, message: '请输入 Ingress 名称', trigger: 'blur' },
      { pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, message: '名称格式不正确', trigger: 'blur' }
    ],
    ingressClassName: [{ required: true, message: '请选择 IngressClass', trigger: 'change' }]
  }

  const hasRegexPath = computed(() => {
    return formData.value.rules.some((rule) =>
      rule.paths.some((path) => path.pathType === 'ImplementationSpecific')
    )
  })

  // 获取完整的 Host 域名用于显示
  const getFullHostDisplay = (rule: Rule): string => {
    if (rule.hostMode === 'cluster') {
      const prefix = rule.hostPrefix?.trim() || ''
      const suffix = rule.hostSuffix?.trim() || ''

      if (!prefix && !suffix) return ''
      if (!prefix) return suffix
      if (!suffix) return prefix

      return `${prefix}${suffix}`
    } else if (rule.hostMode === 'custom') {
      return rule.customHost?.trim() || ''
    }
    return ''
  }

  watch(
    hasRegexPath,
    (newVal, oldVal) => {
      const isInitialLoad = oldVal === undefined

      if (newVal) {
        const wasDisabled = !annotations.value.useRegex
        annotations.value.useRegex = true

        if (!isInitialLoad && wasDisabled && !dataLoading.value) {
          ElMessage({
            type: 'info',
            message: '检测到正则路径，已自动启用正则匹配功能',
            duration: 3000,
            showClose: true
          })
        }
      } else {
        const wasEnabled = annotations.value.useRegex
        annotations.value.useRegex = false

        if (!isInitialLoad && wasEnabled && !dataLoading.value) {
          ElMessage({
            type: 'success',
            message: '已取消所有正则路径，已自动关闭正则匹配功能',
            duration: 3000,
            showClose: true
          })
        }
      }
    },
    { immediate: true }
  )

  const handlePathTypeChange = (pathType: string) => {
    if (pathType === 'ImplementationSpecific') {
      nextTick(() => {
        if (hasRegexPath.value) {
          ElMessage({
            type: 'warning',
            message: '使用正则匹配时，请在 URL 重写标签页配置相关参数',
            duration: 4000,
            showClose: true
          })
        }
      })
    }
  }

  const handleIngressClassVisibleChange = async (visible: boolean) => {
    if (visible && ingressClasses.value.length === 0 && props.workspace) {
      await loadIngressClasses()
    }
  }

  const loadIngressClasses = async () => {
    if (!props.workspace || ingressClassLoading.value) return

    ingressClassLoading.value = true
    try {
      const response = await getIngressClassListApi({
        clusterUuid: props.workspace.clusterUuid
      })

      if (Array.isArray(response)) {
        ingressClasses.value = response
      } else if (response?.items) {
        ingressClasses.value = response.items
      }
    } catch (error) {
      console.error('加载 IngressClass 失败:', error)
    } finally {
      ingressClassLoading.value = false
    }
  }

  // 加载域名后缀列表
  const handleDomainSuffixVisibleChange = async (visible: boolean) => {
    if (visible && domainSuffixes.value.length === 0 && props.workspace) {
      await loadDomainSuffixes()
    }
  }

  const loadDomainSuffixes = async () => {
    if (!props.workspace || domainSuffixLoading.value) return

    const clusterUuid = props.workspace.clusterUuid || props.workspace.clusterId

    if (!clusterUuid) {
      console.error('集群 UUID 不存在，workspace:', props.workspace)
      return
    }

    domainSuffixLoading.value = true
    try {
      const response = await getClusterIngressDomainsApi(clusterUuid)
      domainSuffixes.value = response || []
    } catch (error) {
      console.error('加载域名后缀失败:', error)
      domainSuffixes.value = []
    } finally {
      domainSuffixLoading.value = false
    }
  }

  const handleServiceVisibleChange = async (visible: boolean) => {
    if (visible && availableServices.value.length === 0 && props.workspace && props.application) {
      await loadServices()
    }
  }

  // 🔥 核心修改：加载应用级别的 Service 列表
  const loadServices = async () => {
    if (!props.workspace || !props.application || serviceLoading.value) return

    serviceLoading.value = true
    try {
      const response = await getApplicationServiceListApi({
        workloadId: props.workspace.id,
        applicationId: props.application.id
      })

      availableServices.value = response || []
    } catch (error) {
      console.error('加载 Service 列表失败:', error)
    } finally {
      serviceLoading.value = false
    }
  }

  // 🔥 格式化 Service 显示标签（显示版本信息）
  const formatServiceLabel = (svc: ApplicationServiceListResponse): string => {
    if (svc.version && svc.version > 0) {
      return `${svc.name} (${svc.versionName})`
    }
    return `${svc.name} (全部版本)`
  }

  const handleSecretVisibleChange = async (visible: boolean) => {
    if (visible && availableSecrets.value.length === 0 && props.workspace) {
      await loadSecrets()
    }
  }

  const loadSecrets = async () => {
    if (!props.workspace || secretLoading.value) return

    secretLoading.value = true
    try {
      const response = await getSecretListApi({
        workloadId: props.workspace.id,
        type: 'kubernetes.io/tls'
      })

      if (Array.isArray(response)) {
        availableSecrets.value = response
      } else if (response?.items) {
        availableSecrets.value = response.items
      }
    } catch (error) {
      console.error('加载 Secret 列表失败:', error)
    } finally {
      secretLoading.value = false
    }
  }

  // 🔥 处理端口加载（解析应用级 Service 的 ports 字符串）
  const handlePortVisibleChange = async (
    visible: boolean,
    ruleIndex: number,
    pathIndex: number,
    serviceName: string
  ) => {
    if (!visible || !serviceName || !props.workspace) return

    const key = `${ruleIndex}-${pathIndex}`

    if (portOptionsMap.value[key]?.length > 0) return

    portLoadingMap.value[key] = true

    try {
      // 从 availableServices 中找到对应的 Service
      const service = availableServices.value.find((s) => s.name === serviceName)

      if (service && service.ports) {
        // 解析 ports 字符串，格式如: "80:30080/TCP,443:30443/TCP"
        const ports = parsePorts(service.ports)
        portOptionsMap.value[key] = ports
      } else {
        // 如果没有 ports 字段或解析失败，尝试调用详情接口
        const response = await getServiceDetailApi({
          workloadId: props.workspace.id,
          name: serviceName
        })

        if (response?.ports) {
          portOptionsMap.value[key] = response.ports
        }
      }
    } catch (error) {
      console.error('加载端口失败:', error)
    } finally {
      portLoadingMap.value[key] = false
    }
  }

  const handleDefaultBackendPortVisibleChange = async (visible: boolean, serviceName: string) => {
    if (!visible || !serviceName || !props.workspace) return

    if (defaultBackendPorts.value.length > 0) return

    defaultBackendPortLoading.value = true

    try {
      // 从 availableServices 中找到对应的 Service
      const service = availableServices.value.find((s) => s.name === serviceName)

      if (service && service.ports) {
        // 解析 ports 字符串
        const ports = parsePorts(service.ports)
        defaultBackendPorts.value = ports
      } else {
        // 如果没有 ports 字段或解析失败，尝试调用详情接口
        const response = await getServiceDetailApi({
          workloadId: props.workspace.id,
          name: serviceName
        })

        if (response?.ports) {
          defaultBackendPorts.value = response.ports
        }
      }
    } catch (error) {
      console.error('加载端口失败:', error)
    } finally {
      defaultBackendPortLoading.value = false
    }
  }

  // 🔥 解析 ports 字符串，格式: "80:30080/TCP,443:30443/TCP"
  const parsePorts = (portsStr: string): ServicePort[] => {
    if (!portsStr || portsStr === '-') return []

    return portsStr.split(',').map((portStr) => {
      const parts = portStr.trim().split(':')
      const portWithProtocol = parts[0] || parts[1] || ''
      const portMatch = portWithProtocol.match(/(\d+)\/(\w+)/)

      if (portMatch) {
        const port = parseInt(portMatch[1])
        const protocol = portMatch[2]

        return {
          name: `port-${port}`,
          protocol: protocol,
          port: port,
          targetPort: String(port)
        } as ServicePort
      }

      // 简单格式: 80/TCP
      const simpleMatch = portWithProtocol.match(/(\d+)/)
      if (simpleMatch) {
        const port = parseInt(simpleMatch[1])
        return {
          name: `port-${port}`,
          protocol: 'TCP',
          port: port,
          targetPort: String(port)
        } as ServicePort
      }

      return {
        name: 'http',
        protocol: 'TCP',
        port: 80,
        targetPort: '80'
      } as ServicePort
    })
  }

  const handleServiceChange = (ruleIndex: number, pathIndex: number) => {
    const path = formData.value.rules[ruleIndex].paths[pathIndex]
    path.servicePort = ''

    const key = `${ruleIndex}-${pathIndex}`
    portOptionsMap.value[key] = []
  }

  const handleDefaultBackendServiceChange = () => {
    formData.value.defaultBackend.servicePort = ''
    defaultBackendPorts.value = []
  }

  const formatPortLabel = (port: ServicePort) => {
    if (port.name) {
      return `${port.name} (${port.port}/${port.protocol})`
    }
    return `${port.port}/${port.protocol}`
  }

  const addRule = () => {
    formData.value.rules.push({
      hostMode: 'cluster',
      hostPrefix: '',
      hostSuffix: '',
      customHost: '',
      paths: [{ path: '/', pathType: 'Prefix', serviceName: '', servicePort: '' }]
    })
  }

  const removeRule = (index: number) => {
    const ruleToRemove = formData.value.rules[index]
    const hasRegexInThisRule = ruleToRemove.paths.some(
      (path) => path.pathType === 'ImplementationSpecific'
    )

    const willHaveRegexAfterRemove = formData.value.rules.some((rule, ruleIdx) => {
      if (ruleIdx === index) return false
      return rule.paths.some((path) => path.pathType === 'ImplementationSpecific')
    })

    formData.value.rules.splice(index, 1)

    if (hasRegexInThisRule && !willHaveRegexAfterRemove) {
      nextTick(() => {
        ElMessage({
          type: 'info',
          message: '已删除最后一个正则路径规则，正则匹配功能已自动关闭',
          duration: 3000,
          showClose: true
        })
      })
    }
  }

  const addPath = (ruleIndex: number) => {
    formData.value.rules[ruleIndex].paths.push({
      path: '/',
      pathType: 'Prefix',
      serviceName: '',
      servicePort: ''
    })
  }

  const removePath = (ruleIndex: number, pathIndex: number) => {
    const pathToRemove = formData.value.rules[ruleIndex].paths[pathIndex]
    const isRegexPath = pathToRemove.pathType === 'ImplementationSpecific'

    const willHaveRegexAfterRemove = formData.value.rules.some((rule, rIdx) => {
      return rule.paths.some((path, pIdx) => {
        if (rIdx === ruleIndex && pIdx === pathIndex) return false
        return path.pathType === 'ImplementationSpecific'
      })
    })

    formData.value.rules[ruleIndex].paths.splice(pathIndex, 1)

    if (isRegexPath && !willHaveRegexAfterRemove) {
      nextTick(() => {
        ElMessage({
          type: 'info',
          message: '已删除最后一个正则路径，正则匹配功能已自动关闭',
          duration: 3000,
          showClose: true
        })
      })
    }
  }

  const addTLS = () => {
    formData.value.tls.push({ secretName: '', hosts: [], hostsInput: '' })
  }

  const removeTLS = (index: number) => {
    formData.value.tls.splice(index, 1)
  }

  const parseTLSHosts = (tlsIndex: number) => {
    const input = formData.value.tls[tlsIndex].hostsInput
    formData.value.tls[tlsIndex].hosts = input
      .split(',')
      .map((h) => h.trim())
      .filter((h) => h)
  }

  const addLabel = () => {
    formData.value.labels.push({ key: '', value: '' })
  }

  const removeLabel = (index: number) => {
    formData.value.labels.splice(index, 1)
  }

  const addCustomAnnotation = () => {
    annotations.value.customAnnotations.push({ key: '', value: '' })
  }

  const removeCustomAnnotation = (index: number) => {
    annotations.value.customAnnotations.splice(index, 1)
  }

  const objectToArray = (obj?: Record<string, string>): KeyValue[] => {
    if (!obj) return []
    return Object.entries(obj)
      .filter(([key]) => key)
      .map(([key, value]) => ({ key, value }))
  }

  const arrayToObject = (arr: KeyValue[]): Record<string, string> => {
    const obj: Record<string, string> = {}
    arr.forEach((item) => {
      if (item.key && item.key.trim()) obj[item.key.trim()] = item.value
    })
    return obj
  }

  const buildAnnotations = (): Record<string, string> => {
    const result: Record<string, string> = {}
    const prefix = 'nginx.ingress.kubernetes.io/'

    if (annotations.value.useRegex) {
      result[`${prefix}use-regex`] = 'true'
    }

    if (annotations.value.sslRedirect) result[`${prefix}ssl-redirect`] = 'true'
    if (annotations.value.sslPassthrough) result[`${prefix}ssl-passthrough`] = 'true'
    if (annotations.value.backendProtocol)
      result[`${prefix}backend-protocol`] = annotations.value.backendProtocol
    if (annotations.value.proxyBodySize)
      result[`${prefix}proxy-body-size`] = annotations.value.proxyBodySize

    if (annotations.value.affinityEnabled) {
      if (annotations.value.affinityMode === 'cookie') {
        result[`${prefix}affinity`] = 'cookie'
        result[`${prefix}session-cookie-name`] = annotations.value.sessionCookieName
        result[`${prefix}session-cookie-expires`] = String(annotations.value.sessionCookieExpires)
        result[`${prefix}session-cookie-max-age`] = String(annotations.value.sessionCookieMaxAge)
        if (annotations.value.sessionCookieChangeOnFailure) {
          result[`${prefix}session-cookie-change-on-failure`] = 'true'
        }
      } else {
        result[`${prefix}upstream-hash-by`] = '$remote_addr'
      }
    }

    if (annotations.value.rewriteTarget)
      result[`${prefix}rewrite-target`] = annotations.value.rewriteTarget
    if (annotations.value.appRoot) result[`${prefix}app-root`] = annotations.value.appRoot
    if (annotations.value.configurationSnippet)
      result[`${prefix}configuration-snippet`] = annotations.value.configurationSnippet
    if (annotations.value.serverSnippet)
      result[`${prefix}server-snippet`] = annotations.value.serverSnippet

    if (annotations.value.enableCors) {
      result[`${prefix}enable-cors`] = 'true'
      result[`${prefix}cors-allow-origin`] = annotations.value.corsAllowOrigin
      result[`${prefix}cors-allow-methods`] = annotations.value.corsAllowMethods
      result[`${prefix}cors-allow-headers`] = annotations.value.corsAllowHeaders
      if (annotations.value.corsAllowCredentials) result[`${prefix}cors-allow-credentials`] = 'true'
      result[`${prefix}cors-max-age`] = String(annotations.value.corsMaxAge)
    }

    if (annotations.value.limitRps)
      result[`${prefix}limit-rps`] = String(annotations.value.limitRps)
    if (annotations.value.limitRpm)
      result[`${prefix}limit-rpm`] = String(annotations.value.limitRpm)
    if (annotations.value.limitConnections)
      result[`${prefix}limit-connections`] = String(annotations.value.limitConnections)
    if (annotations.value.limitWhitelist)
      result[`${prefix}limit-whitelist`] = annotations.value.limitWhitelist

    if (annotations.value.proxyConnectTimeout && annotations.value.proxyConnectTimeout !== 60)
      result[`${prefix}proxy-connect-timeout`] = String(annotations.value.proxyConnectTimeout)
    if (annotations.value.proxyReadTimeout && annotations.value.proxyReadTimeout !== 60)
      result[`${prefix}proxy-read-timeout`] = String(annotations.value.proxyReadTimeout)
    if (annotations.value.proxySendTimeout && annotations.value.proxySendTimeout !== 60)
      result[`${prefix}proxy-send-timeout`] = String(annotations.value.proxySendTimeout)

    if (annotations.value.sslProtocols)
      result[`${prefix}ssl-protocols`] = annotations.value.sslProtocols
    if (annotations.value.whitelistSourceRange)
      result[`${prefix}whitelist-source-range`] = annotations.value.whitelistSourceRange
    if (annotations.value.websocketServices)
      result[`${prefix}websocket-services`] = annotations.value.websocketServices
    if (annotations.value.clientBodyBufferSize)
      result[`${prefix}client-body-buffer-size`] = annotations.value.clientBodyBufferSize
    if (annotations.value.proxyBufferSize)
      result[`${prefix}proxy-buffer-size`] = annotations.value.proxyBufferSize
    if (annotations.value.proxyBuffersNumber)
      result[`${prefix}proxy-buffers-number`] = String(annotations.value.proxyBuffersNumber)
    if (annotations.value.customHttpErrors)
      result[`${prefix}custom-http-errors`] = annotations.value.customHttpErrors

    annotations.value.customAnnotations.forEach((anno) => {
      if (anno.key && anno.value) result[anno.key.trim()] = anno.value
    })

    return result
  }

  const parseAnnotations = (annos: Record<string, string>) => {
    const prefix = 'nginx.ingress.kubernetes.io/'

    annotations.value.useRegex = annos[`${prefix}use-regex`] === 'true'
    annotations.value.sslRedirect = annos[`${prefix}ssl-redirect`] === 'true'
    annotations.value.sslPassthrough = annos[`${prefix}ssl-passthrough`] === 'true'
    annotations.value.backendProtocol = annos[`${prefix}backend-protocol`] || ''
    annotations.value.proxyBodySize = annos[`${prefix}proxy-body-size`] || ''

    if (annos[`${prefix}affinity`] === 'cookie') {
      annotations.value.affinityEnabled = true
      annotations.value.affinityMode = 'cookie'
      annotations.value.sessionCookieName = annos[`${prefix}session-cookie-name`] || 'route'
      annotations.value.sessionCookieExpires = parseInt(
        annos[`${prefix}session-cookie-expires`] || '172800'
      )
      annotations.value.sessionCookieMaxAge = parseInt(
        annos[`${prefix}session-cookie-max-age`] || '172800'
      )
      annotations.value.sessionCookieChangeOnFailure =
        annos[`${prefix}session-cookie-change-on-failure`] === 'true'
    } else if (annos[`${prefix}upstream-hash-by`]) {
      annotations.value.affinityEnabled = true
      annotations.value.affinityMode = 'ip-hash'
    }

    annotations.value.rewriteTarget = annos[`${prefix}rewrite-target`] || ''
    annotations.value.appRoot = annos[`${prefix}app-root`] || ''
    annotations.value.configurationSnippet = annos[`${prefix}configuration-snippet`] || ''
    annotations.value.serverSnippet = annos[`${prefix}server-snippet`] || ''

    if (annos[`${prefix}enable-cors`] === 'true') {
      annotations.value.enableCors = true
      annotations.value.corsAllowOrigin = annos[`${prefix}cors-allow-origin`] || '*'
      annotations.value.corsAllowMethods =
        annos[`${prefix}cors-allow-methods`] || 'GET, POST, PUT, DELETE, OPTIONS'
      annotations.value.corsAllowHeaders = annos[`${prefix}cors-allow-headers`] || ''
      annotations.value.corsAllowCredentials = annos[`${prefix}cors-allow-credentials`] === 'true'
      annotations.value.corsMaxAge = parseInt(annos[`${prefix}cors-max-age`] || '1728000')
    }

    if (annos[`${prefix}limit-rps`])
      annotations.value.limitRps = parseInt(annos[`${prefix}limit-rps`])
    if (annos[`${prefix}limit-rpm`])
      annotations.value.limitRpm = parseInt(annos[`${prefix}limit-rpm`])
    if (annos[`${prefix}limit-connections`])
      annotations.value.limitConnections = parseInt(annos[`${prefix}limit-connections`])
    annotations.value.limitWhitelist = annos[`${prefix}limit-whitelist`] || ''

    annotations.value.proxyConnectTimeout = annos[`${prefix}proxy-connect-timeout`]
      ? parseInt(annos[`${prefix}proxy-connect-timeout`])
      : 60
    annotations.value.proxyReadTimeout = annos[`${prefix}proxy-read-timeout`]
      ? parseInt(annos[`${prefix}proxy-read-timeout`])
      : 60
    annotations.value.proxySendTimeout = annos[`${prefix}proxy-send-timeout`]
      ? parseInt(annos[`${prefix}proxy-send-timeout`])
      : 60

    annotations.value.sslProtocols = annos[`${prefix}ssl-protocols`] || ''
    annotations.value.whitelistSourceRange = annos[`${prefix}whitelist-source-range`] || ''
    annotations.value.websocketServices = annos[`${prefix}websocket-services`] || ''
    annotations.value.clientBodyBufferSize = annos[`${prefix}client-body-buffer-size`] || ''
    annotations.value.proxyBufferSize = annos[`${prefix}proxy-buffer-size`] || ''
    if (annos[`${prefix}proxy-buffers-number`])
      annotations.value.proxyBuffersNumber = parseInt(annos[`${prefix}proxy-buffers-number`])
    annotations.value.customHttpErrors = annos[`${prefix}custom-http-errors`] || ''

    const knownKeys = [
      'use-regex',
      'ssl-redirect',
      'ssl-passthrough',
      'backend-protocol',
      'proxy-body-size',
      'affinity',
      'session-cookie-name',
      'session-cookie-expires',
      'session-cookie-max-age',
      'session-cookie-change-on-failure',
      'upstream-hash-by',
      'rewrite-target',
      'app-root',
      'configuration-snippet',
      'server-snippet',
      'enable-cors',
      'cors-allow-origin',
      'cors-allow-methods',
      'cors-allow-headers',
      'cors-allow-credentials',
      'cors-max-age',
      'limit-rps',
      'limit-rpm',
      'limit-connections',
      'limit-whitelist',
      'proxy-connect-timeout',
      'proxy-read-timeout',
      'proxy-send-timeout',
      'ssl-protocols',
      'whitelist-source-range',
      'websocket-services',
      'client-body-buffer-size',
      'proxy-buffer-size',
      'proxy-buffers-number',
      'custom-http-errors'
    ].map((k) => `${prefix}${k}`)

    Object.entries(annos).forEach(([key, value]) => {
      if (!knownKeys.includes(key)) {
        annotations.value.customAnnotations.push({ key, value })
      }
    })
  }

  const formToYaml = () => {
    const ingressObj: any = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: formData.value.name || 'ingress-name',
        namespace: props.workspace?.namespace || 'default'
      },
      spec: {
        ingressClassName: formData.value.ingressClassName || 'nginx'
      }
    }

    const labelsObj = arrayToObject(formData.value.labels)
    if (Object.keys(labelsObj).length > 0) ingressObj.metadata.labels = labelsObj

    const annos = buildAnnotations()
    if (Object.keys(annos).length > 0) ingressObj.metadata.annotations = annos

    if (formData.value.rules.length > 0) {
      ingressObj.spec.rules = formData.value.rules
        .filter((rule) => rule.paths.length > 0)
        .map((rule) => {
          let fullHost = ''

          if (rule.hostMode === 'cluster') {
            const prefix = rule.hostPrefix?.trim() || ''
            const suffix = rule.hostSuffix?.trim() || ''
            if (prefix && suffix) {
              fullHost = `${prefix}${suffix}`
            }
          } else if (rule.hostMode === 'custom') {
            fullHost = rule.customHost?.trim() || ''
          }

          const ruleObj: any = {
            http: {
              paths: rule.paths
                .filter((path) => path.serviceName && path.servicePort)
                .map((path) => ({
                  path: path.path || '/',
                  pathType: path.pathType || 'Prefix',
                  backend: {
                    service: {
                      name: path.serviceName,
                      port:
                        typeof path.servicePort === 'number'
                          ? { number: path.servicePort }
                          : { name: path.servicePort }
                    }
                  }
                }))
            }
          }
          if (fullHost) ruleObj.host = fullHost
          return ruleObj
        })
    }

    if (
      formData.value.defaultBackendEnabled &&
      formData.value.defaultBackend.serviceName &&
      formData.value.defaultBackend.servicePort
    ) {
      ingressObj.spec.defaultBackend = {
        service: {
          name: formData.value.defaultBackend.serviceName,
          port:
            typeof formData.value.defaultBackend.servicePort === 'number'
              ? { number: formData.value.defaultBackend.servicePort }
              : { name: formData.value.defaultBackend.servicePort }
        }
      }
    }

    if (formData.value.tls.length > 0) {
      ingressObj.spec.tls = formData.value.tls
        .filter((tls) => tls.secretName && tls.hosts.length > 0)
        .map((tls) => ({ secretName: tls.secretName, hosts: tls.hosts }))
    }

    yamlContent.value = yaml.dump(ingressObj, { indent: 2 })
  }

  const parseRules = (rules: any[]): Rule[] => {
    if (!rules || rules.length === 0) return []

    return rules.map((rule) => {
      const host = rule.host || ''
      let hostMode: 'cluster' | 'custom' = 'cluster'
      let hostPrefix = ''
      let hostSuffix = ''
      let customHost = ''

      if (host) {
        const matchedSuffix = domainSuffixes.value.find((suffix) => host.endsWith(suffix))
        if (matchedSuffix) {
          hostMode = 'cluster'
          hostSuffix = matchedSuffix
          hostPrefix = host.substring(0, host.length - matchedSuffix.length)
        } else {
          hostMode = 'custom'
          customHost = host
        }
      } else {
        hostMode = 'cluster'
      }

      return {
        hostMode,
        hostPrefix,
        hostSuffix,
        customHost,
        paths:
          rule.http?.paths?.map((p: any) => ({
            path: p.path || '/',
            pathType: p.pathType || 'Prefix',
            serviceName: p.backend?.service?.name || '',
            servicePort: p.backend?.service?.port?.number || p.backend?.service?.port?.name || ''
          })) || []
      }
    })
  }

  const parseTLS = (tls: any[]): TLS[] => {
    if (!tls || tls.length === 0) return []
    return tls.map((t) => ({
      secretName: t.secretName || '',
      hosts: t.hosts || [],
      hostsInput: (t.hosts || []).join(',')
    }))
  }

  const parseDefaultBackend = (defaultBackend: any) => {
    if (defaultBackend?.service) {
      formData.value.defaultBackendEnabled = true
      formData.value.defaultBackend = {
        serviceName: defaultBackend.service.name || '',
        servicePort: defaultBackend.service.port?.number || defaultBackend.service.port?.name || ''
      }
    } else {
      formData.value.defaultBackendEnabled = false
      formData.value.defaultBackend = {
        serviceName: '',
        servicePort: ''
      }
    }
  }

  const yamlToForm = (yamlStr: string) => {
    try {
      const obj = yaml.load(yamlStr) as any

      formData.value.name = obj.metadata?.name || ''
      formData.value.ingressClassName = obj.spec?.ingressClassName || 'nginx'
      formData.value.rules = parseRules(obj.spec?.rules || [])
      parseDefaultBackend(obj.spec?.defaultBackend)
      formData.value.tls = parseTLS(obj.spec?.tls || [])
      formData.value.labels = objectToArray(obj.metadata?.labels)

      annotations.value.customAnnotations = []

      if (obj.metadata?.annotations) {
        parseAnnotations(obj.metadata.annotations)
      }

      nextTick(() => {
        if (hasRegexPath.value && props.dialogType === 'edit' && !dataLoading.value) {
          ElMessage({
            type: 'info',
            message: '当前配置使用了正则路径匹配，相关配置在"高级配置 > URL 重写"中',
            duration: 4000,
            showClose: true
          })
        }
      })
    } catch (error) {
      console.error('❌ [yamlToForm] YAML 解析失败:', error)
      throw error
    }
  }

  const loadIngressYAML = async () => {
    if (!props.workspace || !props.ingressData) {
      return
    }

    dataLoading.value = true
    try {
      await loadDomainSuffixes()

      const yamlStr = await getIngressYamlApi({
        workloadId: props.workspace.id,
        name: props.ingressData.name
      })

      yamlContent.value = yamlStr
      yamlToForm(yamlStr)
    } catch (error: any) {
      console.error('❌ [loadIngressYAML] 加载失败:', error)
      emit('close')
    } finally {
      dataLoading.value = false
    }
  }

  watch(
    () => props.visible,
    async (val) => {
      if (val) {
        if (props.dialogType === 'edit' && props.ingressData && props.workspace) {
          await loadIngressYAML()
        } else if (props.dialogType === 'add') {
          formData.value.rules = [
            {
              hostMode: 'cluster',
              hostPrefix: '',
              hostSuffix: '',
              customHost: '',
              paths: [{ path: '/', pathType: 'Prefix', serviceName: '', servicePort: '' }]
            }
          ]
          await nextTick()
          formToYaml()
        }
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    if (props.visible && props.dialogType === 'edit' && props.ingressData && props.workspace) {
      loadIngressYAML()
    }
  })

  watch(editMode, (newMode, oldMode) => {
    if (newMode === 'yaml' && oldMode === 'form') {
      formToYaml()
    } else if (newMode === 'form' && oldMode === 'yaml') {
      try {
        yamlToForm(yamlContent.value)

        nextTick(() => {
          if (hasRegexPath.value) {
            ElMessage({
              type: 'success',
              message: '已切换到表单模式，检测到正则路径配置',
              duration: 3000,
              showClose: true
            })
          } else {
            ElMessage({
              type: 'success',
              message: '已切换到表单模式',
              duration: 2000
            })
          }
        })
      } catch (error) {
        console.error('❌ [watch editMode] YAML 解析失败:', error)
        nextTick(() => {
          editMode.value = 'yaml'
        })
      }
    }
  })

  const handleYamlChange = (content: string) => {
    yamlContent.value = content
  }

  const handleSubmit = async () => {
    if (!props.workspace) {
      return
    }

    if (editMode.value === 'form') {
      try {
        await formRef.value?.validate()
      } catch (error) {
        return
      }

      if (formData.value.rules.length === 0) {
        return
      }

      for (const rule of formData.value.rules) {
        if (rule.hostMode === 'cluster') {
          if (!rule.hostPrefix || !rule.hostSuffix) {
            return
          }
        } else if (rule.hostMode === 'custom') {
          if (!rule.customHost) {
            return
          }
        }
      }

      const hasInvalidPath = formData.value.rules.some((rule) =>
        rule.paths.some((path) => !path.serviceName || !path.servicePort)
      )
      if (hasInvalidPath) {
        return
      }

      if (
        formData.value.defaultBackendEnabled &&
        (!formData.value.defaultBackend.serviceName || !formData.value.defaultBackend.servicePort)
      ) {
        return
      }

      formToYaml()
    }

    submitting.value = true
    try {
      const requestData = {
        workloadId: props.workspace.id,
        name: formData.value.name,
        ingressYamlStr: yamlContent.value
      }

      if (props.dialogType === 'add') {
        await createIngressApi(requestData)
        ElMessage.success('创建成功')
      } else {
        await updateIngressApi(requestData)
        ElMessage.success('更新成功')
      }

      emit('success')
      emit('close')
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const handleCancel = () => {
    emit('close')
  }

  const handleClosed = () => {
    formRef.value?.resetFields()
    formData.value = {
      name: '',
      ingressClassName: 'nginx',
      rules: [],
      defaultBackendEnabled: false,
      defaultBackend: {
        serviceName: '',
        servicePort: ''
      },
      tls: [],
      labels: []
    }
    annotations.value = {
      useRegex: false,
      sslRedirect: false,
      sslPassthrough: false,
      backendProtocol: '',
      proxyBodySize: '',
      affinityEnabled: false,
      affinityMode: 'cookie',
      sessionCookieName: 'route',
      sessionCookieExpires: 172800,
      sessionCookieMaxAge: 172800,
      sessionCookieChangeOnFailure: false,
      rewriteTarget: '',
      appRoot: '',
      configurationSnippet: '',
      serverSnippet: '',
      enableCors: false,
      corsAllowOrigin: '*',
      corsAllowMethods: 'GET, POST, PUT, DELETE, OPTIONS',
      corsAllowHeaders:
        'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization',
      corsAllowCredentials: false,
      corsMaxAge: 1728000,
      limitRps: undefined,
      limitRpm: undefined,
      limitConnections: undefined,
      limitWhitelist: '',
      proxyConnectTimeout: 60,
      proxyReadTimeout: 60,
      proxySendTimeout: 60,
      sslProtocols: '',
      whitelistSourceRange: '',
      websocketServices: '',
      clientBodyBufferSize: '',
      proxyBufferSize: '',
      proxyBuffersNumber: undefined,
      customHttpErrors: '',
      customAnnotations: []
    }

    ingressClasses.value = []
    availableServices.value = []
    availableSecrets.value = []
    domainSuffixes.value = []
    portOptionsMap.value = {}
    defaultBackendPorts.value = []

    yamlContent.value = ''
    editMode.value = 'form'
    activeAnnotationTab.value = 'basic'
  }

  watch(
    () => [formData.value, annotations.value],
    () => {
      if (editMode.value === 'form' && !dataLoading.value) {
        formToYaml()
      }
    },
    { deep: true }
  )
</script>

<style lang="scss" scoped>
  /* 与全局 IngressDialog 样式完全相同 - 从第一个文档复制 */
  .mode-switch {
    margin-bottom: 14px;
    display: flex;
    justify-content: flex-end;

    .radio-content {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
    }
  }

  .form-content {
    max-height: 68vh;
    overflow-y: auto;
    padding-right: 6px;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  .form-section {
    margin-bottom: 16px;
    padding: 16px;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e4e7ed;
      font-size: 14px;
      font-weight: 600;
      color: #303133;

      .optional-mark {
        margin-left: auto;
        font-size: 12px;
        font-weight: 400;
        color: #909399;
        background: #f4f4f5;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }
  }

  .help-icon {
    cursor: help;
    color: #909399;
    transition: color 0.2s;

    &:hover {
      color: #606266;
    }
  }

  .rules-container,
  .tls-list,
  .labels-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 8px;
  }

  .rule-card,
  .tls-item {
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .rule-card-header,
  .tls-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 13px;
  }

  .rule-card-body,
  .tls-item-body {
    padding: 14px;
    background: white;
  }

  .form-item {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .host-input-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .host-preview {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 12px;
    background: #f0f9ff;
    border-radius: 6px;
    border: 1px solid #bfdbfe;
    font-size: 12px;
    color: #1e40af;

    .preview-domain {
      font-weight: 600;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      color: #1d4ed8;
    }
  }

  .host-error-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 12px;
    background: #fef2f2;
    border-radius: 6px;
    border: 1px solid #fecaca;
    font-size: 12px;
    color: #dc2626;

    svg {
      flex-shrink: 0;
    }
  }

  .two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .paths-section {
    margin-top: 12px;
  }

  .paths-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #dee2e6;
    font-weight: 600;
    font-size: 13px;
    color: #495057;
  }

  .path-card {
    background: #fafafa;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    overflow: hidden;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .path-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f0f0f1;
    font-weight: 500;
    font-size: 12px;
    color: #495057;
  }

  .path-card-body {
    padding: 12px;
    background: white;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #495057;
    margin-bottom: 6px;
  }

  .default-backend-switch {
    margin-bottom: 16px;
  }

  .annotation-tabs {
    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__content) {
      padding: 16px;
      min-height: 200px;
    }

    :deep(.el-tabs__item) {
      font-size: 12px;
      padding: 0 18px;
      height: 38px;
      line-height: 38px;
    }
  }

  .config-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;

    &:hover {
      border-color: #d0d3d9;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }
  }

  .config-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }

  .config-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  .config-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 11px;
    color: #e6a23c;

    svg {
      flex-shrink: 0;
    }
  }

  .custom-annotations {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .custom-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .label-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px solid #e4e7ed;

    .separator {
      color: #6c757d;
      font-weight: 600;
      font-size: 13px;
    }
  }

  .option-item,
  .service-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .option-name,
    .service-name {
      flex: 1;
      font-weight: 500;
      font-size: 12px;
    }
  }

  .yaml-content {
    min-height: 550px;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-input__inner) {
    font-size: 13px;
  }

  :deep(.el-select) {
    font-size: 13px;
  }

  :deep(.el-button) {
    font-size: 12px;
  }

  :deep(.el-input-number) {
    width: 100%;

    .el-input__inner {
      text-align: left;
    }
  }

  :deep(.el-alert) {
    padding: 10px 14px;
    font-size: 12px;
    border-radius: 6px;

    .el-alert__title {
      font-size: 12px;
      line-height: 1.6;
    }
  }

  :deep(.el-switch) {
    --el-switch-on-color: #667eea;
  }

  :deep(.el-input-group__prepend) {
    background-color: #f5f7fa;
    color: #606266;
    font-weight: 500;
    font-size: 12px;
  }
</style>

<style lang="scss">
  .el-dialog__body {
    padding: 0 !important;
  }
</style>
