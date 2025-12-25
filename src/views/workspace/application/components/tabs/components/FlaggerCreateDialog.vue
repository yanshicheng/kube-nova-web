<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="dialogTitle"
    width="1200px"
    top="3vh"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleDialogClose"
    class="flagger-create-dialog"
  >
    <!-- 模式切换 -->
    <div class="mode-switcher">
      <ElRadioGroup v-model="editMode" size="default">
        <ElRadioButton value="form">
          <Settings :size="14" />
          向导模式
        </ElRadioButton>
        <ElRadioButton value="yaml">
          <FileCode :size="14" />
          YAML 模式
        </ElRadioButton>
      </ElRadioGroup>

      <div class="mode-tips">
        <Info :size="14" />
        {{
          editMode === 'form'
            ? '向导模式：分步骤配置，自动生成 YAML'
            : 'YAML 模式：直接编辑 YAML 配置'
        }}
      </div>
    </div>

    <!-- 表单模式 -->
    <div v-show="editMode === 'form'" class="wizard-content">
      <!-- 步骤指示器 - 可点击切换 -->
      <ElSteps :active="currentStep" align-center finish-status="success" class="steps-header">
        <ElStep title="选择版本" :icon="Box" @click="handleStepChange(0)" />
        <ElStep title="发布策略" :icon="Zap" @click="handleStepChange(1)" />
        <ElStep title="网格配置" :icon="Network" @click="handleStepChange(2)" />
        <ElStep title="指标配置" :icon="Activity" @click="handleStepChange(3)" />
        <ElStep title="Webhook" :icon="Webhook" @click="handleStepChange(4)" />
        <ElStep title="确认创建" :icon="CheckCircle" @click="handleStepChange(5)" />
      </ElSteps>

      <!-- 步骤内容 -->
      <div class="step-content">
        <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="140px">
          <!-- Step 1: 选择版本 -->
          <div v-show="currentStep === 0" class="step-panel">
            <div class="step-panel-header">
              <Box :size="20" />
              <div class="header-content">
                <h3>选择要发布的版本</h3>
                <p>选择一个稳定版本（stable）作为 Canary 发布的目标资源</p>
              </div>
            </div>

            <div class="form-content">
              <ElFormItem label="Canary 名称" prop="name">
                <ElInput
                  v-model="formData.name"
                  placeholder="请输入 Canary 名称"
                  clearable
                  :disabled="mode === 'edit'"
                >
                  <template #prepend>
                    <Tag :size="14" />
                  </template>
                  <template #suffix>
                    <ElTooltip placement="top">
                      <template #content>
                        <div style="max-width: 300px; line-height: 1.6">
                          必须是有效的 DNS 子域名<br />
                          例如：my-app-canary
                        </div>
                      </template>
                      <AlertCircle :size="16" style="color: #909399; cursor: help" />
                    </ElTooltip>
                  </template>
                </ElInput>
              </ElFormItem>

              <ElFormItem label="选择版本" prop="versionId" class="version-select-item">
                <ElSelect
                  v-model="formData.versionId"
                  placeholder="请选择稳定版本（stable）"
                  clearable
                  filterable
                  style="width: 100%"
                  @change="handleVersionChange"
                  @focus="loadVersions"
                >
                  <ElOption
                    v-for="version in stableVersions"
                    :key="version.id"
                    :label="`${version.resourceName} (v${version.version})`"
                    :value="version.id"
                  >
                    <div class="version-option">
                      <div class="version-main">
                        <ElTag size="small" type="success">v{{ version.version }}</ElTag>
                        <span class="version-name">{{ version.resourceName }}</span>
                      </div>
                      <ElTag v-if="version.versionRole" size="small" type="info">
                        {{ version.versionRole }}
                      </ElTag>
                    </div>
                  </ElOption>
                </ElSelect>
                <template #suffix>
                  <ElTooltip placement="top">
                    <template #content>
                      <div style="max-width: 300px; line-height: 1.6">
                        只显示标记为 stable 的版本<br />
                        这些版本已经过稳定性验证
                      </div>
                    </template>
                    <AlertCircle :size="16" style="color: #909399; cursor: help" />
                  </ElTooltip>
                </template>
              </ElFormItem>

              <!-- 目标资源预览 -->
              <div v-if="selectedVersion" class="resource-preview-card">
                <div class="preview-header">
                  <Eye :size="16" />
                  <span>目标资源预览</span>
                </div>
                <div class="preview-content">
                  <div class="preview-item">
                    <span class="label">资源类型：</span>
                    <ElTag type="primary">{{ targetResourceKind }}</ElTag>
                    <ElTooltip placement="top">
                      <template #content>从应用配置继承，不可修改</template>
                      <AlertCircle
                        :size="14"
                        style="color: #909399; cursor: help; margin-left: 4px"
                      />
                    </ElTooltip>
                  </div>
                  <div class="preview-item">
                    <span class="label">资源名称：</span>
                    <span class="value">{{ selectedVersion.resourceName }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">命名空间：</span>
                    <ElTag type="warning">{{ targetNamespace }}</ElTag>
                    <ElTooltip placement="top">
                      <template #content>从工作空间继承，不可修改</template>
                      <AlertCircle
                        :size="14"
                        style="color: #909399; cursor: help; margin-left: 4px"
                      />
                    </ElTooltip>
                  </div>
                  <div class="preview-item">
                    <span class="label">版本号：</span>
                    <span class="value">v{{ selectedVersion.version }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">API 版本：</span>
                    <span class="value">{{ targetApiVersion }}</span>
                  </div>
                </div>

                <ElAlert type="info" :closable="false" show-icon>
                  <template #title>
                    Flagger 将创建一个 Canary 资源来管理此 {{ targetResourceKind }} 的灰度发布流程
                  </template>
                </ElAlert>
              </div>
            </div>
          </div>

          <!-- Step 2: 发布策略 -->
          <div v-show="currentStep === 1" class="step-panel">
            <div class="step-panel-header">
              <Zap :size="20" />
              <div class="header-content">
                <h3>配置发布策略</h3>
                <p>选择合适的发布策略和参数，控制流量切换的节奏</p>
              </div>
            </div>

            <div class="form-content">
              <!-- 发布类型选择 -->
              <ElFormItem label="发布类型" prop="analysisType">
                <div class="strategy-grid">
                  <div
                    v-for="strategy in strategyOptions"
                    :key="strategy.value"
                    class="strategy-card"
                    :class="{ active: formData.analysisType === strategy.value }"
                    @click="handleStrategyChange(strategy.value)"
                  >
                    <div class="strategy-icon" :style="{ background: strategy.color }">
                      <component :is="strategy.icon" :size="24" />
                    </div>
                    <div class="strategy-info">
                      <div class="strategy-title">{{ strategy.label }}</div>
                      <div class="strategy-desc">{{ strategy.description }}</div>
                      <div class="strategy-scene">
                        <Lightbulb :size="12" />
                        {{ strategy.scene }}
                      </div>
                    </div>
                  </div>
                </div>
              </ElFormItem>

              <!-- 金丝雀发布配置 -->
              <div v-if="formData.analysisType === 'canary'" class="strategy-params">
                <div class="params-title">
                  <TrendingUp :size="16" />
                  金丝雀发布参数
                </div>

                <ElRow :gutter="20">
                  <ElCol :span="8">
                    <ElFormItem label="最大权重" prop="maxWeight">
                      <ElInputNumber
                        v-model="formData.maxWeight"
                        :min="1"
                        :max="100"
                        style="width: 100%"
                      >
                        <template #suffix>%</template>
                      </ElInputNumber>
                      <template #label>
                        <span>最大权重</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              金丝雀版本可以达到的最大流量权重百分比<br />
                              达到此值后将完成全部发布<br />
                              <strong>推荐值：50-100</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="8">
                    <ElFormItem label="步进权重" prop="stepWeight">
                      <ElInputNumber
                        v-model="formData.stepWeight"
                        :min="1"
                        :max="100"
                        style="width: 100%"
                      >
                        <template #suffix>%</template>
                      </ElInputNumber>
                      <template #label>
                        <span>步进权重</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              每次迭代增加的流量权重百分比<br />
                              值越小发布越平滑但耗时越长<br />
                              <strong>推荐值：5-20</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="8">
                    <ElFormItem label="预计迭代次数">
                      <ElInputNumber
                        :model-value="Math.ceil(formData.maxWeight / formData.stepWeight)"
                        disabled
                        style="width: 100%"
                      />
                      <template #label>
                        <span>预计迭代次数</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              自动计算：maxWeight ÷ stepWeight<br />
                              这个值仅供参考，实际由 Flagger 根据权重动态计算<br />
                              <strong>注意：金丝雀模式不使用固定的 iterations 字段</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                </ElRow>

                <ElAlert type="success" :closable="false" show-icon>
                  <template #title>
                    <strong>金丝雀发布流程：</strong>
                    <div style="margin-top: 8px; font-weight: normal">
                      • 从 0% 开始，每次增加 {{ formData.stepWeight }}% 流量到新版本<br />
                      • 每次调整后等待 {{ formData.interval }}，检查指标是否正常<br />
                      • 最高到 {{ formData.maxWeight }}%，预计需要约
                      {{ Math.ceil(formData.maxWeight / formData.stepWeight) }} 次迭代<br />
                      • 如果指标异常连续 {{ formData.threshold }} 次，自动回滚<br />
                      • 整个流程最多 {{ formData.progressDeadline }} 秒，超时自动回滚
                    </div>
                  </template>
                </ElAlert>

                <ElAlert type="info" :closable="false" show-icon style="margin-top: 12px">
                  <template #title>
                    <strong>技术说明：</strong>金丝雀模式使用渐进式权重（maxWeight +
                    stepWeight），Flagger 会自动计算迭代次数，无需手动指定 iterations 字段
                  </template>
                </ElAlert>
              </div>

              <!-- 蓝绿发布配置 -->
              <div v-if="formData.analysisType === 'blue-green'" class="strategy-params">
                <div class="params-title">
                  <GitBranch :size="16" />
                  蓝绿发布参数
                </div>

                <ElFormItem label="验证迭代次数">
                  <ElInputNumber
                    v-model="formData.iterations"
                    :min="1"
                    :max="20"
                    style="width: 100%"
                  />
                  <template #label>
                    <span>验证迭代次数</span>
                    <ElTooltip placement="top">
                      <template #content>
                        <div style="max-width: 300px; line-height: 1.6">
                          蓝绿发布在切换前的验证次数<br />
                          每次验证间隔为 {{ formData.interval }}<br />
                          <strong>推荐值：5-10 次</strong>
                        </div>
                      </template>
                      <AlertCircle
                        :size="14"
                        style="color: #909399; cursor: help; margin-left: 4px"
                      />
                    </ElTooltip>
                  </template>
                </ElFormItem>

                <ElFormItem label="预发布验证">
                  <ElSwitch v-model="formData.preRelease" />
                  <ElTooltip placement="top">
                    <template #content>
                      <div style="max-width: 300px; line-height: 1.6">
                        启用后，会先创建一个预发布环境进行验证<br />
                        验证通过后再切换全部流量
                      </div>
                    </template>
                    <AlertCircle
                      :size="14"
                      style="color: #909399; cursor: help; margin-left: 8px"
                    />
                  </ElTooltip>
                </ElFormItem>

                <ElAlert type="info" :closable="false" show-icon>
                  <template #title>
                    <strong>蓝绿发布流程：</strong>
                    <div style="margin-top: 8px; font-weight: normal">
                      • 部署新版本（绿色），不接收任何生产流量<br />
                      • 执行 {{ formData.iterations }} 次健康检查和指标验证<br />
                      • 验证通过后，一次性将 100% 流量切换到新版本<br />
                      • 旧版本（蓝色）保持运行，可快速回滚<br />
                      • 如果验证失败，放弃新版本，流量保持在旧版本
                    </div>
                  </template>
                </ElAlert>

                <ElAlert type="warning" :closable="false" show-icon style="margin-top: 12px">
                  <template #title>
                    <strong>技术说明：</strong>蓝绿模式使用固定迭代次数（iterations），不使用
                    maxWeight/stepWeight，确保符合 Flagger 的 schema 验证
                  </template>
                </ElAlert>
              </div>

              <!-- A/B 测试配置 -->
              <div v-if="formData.analysisType === 'ab-testing'" class="strategy-params">
                <div class="params-title">
                  <TestTube :size="16" />
                  A/B 测试参数
                </div>

                <ElRow :gutter="20">
                  <ElCol :span="12">
                    <ElFormItem label="测试流量占比">
                      <ElSlider
                        v-model="formData.canaryWeight"
                        :min="1"
                        :max="50"
                        :step="1"
                        show-stops
                        :marks="{ 10: '10%', 25: '25%', 50: '50%' }"
                      />
                      <template #label>
                        <span>测试流量占比</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              分配给 B 版本（新版本）的流量比例<br />
                              剩余流量将发送给 A 版本（旧版本）<br />
                              <strong>注意：这个权重在整个测试期间保持固定</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="12">
                    <ElFormItem label="测试迭代次数">
                      <ElInputNumber
                        v-model="formData.iterations"
                        :min="1"
                        :max="100"
                        style="width: 100%"
                      />
                      <template #label>
                        <span>测试迭代次数</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              A/B 测试的总验证次数<br />
                              每次验证间隔为 {{ formData.interval }}<br />
                              <strong>推荐值：10-50 次，以收集足够数据</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                </ElRow>

                <ElAlert type="warning" :closable="false" show-icon>
                  <template #title>
                    <strong>A/B 测试流程：</strong>
                    <div style="margin-top: 8px; font-weight: normal">
                      • {{ formData.canaryWeight }}% 流量发送到 B 版本（新版本）<br />
                      • {{ 100 - formData.canaryWeight }}% 流量发送到 A 版本（旧版本）<br />
                      • 流量分配比例在测试期间保持固定（不递增）<br />
                      • 执行 {{ formData.iterations }} 次验证，每次间隔 {{ formData.interval
                      }}<br />
                      • 通常基于 HTTP Header 进行流量分割
                    </div>
                  </template>
                </ElAlert>

                <ElAlert type="info" :closable="false" show-icon style="margin-top: 12px">
                  <template #title>
                    <strong>技术说明：</strong>A/B 测试使用固定权重（maxWeight）+
                    迭代次数（iterations），权重不会递增，与金丝雀发布的渐进式权重不同
                  </template>
                </ElAlert>
              </div>

              <!-- 流量镜像配置 -->
              <div v-if="formData.analysisType === 'mirror'" class="strategy-params">
                <div class="params-title">
                  <Copy :size="16" />
                  流量镜像参数
                </div>

                <ElRow :gutter="20">
                  <ElCol :span="12">
                    <ElFormItem label="镜像流量占比">
                      <ElSlider
                        v-model="formData.mirrorWeight"
                        :min="0"
                        :max="100"
                        :step="10"
                        show-stops
                        :marks="{ 0: '0%', 50: '50%', 100: '100%' }"
                      />
                      <template #label>
                        <span>镜像流量占比</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              复制指定比例的生产流量到新版本<br />
                              不影响实际响应，用于观察新版本表现<br />
                              <strong>推荐从低比例开始，逐步增加</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="12">
                    <ElFormItem label="监控迭代次数">
                      <ElInputNumber
                        v-model="formData.iterations"
                        :min="1"
                        :max="100"
                        style="width: 100%"
                      />
                      <template #label>
                        <span>监控迭代次数</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              流量镜像期间的监控验证次数<br />
                              每次验证间隔为 {{ formData.interval }}<br />
                              <strong>推荐值：10-30 次，以充分测试</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                </ElRow>

                <ElAlert type="info" :closable="false" show-icon>
                  <template #title>
                    <strong>流量镜像流程：</strong>
                    <div style="margin-top: 8px; font-weight: normal">
                      • 复制 {{ formData.mirrorWeight }}% 的生产流量到新版本<br />
                      • 镜像流量不影响用户的实际响应（响应仍来自旧版本）<br />
                      • 新版本处理镜像请求，但响应被丢弃<br />
                      • 执行 {{ formData.iterations }} 次监控，每次间隔 {{ formData.interval
                      }}<br />
                      • 适合在生产环境中安全测试新版本
                    </div>
                  </template>
                </ElAlert>

                <ElAlert type="success" :closable="false" show-icon style="margin-top: 12px">
                  <template #title>
                    <strong>技术说明：</strong>流量镜像使用 mirror 模式 + iterations，Flagger
                    会复制流量但不影响用户响应，确保生产环境安全
                  </template>
                </ElAlert>
              </div>

              <!-- 通用配置 -->
              <div class="common-params">
                <ElDivider content-position="left">
                  <Clock :size="14" />
                  通用配置
                </ElDivider>

                <ElRow :gutter="20">
                  <ElCol :span="8">
                    <ElFormItem label="分析间隔" prop="interval">
                      <ElInput v-model="formData.interval" placeholder="1m">
                        <template #prepend>
                          <Clock :size="14" />
                        </template>
                      </ElInput>
                      <template #label>
                        <span>分析间隔</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              每次检查指标的时间间隔<br />
                              格式：30s, 1m, 5m, 1h<br />
                              <strong>推荐：1-5 分钟</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="8">
                    <ElFormItem label="失败阈值" prop="threshold">
                      <ElInputNumber
                        v-model="formData.threshold"
                        :min="1"
                        :max="10"
                        style="width: 100%"
                      />
                      <template #label>
                        <span>失败阈值</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              连续失败多少次指标检查后触发自动回滚<br />
                              <strong>推荐：3-5 次</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="8">
                    <ElFormItem label="进度截止时间" prop="progressDeadline">
                      <ElInputNumber
                        v-model="formData.progressDeadline"
                        :min="60"
                        :max="3600"
                        :step="60"
                        style="width: 100%"
                      >
                        <template #suffix>秒</template>
                      </ElInputNumber>
                      <template #label>
                        <span>进度截止时间</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              整个发布流程的最大允许时间<br />
                              超时将自动回滚<br />
                              <strong>推荐：600s (10分钟)</strong>
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                </ElRow>
              </div>
            </div>
          </div>

          <!-- Step 3: 服务网格配置 -->
          <div v-show="currentStep === 2" class="step-panel">
            <div class="step-panel-header">
              <Network :size="20" />
              <div class="header-content">
                <h3>配置服务网格</h3>
                <p>选择服务网格提供商并配置相关的 Service 和 Ingress 资源</p>
              </div>
            </div>

            <div class="form-content">
              <!-- Provider 选择 -->
              <ElFormItem label="网格提供商" prop="provider">
                <ElRadioGroup v-model="formData.provider" @change="handleProviderChange">
                  <ElRadioButton value="nginx">
                    <Server :size="14" />
                    Nginx Ingress
                  </ElRadioButton>
                  <ElRadioButton value="istio">
                    <Workflow :size="14" />
                    Istio
                  </ElRadioButton>
                </ElRadioGroup>
                <template #label>
                  <span>网格提供商</span>
                  <ElTooltip placement="top">
                    <template #content>
                      <div style="max-width: 300px; line-height: 1.6">
                        {{ providerDescription }}
                      </div>
                    </template>
                    <AlertCircle
                      :size="14"
                      style="color: #909399; cursor: help; margin-left: 4px"
                    />
                  </ElTooltip>
                </template>
              </ElFormItem>
              <!-- Ingress 配置 -->
              <ElFormItem label="Ingress" prop="ingressRef">
                <ElSelect
                  v-model="formData.ingressRef"
                  placeholder="请选择 Ingress（可选）"
                  clearable
                  filterable
                  style="width: 100%"
                  :loading="loadingIngress"
                  @focus="loadIngress"
                >
                  <template #empty>
                    <ElEmpty description="暂无 Ingress 资源" :image-size="60" />
                  </template>
                  <ElOption
                    v-for="ing in filteredIngress"
                    :key="ing.name"
                    :label="ing.name"
                    :value="ing.name"
                  >
                    <div class="ingress-option">
                      <span class="ingress-name">{{ ing.name }}</span>
                      <ElTag size="small" type="primary">{{ ing.ingressClass }}</ElTag>
                      <span class="ingress-hosts">{{ ing.hosts.join(', ') }}</span>
                    </div>
                  </ElOption>
                </ElSelect>
                <template #label>
                  <span>Ingress</span>
                  <ElTooltip placement="top">
                    <template #content>
                      <div style="max-width: 300px; line-height: 1.6">
                        如果使用 Ingress 进行流量管理<br />
                        请选择对应的 Ingress 资源（可选）
                      </div>
                    </template>
                    <AlertCircle
                      :size="14"
                      style="color: #909399; cursor: help; margin-left: 4px"
                    />
                  </ElTooltip>
                </template>
              </ElFormItem>
              <!-- Service 选择 -->
              <ElFormItem label="Service" prop="serviceRef">
                <ElSelect
                  v-model="formData.serviceRef"
                  placeholder="请选择 Service"
                  clearable
                  filterable
                  style="width: 100%"
                  :loading="loadingServices"
                  @change="handleServiceChange"
                  @focus="loadServices"
                >
                  <template #empty>
                    <ElEmpty description="暂无 Service 资源" :image-size="60" />
                  </template>
                  <ElOption
                    v-for="svc in filteredServices"
                    :key="svc.name"
                    :label="svc.name"
                    :value="svc.name"
                  >
                    <div class="service-option">
                      <span class="service-name">{{ svc.name }}</span>
                      <ElTag size="small" type="info">{{ svc.type }}</ElTag>
                      <span class="service-ports">{{ formatServicePorts(svc.ports) }}</span>
                    </div>
                  </ElOption>
                </ElSelect>
                <template #label>
                  <span>Service</span>
                  <ElTooltip placement="top">
                    <template #content>
                      <div style="max-width: 300px; line-height: 1.6">
                        选择要进行灰度发布的 Service 资源<br />
                        只显示当前版本的 Service
                      </div>
                    </template>
                    <AlertCircle
                      :size="14"
                      style="color: #909399; cursor: help; margin-left: 4px"
                    />
                  </ElTooltip>
                </template>
              </ElFormItem>

              <!-- Service 端口配置 -->
              <div v-if="selectedService" class="service-ports-config">
                <div class="config-title">
                  <Globe :size="16" />
                  Service 端口配置
                </div>

                <ElRow :gutter="20">
                  <ElCol :span="12">
                    <ElFormItem label="服务端口" prop="servicePort">
                      <ElInputNumber
                        v-model="formData.servicePort"
                        :min="1"
                        :max="65535"
                        placeholder="80"
                        style="width: 100%"
                      />
                      <template #label>
                        <span>服务端口</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              Service 对外暴露的端口号<br />
                              ClusterIP Port
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="12">
                    <ElFormItem label="目标端口" prop="targetPort">
                      <ElInput
                        v-model="formData.targetPort"
                        placeholder="8080 or http"
                        style="width: 100%"
                      />
                      <template #label>
                        <span>目标端口</span>
                        <ElTooltip placement="top">
                          <template #content>
                            <div style="max-width: 300px; line-height: 1.6">
                              容器内的端口号或端口名称<br />
                              Container Port or Name<br />
                              示例：8080 或 http
                            </div>
                          </template>
                          <AlertCircle
                            :size="14"
                            style="color: #909399; cursor: help; margin-left: 4px"
                          />
                        </ElTooltip>
                      </template>
                    </ElFormItem>
                  </ElCol>
                </ElRow>

                <!-- 端口预览 -->
                <div class="port-preview">
                  <div class="preview-flow">
                    <div class="flow-item">
                      <div class="flow-label">外部访问</div>
                      <div class="flow-value">Service:{{ formData.servicePort }}</div>
                    </div>
                    <ArrowRight :size="20" class="flow-arrow" />
                    <div class="flow-item">
                      <div class="flow-label">容器端口</div>
                      <div class="flow-value">Pod:{{ formData.targetPort }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Istio 特有配置 -->
              <div v-if="formData.provider === 'istio'" class="istio-config">
                <ElDivider content-position="left">
                  <Workflow :size="14" />
                  Istio 特有配置
                </ElDivider>

                <ElFormItem label="Gateway">
                  <ElSelect
                    v-model="formData.istioGateways"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    placeholder="输入或选择 Gateway"
                    style="width: 100%"
                  >
                    <ElOption v-for="gw in defaultGateways" :key="gw" :label="gw" :value="gw" />
                  </ElSelect>
                  <template #label>
                    <span>Gateway</span>
                    <ElTooltip placement="top">
                      <template #content>
                        <div style="max-width: 300px; line-height: 1.6">
                          Istio Gateway 资源列表<br />
                          格式：namespace/name<br />
                          示例：istio-system/public-gateway
                        </div>
                      </template>
                      <AlertCircle
                        :size="14"
                        style="color: #909399; cursor: help; margin-left: 4px"
                      />
                    </ElTooltip>
                  </template>
                </ElFormItem>

                <ElFormItem label="Hosts">
                  <ElSelect
                    v-model="formData.istioHosts"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    placeholder="输入域名"
                    style="width: 100%"
                  >
                    <ElOption label="* (所有域名)" value="*" />
                  </ElSelect>
                  <template #label>
                    <span>Hosts</span>
                    <ElTooltip placement="top">
                      <template #content>
                        <div style="max-width: 300px; line-height: 1.6">
                          允许访问的域名列表<br />
                          使用 * 表示所有域名<br />
                          示例：app.example.com
                        </div>
                      </template>
                      <AlertCircle
                        :size="14"
                        style="color: #909399; cursor: help; margin-left: 4px"
                      />
                    </ElTooltip>
                  </template>
                </ElFormItem>

                <ElFormItem label="CORS 配置">
                  <ElSwitch v-model="formData.istioCorsEnabled" />
                  <ElTooltip placement="top">
                    <template #content>
                      <div style="max-width: 300px; line-height: 1.6">
                        是否启用跨域资源共享（CORS）配置
                      </div>
                    </template>
                    <AlertCircle
                      :size="14"
                      style="color: #909399; cursor: help; margin-left: 8px"
                    />
                  </ElTooltip>
                </ElFormItem>

                <!-- HPA 配置（只在 Istio 下显示） -->
                <ElFormItem label="HPA（可选）">
                  <ElSelect
                    v-model="formData.hpaRef"
                    placeholder="HPA 接口开发中，暂不可用"
                    clearable
                    filterable
                    disabled
                    style="width: 100%"
                  >
                  </ElSelect>
                  <template #label>
                    <span>HPA（可选）</span>
                    <ElTooltip placement="top">
                      <template #content>
                        <div style="max-width: 300px; line-height: 1.6">
                          HorizontalPodAutoscaler 资源<br />
                          接口开发中，暂时不可用
                        </div>
                      </template>
                      <AlertCircle
                        :size="14"
                        style="color: #909399; cursor: help; margin-left: 4px"
                      />
                    </ElTooltip>
                  </template>
                </ElFormItem>
              </div>
            </div>
          </div>

          <!-- Step 4: 指标配置 -->
          <div v-show="currentStep === 3" class="step-panel">
            <div class="step-panel-header">
              <Activity :size="20" />
              <div class="header-content">
                <h3>配置性能指标</h3>
                <p>设置 SLO 指标以验证新版本的性能，指标异常时将自动回滚</p>
              </div>
            </div>

            <div class="form-content">
              <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
                <template #title>
                  Flagger 会在每次迭代时检查这些指标，如果指标不符合阈值要求，将自动回滚到稳定版本
                </template>
              </ElAlert>

              <!-- 内置指标 -->
              <div class="metrics-section">
                <div class="section-header">
                  <BarChart3 :size="18" />
                  <span>内置指标（Flagger Built-in）</span>
                  <ElButton type="primary" size="small" text :icon="Plus" @click="addBuiltinMetric">
                    添加内置指标
                  </ElButton>
                </div>

                <div v-if="builtinMetrics.length === 0" class="empty-metrics">
                  <BarChart3 :size="32" style="color: #c0c4cc" />
                  <p>暂无内置指标，点击"添加内置指标"开始配置</p>
                  <p class="empty-hint"
                    >内置指标基于服务网格提供商的标准指标，无需额外配置 Prometheus</p
                  >
                </div>

                <div
                  v-for="(metric, index) in builtinMetrics"
                  :key="`builtin-${index}`"
                  class="metric-card"
                >
                  <div class="metric-header">
                    <div class="metric-title">
                      <BarChart3 :size="14" />
                      {{ getMetricLabel(metric.name) }}
                    </div>
                    <ElButton
                      text
                      type="danger"
                      :icon="Trash2"
                      size="small"
                      @click="removeBuiltinMetric(index)"
                    />
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="指标类型" label-width="100px">
                        <ElSelect
                          v-model="metric.name"
                          style="width: 100%"
                          @change="handleMetricTypeChange(index)"
                        >
                          <ElOption
                            v-for="opt in builtinMetricOptions"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                          >
                            <div class="metric-type-option">
                              <span>{{ opt.label }}</span>
                              <span class="hint">{{ opt.hint }}</span>
                            </div>
                          </ElOption>
                        </ElSelect>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="检查间隔" label-width="100px">
                        <ElInput v-model="metric.interval" placeholder="1m">
                          <template #append>分钟</template>
                        </ElInput>
                      </ElFormItem>
                    </ElCol>
                  </ElRow>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem
                        :label="
                          metric.name === 'request-success-rate' ? '最小成功率 (%)' : '最小值'
                        "
                        label-width="100px"
                      >
                        <ElInputNumber
                          v-model="metric.thresholdMin"
                          :precision="metric.name === 'request-success-rate' ? 0 : 2"
                          :step="metric.name === 'request-success-rate' ? 1 : 0.1"
                          style="width: 100%"
                          :placeholder="metric.name === 'request-success-rate' ? '99' : '0'"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem
                        :label="metric.name === 'request-duration' ? '最大延迟 (ms)' : '最大值'"
                        label-width="100px"
                      >
                        <ElInputNumber
                          v-model="metric.thresholdMax"
                          :precision="metric.name === 'request-duration' ? 0 : 2"
                          :step="metric.name === 'request-duration' ? 10 : 1"
                          style="width: 100%"
                          :placeholder="metric.name === 'request-duration' ? '500' : ''"
                        />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>

                  <!-- 指标说明 -->
                  <div class="metric-description">
                    <Info :size="12" />
                    <span>{{ getMetricDescription(metric.name) }}</span>
                  </div>
                </div>
              </div>

              <!-- 自定义指标 -->
              <div class="metrics-section">
                <div class="section-header">
                  <Activity :size="18" />
                  <span>自定义指标模板（MetricTemplate）</span>
                  <ElButton type="primary" size="small" text :icon="Plus" @click="addCustomMetric">
                    添加自定义指标
                  </ElButton>
                </div>

                <div v-if="customMetrics.length === 0" class="empty-metrics">
                  <Activity :size="32" style="color: #c0c4cc" />
                  <p>暂无自定义指标，点击"添加自定义指标"使用 MetricTemplate</p>
                  <p class="empty-hint">自定义指标需要预先在集群中创建 MetricTemplate 资源</p>
                </div>

                <div
                  v-for="(metric, index) in customMetrics"
                  :key="`custom-${index}`"
                  class="metric-card"
                >
                  <div class="metric-header">
                    <div class="metric-title">
                      <Activity :size="14" />
                      自定义指标 {{ index + 1 }}
                    </div>
                    <ElButton
                      text
                      type="danger"
                      :icon="Trash2"
                      size="small"
                      @click="removeCustomMetric(index)"
                    />
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="指标模板" label-width="100px">
                        <ElSelect
                          v-model="metric.templateName"
                          placeholder="选择 MetricTemplate"
                          style="width: 100%"
                          :loading="loadingTemplates"
                          @change="handleTemplateChange(index, $event)"
                          @focus="loadMetricTemplates"
                        >
                          <template #empty>
                            <ElEmpty description="暂无可用的 MetricTemplate" :image-size="60" />
                          </template>
                          <ElOption
                            v-for="tpl in metricTemplates"
                            :key="`${tpl.namespace}-${tpl.name}`"
                            :label="tpl.name"
                            :value="tpl.name"
                          >
                            <div class="template-option">
                              <span>{{ tpl.name }}</span>
                              <ElTag size="small">{{ tpl.namespace }}</ElTag>
                            </div>
                          </ElOption>
                        </ElSelect>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="检查间隔" label-width="100px">
                        <ElInput v-model="metric.interval" placeholder="1m">
                          <template #append>分钟</template>
                        </ElInput>
                      </ElFormItem>
                    </ElCol>
                  </ElRow>

                  <!-- 模板变量 -->
                  <div
                    v-if="metric.templateVariables && metric.templateVariables.length > 0"
                    class="template-variables"
                  >
                    <ElDivider content-position="left">
                      <Settings :size="12" />
                      模板变量
                    </ElDivider>
                    <ElRow :gutter="16">
                      <ElCol
                        v-for="(variable, vIndex) in metric.templateVariables"
                        :key="`var-${index}-${vIndex}`"
                        :span="12"
                      >
                        <ElFormItem :label="variable.name" label-width="100px">
                          <ElInput
                            v-model="variable.value"
                            :placeholder="`请输入 ${variable.name}`"
                          />
                          <template #label>
                            <span>{{ variable.name }}</span>
                            <ElTooltip placement="top">
                              <template #content>
                                <div style="max-width: 300px; line-height: 1.6">
                                  模板变量：{{ variable.name }}<br />
                                  将在 MetricTemplate 的查询语句中替换<br />
                                  示例：direction: inbound/outbound
                                </div>
                              </template>
                              <AlertCircle
                                :size="14"
                                style="color: #909399; cursor: help; margin-left: 4px"
                              />
                            </ElTooltip>
                          </template>
                        </ElFormItem>
                      </ElCol>
                    </ElRow>
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="最小阈值" label-width="100px">
                        <ElInputNumber
                          v-model="metric.thresholdMin"
                          :precision="2"
                          :step="0.1"
                          style="width: 100%"
                          placeholder="例如：10"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="最大阈值" label-width="100px">
                        <ElInputNumber
                          v-model="metric.thresholdMax"
                          :precision="2"
                          :step="0.1"
                          style="width: 100%"
                          placeholder="例如：1000"
                        />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 5: Webhook 配置 -->
          <div v-show="currentStep === 4" class="step-panel">
            <div class="step-panel-header">
              <Webhook :size="20" />
              <div class="header-content">
                <h3>配置 Webhook 钩子（可选）</h3>
                <p>在发布流程的不同阶段触发自定义操作，例如负载测试、通知等</p>
              </div>
            </div>

            <div class="form-content">
              <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 20px">
                <template #title>
                  Webhook
                  允许你在发布流程的不同阶段执行自定义逻辑，例如运行集成测试、发送通知等。如果不需要可以跳过此步骤。
                </template>
              </ElAlert>

              <div class="webhooks-container">
                <div v-if="formData.webhooks.length === 0" class="empty-webhooks">
                  <Webhook :size="32" style="color: #c0c4cc" />
                  <p>暂无 Webhook 配置</p>
                  <p class="empty-hint">Webhook 是可选配置，如不需要可直接进入下一步</p>
                  <ElButton type="primary" :icon="Plus" @click="addWebhook">
                    添加 Webhook
                  </ElButton>
                </div>

                <div
                  v-for="(webhook, index) in formData.webhooks"
                  :key="`webhook-${index}`"
                  class="webhook-card"
                >
                  <div class="webhook-header">
                    <div class="webhook-title">
                      <Webhook :size="14" />
                      Webhook {{ index + 1 }}
                      <ElTag size="small" :type="getWebhookTypeInfo(webhook.type).tagType">
                        {{ getWebhookTypeLabel(webhook.type) }}
                      </ElTag>
                    </div>
                    <ElButton
                      text
                      type="danger"
                      :icon="Trash2"
                      size="small"
                      @click="removeWebhook(index)"
                    />
                  </div>

                  <ElRow :gutter="16">
                    <ElCol :span="12">
                      <ElFormItem label="名称" label-width="80px">
                        <ElInput v-model="webhook.name" placeholder="例如：load-test" />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="12">
                      <ElFormItem label="触发类型" label-width="80px">
                        <ElSelect v-model="webhook.type" style="width: 100%">
                          <ElOption
                            v-for="opt in webhookTypeOptions"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                          >
                            <div class="webhook-type-option">
                              <span>{{ opt.label }}</span>
                              <span class="hint">{{ opt.hint }}</span>
                            </div>
                          </ElOption>
                        </ElSelect>
                      </ElFormItem>
                    </ElCol>
                  </ElRow>

                  <ElFormItem label="URL" label-width="80px">
                    <ElInput
                      v-model="webhook.url"
                      placeholder="http://your-webhook-service.namespace.svc.cluster.local"
                    >
                      <template #prepend>
                        <Link :size="14" />
                      </template>
                    </ElInput>
                  </ElFormItem>

                  <ElRow :gutter="16">
                    <ElCol :span="8">
                      <ElFormItem label="超时时间" label-width="80px">
                        <ElInput v-model="webhook.timeout" placeholder="5s">
                          <template #append>秒</template>
                        </ElInput>
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="8">
                      <ElFormItem label="重试次数" label-width="80px">
                        <ElInputNumber
                          v-model="webhook.retries"
                          :min="0"
                          :max="5"
                          style="width: 100%"
                        />
                      </ElFormItem>
                    </ElCol>
                    <ElCol :span="8">
                      <ElFormItem label="失败中止" label-width="80px">
                        <ElSwitch v-model="webhook.muteAlert" />
                      </ElFormItem>
                    </ElCol>
                  </ElRow>

                  <!-- Webhook 类型说明 -->
                  <ElAlert
                    :type="getWebhookTypeInfo(webhook.type).type"
                    :closable="false"
                    show-icon
                  >
                    <template #title>
                      {{ getWebhookTypeInfo(webhook.type).description }}
                    </template>
                  </ElAlert>
                </div>

                <ElButton
                  v-if="formData.webhooks.length > 0"
                  type="primary"
                  plain
                  :icon="Plus"
                  @click="addWebhook"
                  style="width: 100%; margin-top: 12px"
                >
                  添加更多 Webhook
                </ElButton>
              </div>
            </div>
          </div>

          <!-- Step 6: 确认创建 -->
          <div v-show="currentStep === 5" class="step-panel">
            <div class="step-panel-header">
              <CheckCircle :size="20" />
              <div class="header-content">
                <h3>确认配置信息</h3>
                <p>请仔细核对以下配置，确认无误后点击"创建"按钮</p>
              </div>
            </div>

            <div class="summary-content">
              <!-- 基本信息卡片 -->
              <div class="summary-card">
                <div class="card-header">
                  <Box :size="16" />
                  <span>基本信息</span>
                </div>
                <div class="card-content">
                  <div class="summary-item">
                    <span class="label">Canary 名称：</span>
                    <ElTag type="success" size="large">{{ formData.name }}</ElTag>
                  </div>
                  <div class="summary-item">
                    <span class="label">目标资源：</span>
                    <ElTag type="primary">{{ targetResourceKind }}</ElTag>
                    <span class="value">{{ selectedVersion?.resourceName }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">命名空间：</span>
                    <ElTag type="warning">{{ targetNamespace }}</ElTag>
                  </div>
                  <div class="summary-item">
                    <span class="label">版本号：</span>
                    <ElTag type="success">v{{ selectedVersion?.version }}</ElTag>
                  </div>
                  <div class="summary-item">
                    <span class="label">API 版本：</span>
                    <span class="value">{{ targetApiVersion }}</span>
                  </div>
                </div>
              </div>

              <!-- 发布策略卡片 -->
              <div class="summary-card">
                <div class="card-header">
                  <Zap :size="16" />
                  <span>发布策略</span>
                </div>
                <div class="card-content">
                  <div class="strategy-summary">
                    <component
                      :is="getStrategyIcon(formData.analysisType)"
                      :size="24"
                      class="strategy-icon"
                      :style="{ color: getStrategyColor(formData.analysisType) }"
                    />
                    <div class="strategy-info">
                      <div class="strategy-name">
                        {{ getStrategyLabel(formData.analysisType) }}
                      </div>
                      <div class="strategy-detail">
                        <template v-if="formData.analysisType === 'canary'">
                          <div class="detail-item"><Check :size="14" /> 逐步增加新版本流量权重</div>
                          <div class="detail-item"
                            ><Check :size="14" /> 每次增加 {{ formData.stepWeight }}%，最高到
                            {{ formData.maxWeight }}%</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" /> 每 {{ formData.interval }} 检查一次指标</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" /> 预计约
                            {{ Math.ceil(formData.maxWeight / formData.stepWeight) }} 次迭代</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" /> 连续失败
                            {{ formData.threshold }} 次后自动回滚</div
                          >
                        </template>
                        <template v-else-if="formData.analysisType === 'blue-green'">
                          <div class="detail-item"><Check :size="14" /> 同时运行新旧两个版本</div>
                          <div class="detail-item"
                            ><Check :size="14" /> 执行 {{ formData.iterations }} 次验证</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" />
                            {{ formData.preRelease ? '启用预发布验证' : '不使用预发布验证' }}</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" /> 验证通过后一次性切换全部流量</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" /> 每 {{ formData.interval }} 检查一次指标</div
                          >
                        </template>
                        <template v-else-if="formData.analysisType === 'ab-testing'">
                          <div class="detail-item"
                            ><Check :size="14" /> 分配 {{ formData.canaryWeight }}%
                            流量到新版本</div
                          >
                          <div class="detail-item"><Check :size="14" /> 剩余流量保持在旧版本</div>
                          <div class="detail-item"
                            ><Check :size="14" /> 执行 {{ formData.iterations }} 次验证</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" /> 基于 HTTP Header 进行流量分割</div
                          >
                          <div class="detail-item"
                            ><Check :size="14" /> 每 {{ formData.interval }} 检查一次指标</div
                          >
                        </template>
                        <template v-else-if="formData.analysisType === 'mirror'">
                          <div class="detail-item"
                            ><Check :size="14" /> 镜像 {{ formData.mirrorWeight }}%
                            的生产流量到新版本</div
                          >
                          <div class="detail-item"><Check :size="14" /> 不影响用户实际请求</div>
                          <div class="detail-item"
                            ><Check :size="14" /> 执行 {{ formData.iterations }} 次监控</div
                          >
                          <div class="detail-item"><Check :size="14" /> 用于观察新版本表现</div>
                          <div class="detail-item"
                            ><Check :size="14" /> 每 {{ formData.interval }} 检查一次指标</div
                          >
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 服务网格卡片 -->
              <div class="summary-card">
                <div class="card-header">
                  <Network :size="16" />
                  <span>服务网格配置</span>
                </div>
                <div class="card-content">
                  <div class="summary-item">
                    <span class="label">网格提供商：</span>
                    <ElTag :type="formData.provider === 'istio' ? 'primary' : 'success'">
                      {{ formData.provider === 'istio' ? 'Istio' : 'Nginx Ingress' }}
                    </ElTag>
                  </div>
                  <div class="summary-item">
                    <span class="label">Service：</span>
                    <span class="value">{{ formData.serviceRef || '-' }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">服务端口：</span>
                    <ElTag size="small">{{ formData.servicePort }}</ElTag>
                    <ArrowRight :size="14" style="margin: 0 8px" />
                    <ElTag size="small">{{ formData.targetPort }}</ElTag>
                  </div>
                  <div class="summary-item">
                    <span class="label">Ingress：</span>
                    <span class="value">{{ formData.ingressRef || '未配置' }}</span>
                  </div>
                  <div
                    v-if="formData.provider === 'istio' && formData.istioGateways.length > 0"
                    class="summary-item"
                  >
                    <span class="label">Gateway：</span>
                    <div class="tags-group">
                      <ElTag v-for="gw in formData.istioGateways" :key="gw" size="small">{{
                        gw
                      }}</ElTag>
                    </div>
                  </div>
                  <div
                    v-if="formData.provider === 'istio' && formData.istioHosts.length > 0"
                    class="summary-item"
                  >
                    <span class="label">Hosts：</span>
                    <div class="tags-group">
                      <ElTag v-for="host in formData.istioHosts" :key="host" size="small">{{
                        host
                      }}</ElTag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 指标配置卡片 -->
              <div class="summary-card">
                <div class="card-header">
                  <Activity :size="16" />
                  <span>指标配置</span>
                </div>
                <div class="card-content">
                  <div
                    v-if="builtinMetrics.length === 0 && customMetrics.length === 0"
                    class="empty-summary"
                  >
                    <AlertTriangle :size="16" style="color: #e6a23c" />
                    <span>未配置任何指标（建议至少配置一个指标以确保发布质量）</span>
                  </div>

                  <div v-if="builtinMetrics.length > 0">
                    <div class="subsection-title">内置指标 ({{ builtinMetrics.length }})</div>
                    <div
                      v-for="(metric, index) in builtinMetrics"
                      :key="`summary-builtin-${index}`"
                      class="metric-summary"
                    >
                      <BarChart3 :size="14" />
                      <span class="metric-name">{{ getMetricLabel(metric.name) }}</span>
                      <span class="metric-detail">
                        间隔: {{ metric.interval }}
                        {{ metric.thresholdMin !== null ? `, 最小: ${metric.thresholdMin}` : '' }}
                        {{ metric.thresholdMax !== null ? `, 最大: ${metric.thresholdMax}` : '' }}
                      </span>
                    </div>
                  </div>

                  <div v-if="customMetrics.length > 0">
                    <div class="subsection-title">自定义指标 ({{ customMetrics.length }})</div>
                    <div
                      v-for="(metric, index) in customMetrics"
                      :key="`summary-custom-${index}`"
                      class="metric-summary"
                    >
                      <Activity :size="14" />
                      <span class="metric-name">{{ metric.templateName }}</span>
                      <ElTag size="small">{{ metric.templateNamespace }}</ElTag>
                      <span class="metric-detail">
                        间隔: {{ metric.interval }}, 阈值: {{ metric.thresholdMin }} ~
                        {{ metric.thresholdMax }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Webhook 配置卡片 -->
              <div v-if="formData.webhooks.length > 0" class="summary-card">
                <div class="card-header">
                  <Webhook :size="16" />
                  <span>Webhook 配置</span>
                </div>
                <div class="card-content">
                  <div
                    v-for="(webhook, index) in formData.webhooks"
                    :key="`summary-webhook-${index}`"
                    class="webhook-summary"
                  >
                    <Webhook :size="14" />
                    <span class="webhook-name">{{ webhook.name }}</span>
                    <ElTag size="small" :type="getWebhookTypeInfo(webhook.type).tagType">
                      {{ getWebhookTypeLabel(webhook.type) }}
                    </ElTag>
                    <span class="webhook-url">{{ webhook.url }}</span>
                  </div>
                </div>
              </div>

              <!-- 最终确认 -->
              <ElAlert type="success" :closable="false" show-icon class="final-confirm">
                <template #title>
                  <div style="font-size: 14px; line-height: 2">
                    <strong>✓ 配置检查完成，准备创建 Canary 发布</strong><br />
                    系统将创建 Flagger Canary 资源来管理
                    <strong>{{ selectedVersion?.resourceName }}</strong> 的灰度发布流程。<br />
                    Canary 资源将被创建在 <strong>{{ targetNamespace }}</strong> 命名空间中。
                  </div>
                </template>
              </ElAlert>
            </div>
          </div>
        </ElForm>
      </div>

      <!-- 步骤导航按钮 -->
      <div class="step-actions">
        <ElButton v-if="currentStep > 0" @click="prevStep" :icon="ChevronLeft"> 上一步 </ElButton>
        <div style="flex: 1"></div>
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton v-if="currentStep < 5" type="primary" @click="nextStep">
          下一步
          <ChevronRight :size="14" style="margin-left: 4px" />
        </ElButton>
        <ElButton
          v-if="currentStep === 5"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          <Check :size="14" style="margin-right: 4px" />
          {{ mode === 'create' ? '创建 Canary' : '更新 Canary' }}
        </ElButton>
      </div>
    </div>

    <!-- YAML 模式 -->
    <div v-show="editMode === 'yaml'" class="yaml-content">
      <YamlEditor
        v-model="yamlContent"
        height="calc(100vh - 250px)"
        :readonly="false"
        :show-toolbar="true"
        :show-line-numbers="true"
        :show-status-bar="true"
        filename="canary.yaml"
      />

      <div class="yaml-actions">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmitYaml">
          <Check :size="14" style="margin-right: 4px" />
          {{ mode === 'create' ? '创建' : '更新' }}
        </ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import * as yaml from 'js-yaml'
  import {
    Plus,
    Settings,
    Trash2,
    Network,
    Globe,
    Activity,
    Zap,
    TrendingUp,
    GitBranch,
    TestTube,
    Copy,
    Workflow,
    Server,
    BarChart3,
    Webhook,
    FileCode,
    Box,
    Eye,
    Info,
    Clock,
    Link,
    Lightbulb,
    CheckCircle,
    Check,
    ChevronLeft,
    ChevronRight,
    Tag,
    ArrowRight,
    AlertTriangle,
    AlertCircle
  } from 'lucide-vue-next'
  import YamlEditor from '@/components/yaml-editor-pro/index.vue'
  import {
    createCanaryApi,
    updateCanaryApi,
    getCanaryYamlApi,
    searchVersionApi,
    getApplicationServiceListApi,
    getApplicationIngressListApi,
    getMetricTemplateListApi,
    type OnecProjectVersion,
    type OnecProjectApplication,
    type ProjectWorkspace,
    type ApplicationServiceListResponse,
    type IngressListItem
  } from '@/api'

  interface MetricTemplate {
    name: string
    namespace: string
    variables?: string[]
  }

  interface Props {
    modelValue: boolean
    mode: 'create' | 'edit'
    canaryName?: string
    application: OnecProjectApplication
    workspace: ProjectWorkspace | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue', 'success'])

  // 状态管理
  const currentStep = ref(0)
  const editMode = ref<'form' | 'yaml'>('form')
  const submitting = ref(false)
  const formRef = ref<FormInstance>()
  const yamlContent = ref('')

  // 数据加载状态
  const loadingServices = ref(false)
  const loadingIngress = ref(false)
  const loadingTemplates = ref(false)

  // 数据列表
  const versions = ref<OnecProjectVersion[]>([])
  const services = ref<ApplicationServiceListResponse[]>([])
  const ingressList = ref<IngressListItem[]>([])
  const metricTemplates = ref<MetricTemplate[]>([])

  // 表单数据
  interface MetricConfig {
    name: string
    interval: string
    thresholdMin: number | null
    thresholdMax: number | null
  }

  interface CustomMetricConfig {
    templateName: string
    templateNamespace: string
    interval: string
    thresholdMin: number | null
    thresholdMax: number | null
    templateVariables: Array<{ name: string; value: string }>
  }

  interface WebhookConfig {
    name: string
    type: string
    url: string
    timeout: string
    retries: number
    muteAlert: boolean
  }

  const formData = ref({
    // Step 1: 版本信息
    name: '',
    versionId: null as number | null,

    // Step 2: 发布策略
    analysisType: 'canary' as 'canary' | 'blue-green' | 'ab-testing' | 'mirror',
    maxWeight: 50,
    stepWeight: 10,
    iterations: 10,
    preRelease: false,
    canaryWeight: 25,
    mirrorWeight: 100,
    interval: '1m',
    threshold: 5,
    progressDeadline: 600,

    // Step 3: 服务网格 - 默认 nginx
    provider: 'nginx' as 'istio' | 'nginx',
    serviceRef: '',
    servicePort: 80,
    targetPort: '8080', // 🔥 保持为 string 类型，支持端口名称如 "http"
    ingressRef: '',
    hpaRef: '',
    istioGateways: [] as string[],
    istioHosts: ['*'] as string[],
    istioCorsEnabled: false,

    // Step 5: Webhook
    webhooks: [] as WebhookConfig[]
  })

  // Step 4: 指标（分开存储）
  const builtinMetrics = ref<MetricConfig[]>([])
  const customMetrics = ref<CustomMetricConfig[]>([])

  // 表单验证规则
  const formRules: FormRules = {
    name: [
      { required: true, message: '请输入 Canary 名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        message: '必须是有效的 DNS 子域名（小写字母、数字和连字符）',
        trigger: 'blur'
      }
    ],
    versionId: [{ required: true, message: '请选择版本', trigger: 'change' }],
    maxWeight: [{ required: true, message: '请设置最大权重', trigger: 'blur' }],
    stepWeight: [{ required: true, message: '请设置步进权重', trigger: 'blur' }],
    serviceRef: [{ required: true, message: '请选择 Service', trigger: 'change' }],
    servicePort: [{ required: true, message: '请输入服务端口', trigger: 'blur' }],
    targetPort: [{ required: true, message: '请输入目标端口', trigger: 'blur' }]
  }

  // 计算属性
  const dialogTitle = computed(() => {
    return props.mode === 'create' ? '创建 Canary 发布' : '编辑 Canary 发布'
  })

  // 只显示 stable 版本
  const stableVersions = computed(() => {
    return versions.value.filter((v) => {
      // 如果版本有 versionRole 字段，只显示 stable 版本
      if (v.versionRole) {
        return v.versionRole === 'stable'
      }
      // 如果没有 versionRole 字段，显示所有版本（临时兼容）
      return true
    })
  })

  const selectedVersion = computed(() => {
    return versions.value.find((v) => v.id === formData.value.versionId)
  })

  // 从 application 的 resourceType 获取 kind（固定不可修改）
  const targetResourceKind = computed(() => {
    // kind 从 application 获取，不是从 version
    return normalizeResourceType(props.application.resourceType)
  })

  // 从 workspace 获取 namespace（固定不可修改）
  const targetNamespace = computed(() => {
    return props.workspace?.namespace || 'default'
  })

  const targetApiVersion = computed(() => {
    const kind = targetResourceKind.value
    if (['Deployment', 'DaemonSet', 'StatefulSet'].includes(kind)) {
      return 'apps/v1'
    }
    return 'v1'
  })

  const selectedService = computed(() => {
    return services.value.find((s) => s.name === formData.value.serviceRef)
  })

  // 只显示当前版本的 Service
  const filteredServices = computed(() => {
    if (!selectedVersion.value) return []
    return services.value.filter((s) => s.version === selectedVersion.value?.id || s.version === 0)
  })

  // 只显示当前版本的 Ingress
  const filteredIngress = computed(() => {
    if (!selectedVersion.value) return []
    return ingressList.value
  })

  const providerDescription = computed(() => {
    return formData.value.provider === 'istio'
      ? 'Istio 提供丰富的流量管理能力，支持 Gateway、VirtualService 等高级特性'
      : 'Nginx Ingress 提供简单高效的流量控制，基于 Ingress 资源'
  })

  // 默认 Gateway 选项
  const defaultGateways = ['istio-system/public-gateway', 'istio-system/private-gateway']

  // 发布策略选项
  const strategyOptions = [
    {
      value: 'canary',
      label: '金丝雀发布',
      icon: TrendingUp,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: '逐步增加新版本流量权重，平滑切换',
      scene: '适用于大多数场景，风险最低'
    },
    {
      value: 'blue-green',
      label: '蓝绿发布',
      icon: GitBranch,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: '同时运行两个版本，一次性切换',
      scene: '适用于需要快速回滚的场景'
    },
    {
      value: 'ab-testing',
      label: 'A/B 测试',
      icon: TestTube,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: '按比例分配流量，对比效果',
      scene: '适用于功能对比和效果验证'
    },
    {
      value: 'mirror',
      label: '流量镜像',
      icon: Copy,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: '复制生产流量，不影响响应',
      scene: '适用于性能测试和问题排查'
    }
  ]

  // 内置指标选项
  const builtinMetricOptions = [
    {
      value: 'request-success-rate',
      label: '请求成功率',
      hint: '非 5xx 响应的百分比'
    },
    {
      value: 'request-duration',
      label: '请求延迟',
      hint: 'P99 响应时间（毫秒）'
    }
  ]

  // Webhook 类型选项
  const webhookTypeOptions = [
    {
      value: 'pre-rollout',
      label: '预发布检查',
      hint: '发布开始前执行'
    },
    {
      value: 'rollout',
      label: '发布中',
      hint: '每次迭代时执行'
    },
    {
      value: 'confirm-rollout',
      label: '确认发布',
      hint: '需要手动确认'
    },
    {
      value: 'post-rollout',
      label: '发布后',
      hint: '发布成功后执行'
    },
    {
      value: 'rollback',
      label: '回滚',
      hint: '发布失败时执行'
    }
  ]

  // 工具函数
  const normalizeResourceType = (type: string): string => {
    const typeMap: Record<string, string> = {
      deployment: 'Deployment',
      daemonset: 'DaemonSet',
      statefulset: 'StatefulSet'
    }
    return typeMap[type?.toLowerCase()] || type
  }

  const formatServicePorts = (ports: string): string => {
    const firstPort = ports.split(',')[0]
    return firstPort || ports
  }

  const getStrategyIcon = (type: string) => {
    const strategy = strategyOptions.find((s) => s.value === type)
    return strategy?.icon || TrendingUp
  }

  const getStrategyColor = (type: string) => {
    const strategy = strategyOptions.find((s) => s.value === type)
    return strategy?.color?.replace('linear-gradient(135deg, ', '').split(' ')[0] || '#667eea'
  }

  const getStrategyLabel = (type: string): string => {
    const strategy = strategyOptions.find((s) => s.value === type)
    return strategy?.label || type
  }

  const getMetricLabel = (name: string): string => {
    const opt = builtinMetricOptions.find((o) => o.value === name)
    return opt?.label || name
  }

  const getMetricDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      'request-success-rate': '监控非 5xx HTTP 状态码的请求占比，低于阈值时将触发回滚',
      'request-duration': '监控 P99 请求响应时间，超过阈值时将触发回滚'
    }
    return descriptions[name] || ''
  }

  const getWebhookTypeLabel = (type: string): string => {
    const opt = webhookTypeOptions.find((o) => o.value === type)
    return opt?.label || type
  }

  const getWebhookTypeInfo = (type: string) => {
    const infoMap: Record<string, { description: string; type: string; tagType: string }> = {
      'pre-rollout': {
        description: '在发布开始前执行，用于准备工作或前置检查，例如预热缓存、检查依赖服务等',
        type: 'info',
        tagType: 'info'
      },
      rollout: {
        description: '在每次流量权重调整时执行，例如运行负载测试、收集指标等',
        type: 'primary',
        tagType: ''
      },
      'confirm-rollout': {
        description: '需要手动确认才能继续发布流程，用于人工审批或验证，确认后发布才会继续',
        type: 'warning',
        tagType: 'warning'
      },
      'post-rollout': {
        description: '在发布成功完成后执行，例如发送成功通知、更新文档等',
        type: 'success',
        tagType: 'success'
      },
      rollback: {
        description: '在发布失败自动回滚时执行，例如发送告警通知、记录回滚原因等',
        type: 'danger',
        tagType: 'danger'
      }
    }
    return infoMap[type] || { description: '', type: 'info', tagType: 'info' }
  }

  // 数据加载
  const loadVersions = async () => {
    try {
      const result = await searchVersionApi({
        applicationId: props.application.id
      })
      versions.value = result || []
    } catch (error) {
      console.error('加载版本列表失败:', error)
    }
  }

  const loadServices = async () => {
    if (!props.workspace?.id) return

    loadingServices.value = true
    try {
      const result = await getApplicationServiceListApi({
        workloadId: props.workspace.id,
        applicationId: props.application.id
      })
      services.value = result || []
    } catch (error) {
      console.error('加载 Service 列表失败:', error)
    } finally {
      loadingServices.value = false
    }
  }

  const loadIngress = async () => {
    if (!props.workspace?.id) return

    loadingIngress.value = true
    try {
      const result = await getApplicationIngressListApi({
        workloadId: props.workspace.id,
        applicationId: props.application.id
      })
      ingressList.value = result || []
    } catch (error) {
      console.error('加载 Ingress 列表失败:', error)
    } finally {
      loadingIngress.value = false
    }
  }

  const loadMetricTemplates = async () => {
    if (!props.workspace) return

    loadingTemplates.value = true
    try {
      const result = await getMetricTemplateListApi({
        workloadId: props.workspace.id,
        provider: formData.value.provider
      })
      metricTemplates.value = result || []
    } catch (error) {
      console.error('加载指标模板失败:', error)
      metricTemplates.value = []
    } finally {
      loadingTemplates.value = false
    }
  }

  // 事件处理
  const handleVersionChange = (versionId: number) => {
    const version = versions.value.find((v) => v.id === versionId)
    if (version && !formData.value.name) {
      formData.value.name = `${version.resourceName}-canary`
    }
  }

  const handleStrategyChange = (strategy: string) => {
    formData.value.analysisType = strategy as any
  }

  const handleProviderChange = () => {
    formData.value.istioGateways = []
    formData.value.istioHosts = ['*']
    formData.value.istioCorsEnabled = false
    loadMetricTemplates()
  }

  const handleServiceChange = (serviceName: string) => {
    const service = services.value.find((s) => s.name === serviceName)
    if (service && service.ports) {
      const firstPort = service.ports.split(',')[0].trim()
      const portMatch = firstPort.match(/(\d+):(\d+)/)
      if (portMatch) {
        formData.value.servicePort = parseInt(portMatch[1])
        formData.value.targetPort = portMatch[2] // 🔥 保持为字符串
      } else {
        const simpleMatch = firstPort.match(/(\d+)/)
        if (simpleMatch) {
          formData.value.servicePort = parseInt(simpleMatch[1])
          formData.value.targetPort = simpleMatch[1] // 🔥 保持为字符串
        }
      }
    }
  }

  const handleTemplateChange = (index: number, templateName: string) => {
    const template = metricTemplates.value.find((t) => t.name === templateName)
    if (template) {
      customMetrics.value[index].templateNamespace = template.namespace
      customMetrics.value[index].templateVariables = (template.variables || []).map((v) => ({
        name: v,
        value: ''
      }))
    }
  }

  const handleMetricTypeChange = (index: number) => {
    const metric = builtinMetrics.value[index]
    if (metric.name === 'request-success-rate') {
      metric.thresholdMin = 99
      metric.thresholdMax = null
    } else if (metric.name === 'request-duration') {
      metric.thresholdMin = null
      metric.thresholdMax = 500
    }
  }

  // 指标管理
  const addBuiltinMetric = () => {
    builtinMetrics.value.push({
      name: 'request-success-rate',
      interval: '1m',
      thresholdMin: 99,
      thresholdMax: null
    })
  }

  const removeBuiltinMetric = (index: number) => {
    builtinMetrics.value.splice(index, 1)
  }

  const addCustomMetric = () => {
    customMetrics.value.push({
      templateName: '',
      templateNamespace: '',
      interval: '1m',
      thresholdMin: null,
      thresholdMax: null,
      templateVariables: []
    })
  }

  const removeCustomMetric = (index: number) => {
    customMetrics.value.splice(index, 1)
  }

  // Webhook 管理
  const addWebhook = () => {
    formData.value.webhooks.push({
      name: '',
      type: 'rollout',
      url: '',
      timeout: '5s',
      retries: 1,
      muteAlert: false
    })
  }

  const removeWebhook = (index: number) => {
    formData.value.webhooks.splice(index, 1)
  }

  // 步骤切换
  const handleStepChange = (step: number) => {
    currentStep.value = step
  }

  // 步骤导航
  const nextStep = async () => {
    if (currentStep.value === 0) {
      if (!formData.value.name) {
        return
      }
      if (!formData.value.versionId) {
        return
      }
    }

    if (currentStep.value === 2) {
      if (!formData.value.serviceRef) {
        return
      }
      if (!formData.value.servicePort) {
        return
      }
      if (!formData.value.targetPort) {
        return
      }
    }

    if (currentStep.value < 5) {
      currentStep.value++
    }
  }

  const prevStep = () => {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  // ===========================================
  // 🔥 修复：targetPort 类型处理
  // ===========================================

  /**
   * 将 targetPort 转换为正确的类型用于 YAML 生成
   * - 如果是纯数字字符串（如 "8080"），转为数字类型
   * - 如果包含非数字字符（如 "http"），保持字符串类型
   */
  const normalizeTargetPort = (targetPort: string): number | string => {
    // 检查是否为纯数字字符串
    if (/^\d+$/.test(targetPort)) {
      return parseInt(targetPort, 10)
    }
    // 否则保持为字符串（端口名称如 "http", "grpc" 等）
    return targetPort
  }

  // 表单转 YAML - 修复 oneOf 验证错误
  const formToYaml = () => {
    if (!selectedVersion.value) {
      return
    }

    const canary: any = {
      apiVersion: 'flagger.app/v1beta1',
      kind: 'Canary',
      metadata: {
        name: formData.value.name,
        namespace: targetNamespace.value
      },
      spec: {
        targetRef: {
          apiVersion: targetApiVersion.value,
          kind: targetResourceKind.value,
          name: selectedVersion.value.resourceName
        },
        progressDeadlineSeconds: formData.value.progressDeadline,
        service: {
          port: formData.value.servicePort,
          // 🔥 修复：正确处理 targetPort 类型
          targetPort: normalizeTargetPort(formData.value.targetPort)
        },
        analysis: {
          interval: formData.value.interval,
          threshold: formData.value.threshold
        }
      }
    }

    // ==========================================
    // 🔥 关键修复：根据发布策略选择正确的 analysis 配置
    // ==========================================

    if (formData.value.analysisType === 'canary') {
      // 金丝雀发布：使用渐进式权重模式
      // ✅ 只使用 maxWeight + stepWeight，不使用 iterations
      canary.spec.analysis.maxWeight = formData.value.maxWeight
      canary.spec.analysis.stepWeight = formData.value.stepWeight
      // ❌ 不要添加 iterations，这会导致 oneOf 冲突
    } else if (formData.value.analysisType === 'blue-green') {
      // 蓝绿发布：使用迭代模式
      // ✅ 只使用 iterations，不使用 maxWeight/stepWeight
      canary.spec.analysis.iterations = 10 // 固定值，蓝绿通常只需要 1-2 次验证
      canary.spec.analysis.mirror = false
      // ❌ 不要添加 maxWeight 和 stepWeight
    } else if (formData.value.analysisType === 'ab-testing') {
      // A/B 测试：使用固定权重 + 迭代模式
      // ✅ 使用 iterations + 固定的 maxWeight
      canary.spec.analysis.iterations = formData.value.iterations || 10
      canary.spec.analysis.maxWeight = formData.value.canaryWeight // 固定权重，不递增
      // ❌ 不要使用 stepWeight（A/B 测试权重不变）
    } else if (formData.value.analysisType === 'mirror') {
      // 流量镜像：使用镜像模式
      // ✅ 使用 mirror + iterations
      canary.spec.analysis.iterations = formData.value.iterations || 10
      canary.spec.analysis.mirror = true
      canary.spec.analysis.mirrorWeight = formData.value.mirrorWeight
      // ❌ 不要使用 maxWeight/stepWeight
    }

    // Provider 配置
    if (formData.value.provider === 'nginx') {
      canary.spec.provider = 'nginx'
    }

    // Ingress 配置
    if (formData.value.ingressRef) {
      canary.spec.ingressRef = {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'Ingress',
        name: formData.value.ingressRef
      }
    }

    // Istio 配置
    if (formData.value.provider === 'istio') {
      if (formData.value.istioGateways.length > 0) {
        canary.spec.service.gateways = formData.value.istioGateways
      }
      if (formData.value.istioHosts.length > 0) {
        canary.spec.service.hosts = formData.value.istioHosts
      }
      if (formData.value.istioCorsEnabled) {
        canary.spec.service.corsPolicy = {
          allowOrigins: [{ exact: '*' }],
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowHeaders: ['*']
        }
      }
    }

    // HPA 配置
    if (formData.value.hpaRef) {
      canary.spec.autoscalerRef = {
        apiVersion: 'autoscaling/v2',
        kind: 'HorizontalPodAutoscaler',
        name: formData.value.hpaRef
      }
    }

    // 指标配置
    const allMetrics = []

    // 内置指标
    for (const metric of builtinMetrics.value) {
      const metricConfig: any = {
        name: metric.name,
        interval: metric.interval
      }
      if (metric.thresholdMin !== null || metric.thresholdMax !== null) {
        metricConfig.thresholdRange = {}
        if (metric.thresholdMin !== null) metricConfig.thresholdRange.min = metric.thresholdMin
        if (metric.thresholdMax !== null) metricConfig.thresholdRange.max = metric.thresholdMax
      }
      allMetrics.push(metricConfig)
    }

    // 自定义指标
    for (const metric of customMetrics.value) {
      if (!metric.templateName) continue
      const metricConfig: any = {
        name: metric.templateName,
        templateRef: {
          name: metric.templateName,
          namespace: metric.templateNamespace
        },
        interval: metric.interval
      }
      if (metric.thresholdMin !== null || metric.thresholdMax !== null) {
        metricConfig.thresholdRange = {}
        if (metric.thresholdMin !== null) metricConfig.thresholdRange.min = metric.thresholdMin
        if (metric.thresholdMax !== null) metricConfig.thresholdRange.max = metric.thresholdMax
      }
      if (metric.templateVariables.length > 0) {
        metricConfig.templateVariables = {}
        metric.templateVariables.forEach((v) => {
          if (v.value) {
            metricConfig.templateVariables[v.name] = v.value
          }
        })
      }
      allMetrics.push(metricConfig)
    }

    if (allMetrics.length > 0) {
      canary.spec.analysis.metrics = allMetrics
    }

    // Webhooks
    if (formData.value.webhooks.length > 0) {
      canary.spec.analysis.webhooks = formData.value.webhooks.map((w) => {
        const webhook: any = {
          name: w.name,
          type: w.type,
          url: w.url,
          timeout: w.timeout
        }
        if (w.retries > 0) {
          webhook.metadata = { retries: w.retries.toString() }
        }
        if (w.muteAlert) {
          webhook.muteAlert = true
        }
        return webhook
      })
    }

    yamlContent.value = yaml.dump(canary, { indent: 2, lineWidth: -1 })
  }

  // YAML 转表单 - 正确识别不同的 analysis 模式
  const yamlToForm = () => {
    try {
      const canary = yaml.load(yamlContent.value) as any

      if (!canary || canary.kind !== 'Canary') {
        return false
      }

      // 基本信息
      formData.value.name = canary.metadata?.name || ''

      // 查找匹配的版本
      const targetName = canary.spec?.targetRef?.name
      if (targetName) {
        const version = versions.value.find((v) => v.resourceName === targetName)
        if (version) {
          formData.value.versionId = version.id
        }
      }

      // 通用配置
      formData.value.progressDeadline = canary.spec?.progressDeadlineSeconds || 600
      formData.value.servicePort = canary.spec?.service?.port || 80
      // 🔥 修复：确保 targetPort 转为字符串
      formData.value.targetPort = String(canary.spec?.service?.targetPort || '8080')
      formData.value.interval = canary.spec?.analysis?.interval || '1m'
      formData.value.threshold = canary.spec?.analysis?.threshold || 5

      // ==========================================
      // 🔥 关键修复：识别不同的 analysis 模式
      // ==========================================

      const analysis = canary.spec?.analysis || {}

      // 判断发布策略
      if (analysis.mirror === true) {
        // 流量镜像模式
        formData.value.analysisType = 'mirror'
        formData.value.mirrorWeight = analysis.mirrorWeight || 100
        formData.value.iterations = analysis.iterations || 10
      } else if (analysis.maxWeight && analysis.stepWeight && !analysis.iterations) {
        // 金丝雀发布：有 maxWeight + stepWeight，但没有 iterations
        formData.value.analysisType = 'canary'
        formData.value.maxWeight = analysis.maxWeight
        formData.value.stepWeight = analysis.stepWeight
        formData.value.iterations = Math.ceil(analysis.maxWeight / analysis.stepWeight)
      } else if (analysis.maxWeight && analysis.iterations && !analysis.stepWeight) {
        // A/B 测试：有 maxWeight（固定权重）+ iterations，但没有 stepWeight
        formData.value.analysisType = 'ab-testing'
        formData.value.canaryWeight = analysis.maxWeight
        formData.value.iterations = analysis.iterations
      } else if (analysis.iterations && !analysis.maxWeight && !analysis.stepWeight) {
        // 蓝绿发布：只有 iterations，没有权重配置
        formData.value.analysisType = 'blue-green'
        formData.value.iterations = analysis.iterations
        formData.value.preRelease = false // 可以根据其他字段判断
      } else {
        // 默认为金丝雀
        formData.value.analysisType = 'canary'
        formData.value.maxWeight = analysis.maxWeight || 50
        formData.value.stepWeight = analysis.stepWeight || 10
      }

      // Provider
      if (canary.spec?.provider === 'nginx') {
        formData.value.provider = 'nginx'
      } else if (canary.spec?.service?.gateways || canary.spec?.service?.hosts) {
        formData.value.provider = 'istio'
      }

      // Ingress
      if (canary.spec?.ingressRef?.name) {
        formData.value.ingressRef = canary.spec.ingressRef.name
      }

      // Istio 配置
      if (canary.spec?.service?.gateways) {
        formData.value.istioGateways = canary.spec.service.gateways
      }
      if (canary.spec?.service?.hosts) {
        formData.value.istioHosts = canary.spec.service.hosts
      }
      if (canary.spec?.service?.corsPolicy) {
        formData.value.istioCorsEnabled = true
      }

      // HPA
      if (canary.spec?.autoscalerRef?.name) {
        formData.value.hpaRef = canary.spec.autoscalerRef.name
      }

      // 指标
      builtinMetrics.value = []
      customMetrics.value = []

      if (canary.spec?.analysis?.metrics) {
        for (const metric of canary.spec.analysis.metrics) {
          if (metric.templateRef) {
            // 自定义指标
            customMetrics.value.push({
              templateName: metric.name,
              templateNamespace: metric.templateRef.namespace || '',
              interval: metric.interval || '1m',
              thresholdMin: metric.thresholdRange?.min ?? null,
              thresholdMax: metric.thresholdRange?.max ?? null,
              templateVariables: Object.entries(metric.templateVariables || {}).map(
                ([name, value]) => ({
                  name,
                  value: value as string
                })
              )
            })
          } else {
            // 内置指标
            builtinMetrics.value.push({
              name: metric.name,
              interval: metric.interval || '1m',
              thresholdMin: metric.thresholdRange?.min ?? null,
              thresholdMax: metric.thresholdRange?.max ?? null
            })
          }
        }
      }

      // Webhooks
      formData.value.webhooks = []
      if (canary.spec?.analysis?.webhooks) {
        formData.value.webhooks = canary.spec.analysis.webhooks.map((w: any) => ({
          name: w.name || '',
          type: w.type || 'rollout',
          url: w.url || '',
          timeout: w.timeout || '5s',
          retries: parseInt(w.metadata?.retries || '1'),
          muteAlert: w.muteAlert || false
        }))
      }

      ElMessage.success('YAML 已转换为表单')
      return true
    } catch (error) {
      console.error('YAML转表单失败:', error)
      return false
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!props.workspace) return
    formToYaml()
    await handleSubmitYaml()
  }

  const handleSubmitYaml = async () => {
    if (!props.workspace) return

    if (!yamlContent.value) {
      return
    }

    try {
      submitting.value = true
      if (props.mode === 'create') {
        await createCanaryApi({
          workloadId: props.workspace.id,
          versionId: formData.value.versionId || 0,
          flaggerYamlStr: yamlContent.value
        })
        ElMessage.success('创建成功')
      } else {
        await updateCanaryApi({
          workloadId: props.workspace.id,
          versionId: formData.value.versionId || 0,
          name: formData.value.name,
          flaggerYamlStr: yamlContent.value
        })
        ElMessage.success('更新成功')
      }
      emit('success')
      handleClose()
    } catch (error: any) {
      console.error('提交失败:', error)
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    emit('update:modelValue', false)
  }

  const handleDialogClose = () => {
    currentStep.value = 0
    editMode.value = 'form'
    formRef.value?.resetFields()
    builtinMetrics.value = []
    customMetrics.value = []
    yamlContent.value = ''
  }

  // 监听弹窗打开
  watch(
    () => props.modelValue,
    async (val) => {
      if (val) {
        await loadVersions()
        if (props.mode === 'edit' && props.canaryName && props.workspace) {
          try {
            const yamlStr = await getCanaryYamlApi({
              workloadId: props.workspace.id,
              versionId: 0,
              name: props.canaryName
            })
            yamlContent.value = yamlStr
            yamlToForm()
          } catch (error) {
            console.error('加载 Canary YAML 失败:', error)
          }
        }
      }
    }
  )

  // 监听编辑模式切换
  watch(editMode, (newMode, oldMode) => {
    if (newMode === 'yaml' && oldMode === 'form') {
      formToYaml()
    } else if (newMode === 'form' && oldMode === 'yaml') {
      yamlToForm()
    }
  })
</script>

<style lang="scss" scoped>
  .flagger-create-dialog {
    :deep(.el-dialog__body) {
      padding: 0 !important;
    }

    .mode-switcher {
      padding: 12px 20px;
      border-bottom: 1px solid #e4e7ed;
      background: linear-gradient(90deg, #fafbfc 0%, #f5f7fa 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;

      :deep(.el-radio-button__inner) {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
      }

      .mode-tips {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #909399;
      }
    }

    // 向导模式
    .wizard-content {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 220px);
      background: #fafbfc;

      .steps-header {
        padding: 24px 40px 20px;
        background: white;
        border-bottom: 1px solid #e4e7ed;

        :deep(.el-step__title) {
          font-size: 13px;
        }

        // 允许步骤点击
        :deep(.el-step__head) {
          cursor: pointer;

          &:hover {
            .el-step__icon {
              border-color: #409eff;
            }
          }
        }
      }

      .step-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px 40px;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background: #dcdfe6;
          border-radius: 3px;

          &:hover {
            background: #c0c4cc;
          }
        }
      }

      .step-panel {
        animation: slideInUp 0.3s ease-out;

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .step-panel-header {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: white;
          border-radius: 8px;
          border: 2px solid #409eff;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);

          .header-content {
            flex: 1;

            h3 {
              margin: 0 0 4px;
              font-size: 18px;
              font-weight: 600;
              color: #303133;
            }

            p {
              margin: 0;
              font-size: 13px;
              color: #606266;
              line-height: 1.6;
            }
          }
        }

        .form-content {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
      }

      .step-actions {
        display: flex;
        gap: 12px;
        padding: 16px 40px;
        border-top: 1px solid #e4e7ed;
        background: white;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
      }
    }

    // YAML 模式
    .yaml-content {
      padding: 16px 20px;
      height: calc(100vh - 220px);
      display: flex;
      flex-direction: column;
      background: #fafbfc;

      .yaml-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e4e7ed;
      }
    }

    // 版本选择
    .version-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;

      .version-main {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .version-name {
        color: #606266;
        font-weight: 500;
      }
    }

    // 资源预览卡片
    .resource-preview-card {
      margin-top: 16px;
      padding: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%);
      border-radius: 8px;
      border: 1px solid #e4e7ed;

      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #dcdfe6;
      }

      .preview-content {
        .preview-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding: 8px;
          background: white;
          border-radius: 4px;

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            font-weight: 500;
            color: #606266;
            min-width: 80px;
          }

          .value {
            color: #303133;
            font-family: 'Monaco', 'Menlo', monospace;
          }
        }
      }

      :deep(.el-alert) {
        margin-top: 12px;
      }
    }

    // 策略选择网格
    .strategy-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      width: 100%;

      .strategy-card {
        display: flex;
        gap: 12px;
        padding: 16px;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: white;

        &:hover {
          border-color: #409eff;
          background: #f5f9ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
        }

        &.active {
          border-color: #409eff;
          background: linear-gradient(135deg, #ecf5ff 0%, #f5f9ff 100%);
          box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
        }

        .strategy-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border-radius: 8px;
        }

        .strategy-info {
          flex: 1;

          .strategy-title {
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
            font-size: 14px;
          }

          .strategy-desc {
            font-size: 12px;
            color: #606266;
            margin-bottom: 6px;
            line-height: 1.5;
          }

          .strategy-scene {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #909399;
          }
        }
      }
    }

    // 策略参数
    .strategy-params,
    .common-params {
      margin-top: 20px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;

      .params-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #409eff;
      }

      :deep(.el-alert) {
        margin-top: 12px;
      }
    }

    // Istio 配置
    .istio-config {
      margin-top: 20px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
    }

    // Service/Ingress 选项
    .service-option,
    .ingress-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;

      .service-name,
      .ingress-name {
        flex: 1;
        font-weight: 500;
        color: #303133;
      }

      .service-ports,
      .ingress-hosts {
        font-size: 12px;
        color: #909399;
      }
    }

    // Service 端口配置
    .service-ports-config {
      margin-top: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%);
      border-radius: 8px;
      border: 1px solid #e4e7ed;

      .config-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 12px;
      }

      .port-preview {
        margin-top: 16px;
        padding: 12px;
        background: white;
        border-radius: 6px;
        border: 1px dashed #409eff;

        .preview-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;

          .flow-item {
            text-align: center;

            .flow-label {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }

            .flow-value {
              font-weight: 600;
              color: #409eff;
              font-family: 'Monaco', 'Menlo', monospace;
            }
          }

          .flow-arrow {
            color: #409eff;
          }
        }
      }
    }

    // 指标配置
    .metrics-section {
      margin-bottom: 24px;

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #409eff;

        > span {
          flex: 1;
        }
      }

      .empty-metrics {
        padding: 40px;
        text-align: center;
        color: #909399;
        background: #f5f7fa;
        border-radius: 8px;
        border: 1px dashed #dcdfe6;

        p {
          margin: 12px 0 0;
          font-size: 14px;

          &.empty-hint {
            font-size: 12px;
            margin-top: 8px;
          }
        }
      }

      .metric-card {
        margin-bottom: 16px;
        padding: 16px;
        background: #f5f7fa;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .metric-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            color: #303133;
          }
        }

        .metric-description {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          font-size: 12px;
          color: #606266;
          line-height: 1.6;
        }

        .template-variables {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #dcdfe6;
        }
      }
    }

    .metric-type-option {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .hint {
        font-size: 12px;
        color: #909399;
      }
    }

    .template-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    // Webhook 配置
    .webhooks-container {
      .empty-webhooks {
        padding: 40px;
        text-align: center;
        color: #909399;
        background: #f5f7fa;
        border-radius: 8px;
        border: 1px dashed #dcdfe6;

        p {
          margin: 12px 0;
          font-size: 14px;

          &.empty-hint {
            font-size: 12px;
            margin-top: 8px;
          }
        }
      }

      .webhook-card {
        margin-bottom: 16px;
        padding: 16px;
        background: #f5f7fa;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .webhook-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .webhook-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            color: #303133;
          }
        }

        :deep(.el-alert) {
          margin-top: 12px;
        }
      }
    }

    .webhook-type-option {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .hint {
        font-size: 12px;
        color: #909399;
      }
    }

    // 确认创建汇总
    .summary-content {
      .summary-card {
        margin-bottom: 20px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e4e7ed;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .card-content {
          padding: 16px;

          .summary-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding: 8px;
            background: #f5f7fa;
            border-radius: 4px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              font-weight: 500;
              color: #606266;
              min-width: 100px;
            }

            .value {
              color: #303133;
              font-family: 'Monaco', 'Menlo', monospace;
            }

            .tags-group {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
          }

          .empty-summary {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #e6a23c;
            font-size: 13px;
            padding: 12px;
            background: #fdf6ec;
            border-radius: 4px;
          }

          .strategy-summary {
            display: flex;
            gap: 16px;

            .strategy-icon {
              flex-shrink: 0;
              width: 56px;
              height: 56px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
            }

            .strategy-info {
              flex: 1;

              .strategy-name {
                font-weight: 600;
                font-size: 16px;
                color: #303133;
                margin-bottom: 12px;
              }

              .strategy-detail {
                .detail-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 13px;
                  color: #606266;
                  line-height: 2;
                  padding: 4px 0;

                  svg {
                    color: #67c23a;
                    flex-shrink: 0;
                  }
                }
              }
            }
          }

          .subsection-title {
            font-weight: 600;
            color: #303133;
            font-size: 14px;
            margin: 16px 0 8px;
            padding-left: 8px;
            border-left: 3px solid #409eff;
          }

          .metric-summary,
          .webhook-summary {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            background: #f5f7fa;
            border-radius: 4px;
            margin-bottom: 8px;

            svg {
              flex-shrink: 0;
            }

            .metric-name,
            .webhook-name {
              font-weight: 500;
              color: #303133;
            }

            .metric-detail,
            .webhook-url {
              font-size: 12px;
              color: #909399;
              margin-left: auto;
            }
          }
        }
      }

      .final-confirm {
        margin-top: 24px;
      }
    }
  }
</style>
