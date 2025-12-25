<template>
  <div class="control-plane-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-container">
        <!-- 总览卡片 - 简化版 -->
        <div class="overview-card">
          <div class="overview-header">
            <div class="header-left">
              <h2>控制平面概览</h2>
              <p class="subtitle">集群控制组件实时监控与健康分析</p>
            </div>
            <div class="health-badge" :class="overallHealth.status">
              <span class="status-dot"></span>
              <span class="status-text">{{ overallHealth.text }}</span>
              <span class="health-score">{{ overallHealth.score }}/100</span>
            </div>
          </div>

          <!-- 问题告警 -->
          <div v-if="healthIssues.length > 0" class="issues-alert">
            <div class="alert-header">
              <span class="alert-icon">⚠️</span>
              <span class="alert-title">检测到 {{ healthIssues.length }} 个问题</span>
            </div>
            <div class="issues-list">
              <div v-for="(issue, index) in healthIssues" :key="index" class="issue-item">
                <span class="issue-dot"></span>
                <span class="issue-text">{{ issue }}</span>
              </div>
            </div>
          </div>

          <!-- 快速指标 -->
          <div class="quick-metrics">
            <div class="quick-metric" v-for="metric in quickMetrics" :key="metric.label">
              <div class="metric-icon">{{ metric.icon }}</div>
              <div class="metric-info">
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-value">{{ metric.value }}</div>
                <div v-if="metric.subtext" class="metric-subtext">{{ metric.subtext }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主要监控卡片网格 -->
        <div class="monitor-grid">
          <!-- ==================== API Server ==================== -->
          <div class="monitor-card api-server">
            <div class="card-header">
              <div class="header-info">
                <div class="icon-badge api-server-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="currentColor"
                      d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,17V16H9V14H13V13H10A1,1 0 0,1 9,12V9A1,1 0 0,1 10,8H14V9H12V11H14V12H15V14A1,1 0 0,1 14,15H10V17H11Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3>API Server</h3>
                  <p>集群网关与认证中心</p>
                </div>
              </div>
              <ElTag :type="apiServerStatus.type" effect="plain" size="small">
                {{ apiServerStatus.text }}
              </ElTag>
            </div>

            <!-- 核心指标 -->
            <div class="metrics-row">
              <div class="metric-item primary">
                <div class="metric-header">
                  <span class="metric-icon">⚡</span>
                  <span class="metric-title">请求速率</span>
                </div>
                <div class="metric-display">
                  <span class="value">{{ formatNumber(apiServer?.requestsPerSecond) }}</span>
                  <span class="unit">req/s</span>
                </div>
                <div class="metric-footer">
                  <span class="badge" :class="getQPSLevel(apiServer?.requestsPerSecond)">
                    {{ getQPSLevelText(apiServer?.requestsPerSecond) }}
                  </span>
                </div>
              </div>

              <div class="metric-item" :class="{ warning: (apiServer?.errorRate || 0) > 0.01 }">
                <div class="metric-header">
                  <span class="metric-icon">⚠️</span>
                  <span class="metric-title">错误率</span>
                </div>
                <div class="metric-display">
                  <span class="value">{{ formatPercent((apiServer?.errorRate || 0) * 100) }}</span>
                  <span class="unit">%</span>
                </div>
              </div>

              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-icon">⏱️</span>
                  <span class="metric-title">P95 延迟</span>
                </div>
                <div class="metric-display">
                  <span class="value">{{ formatLatency(apiServer?.p95Latency) }}</span>
                </div>
              </div>

              <div
                class="metric-item"
                :class="{ warning: (apiServer?.currentInflightRequests || 0) > 600 }"
              >
                <div class="metric-header">
                  <span class="metric-icon">🔄</span>
                  <span class="metric-title">并发请求</span>
                </div>
                <div class="metric-display">
                  <span class="value">{{ formatInteger(apiServer?.currentInflightRequests) }}</span>
                  <span class="unit">/600</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{
                      width: getConcurrencyPercent(apiServer?.currentInflightRequests) + '%'
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 延迟分布 -->
            <div class="latency-distribution">
              <div class="distribution-title">延迟分布</div>
              <div class="distribution-items">
                <div class="distribution-item">
                  <span class="label">P50</span>
                  <span class="value">{{ formatLatency(apiServer?.p50Latency) }}</span>
                </div>
                <div class="distribution-item">
                  <span class="label">P95</span>
                  <span class="value">{{ formatLatency(apiServer?.p95Latency) }}</span>
                </div>
                <div class="distribution-item">
                  <span class="label">P99</span>
                  <span class="value">{{ formatLatency(apiServer?.p99Latency) }}</span>
                </div>
              </div>
            </div>

            <!-- 图表 -->
            <div class="chart-section">
              <div class="chart-header">
                <span class="chart-title">请求与延迟趋势</span>
                <div class="chart-legend">
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #409eff"></i>
                    QPS
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #f56c6c"></i>
                    错误率
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #67c23a"></i>
                    P95延迟
                  </span>
                </div>
              </div>
              <div ref="apiServerChartRef" class="chart-container"></div>
            </div>

            <!-- 详细指标 -->
            <div class="detail-panel">
              <div class="panel-toggle" @click="toggleApiServerDetail">
                <span>详细指标</span>
                <i :class="['arrow', showApiServerDetail ? 'up' : 'down']">▼</i>
              </div>
              <Transition name="slide">
                <div v-if="showApiServerDetail" class="panel-content">
                  <!-- 并发与连接 -->
                  <div class="detail-section">
                    <div class="section-title">并发与连接</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">读请求</span>
                        <span class="value">{{
                          formatInteger(apiServer?.inflightReadRequests)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">写请求</span>
                        <span class="value">{{
                          formatInteger(apiServer?.inflightMutatingRequests)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">长连接</span>
                        <span class="value">{{
                          formatInteger(apiServer?.longRunningRequests)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Watch连接</span>
                        <span class="value">{{ formatInteger(apiServer?.watchCount) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 性能指标 -->
                  <div class="detail-section">
                    <div class="section-title">性能与异常</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">请求丢弃</span>
                        <span
                          class="value"
                          :class="{ danger: (apiServer?.requestDropped || 0) > 0 }"
                        >
                          {{ formatInteger(apiServer?.requestDropped) }}
                        </span>
                      </div>
                      <div class="detail-item">
                        <span class="label">请求超时</span>
                        <span
                          class="value"
                          :class="{ danger: (apiServer?.requestTimeout || 0) > 0 }"
                        >
                          {{ formatInteger(apiServer?.requestTimeout) }}
                        </span>
                      </div>
                      <div class="detail-item">
                        <span class="label">响应大小</span>
                        <span class="value">{{ formatBytes(apiServer?.responseSizeBytes) }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Webhook延迟</span>
                        <span class="value">{{
                          formatLatency(apiServer?.webhookDurationSeconds)
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 认证鉴权 -->
                  <div class="detail-section">
                    <div class="section-title">认证与鉴权</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">认证尝试</span>
                        <span class="value">{{
                          formatInteger(apiServer?.authenticationAttempts)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">认证失败</span>
                        <span
                          class="value"
                          :class="{ danger: (apiServer?.authenticationFailures || 0) > 0 }"
                        >
                          {{ formatInteger(apiServer?.authenticationFailures) }}
                        </span>
                      </div>
                      <div class="detail-item">
                        <span class="label">鉴权尝试</span>
                        <span class="value">{{
                          formatInteger(apiServer?.authorizationAttempts)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">证书到期</span>
                        <span
                          class="value"
                          :class="{ warning: (apiServer?.clientCertExpirationDays || 999) < 30 }"
                        >
                          {{ formatInteger(apiServer?.clientCertExpirationDays) }} 天
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 请求分布 -->
                  <div
                    class="detail-section"
                    v-if="apiServer?.requestsByVerb && apiServer.requestsByVerb.length > 0"
                  >
                    <div class="section-title">请求方法分布</div>
                    <div class="verb-distribution">
                      <div v-for="verb in topVerbs" :key="verb.verb" class="verb-item">
                        <div class="verb-header">
                          <span class="verb-name">{{ verb.verb }}</span>
                          <span class="verb-value"
                            >{{ formatNumber(verb.requestsPerSecond) }} req/s</span
                          >
                        </div>
                        <div class="verb-bar">
                          <div class="bar-fill" :style="{ width: verb.percent + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 状态码分布 -->
                  <div class="detail-section" v-if="apiServer?.requestsByCode">
                    <div class="section-title">HTTP 状态码分布</div>
                    <div class="status-code-grid">
                      <div class="status-group success">
                        <div class="group-title">2xx 成功</div>
                        <div class="group-value">{{
                          getTotalStatusCodes(apiServer.requestsByCode.status2xx)
                        }}</div>
                      </div>
                      <div class="status-group redirect">
                        <div class="group-title">3xx 重定向</div>
                        <div class="group-value">{{
                          getTotalStatusCodes(apiServer.requestsByCode.status3xx)
                        }}</div>
                      </div>
                      <div class="status-group client-error">
                        <div class="group-title">4xx 客户端错误</div>
                        <div class="group-value">{{
                          getTotalStatusCodes(apiServer.requestsByCode.status4xx)
                        }}</div>
                      </div>
                      <div class="status-group server-error">
                        <div class="group-title">5xx 服务端错误</div>
                        <div class="group-value">{{
                          getTotalStatusCodes(apiServer.requestsByCode.status5xx)
                        }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- ==================== Scheduler ==================== -->
          <div class="monitor-card scheduler">
            <div class="card-header">
              <div class="header-info">
                <div class="icon-badge scheduler-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="currentColor"
                      d="M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3>Scheduler</h3>
                  <p>Pod 调度与资源分配</p>
                </div>
              </div>
              <ElTag :type="schedulerStatus.type" effect="plain" size="small">
                {{ schedulerStatus.text }}
              </ElTag>
            </div>

            <!-- 核心指标 -->
            <div class="metrics-row">
              <div class="metric-item primary">
                <div class="metric-header">
                  <span class="metric-icon">✅</span>
                  <span class="metric-title">调度成功率</span>
                </div>
                <div class="metric-display">
                  <span class="value">{{
                    formatPercent((scheduler?.scheduleSuccessRate || 0) * 100)
                  }}</span>
                  <span class="unit">%</span>
                </div>
                <div class="metric-footer">
                  <span class="badge" :class="getSuccessRateLevel(scheduler?.scheduleSuccessRate)">
                    {{ getSuccessRateText(scheduler?.scheduleSuccessRate) }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill success"
                    :style="{ width: (scheduler?.scheduleSuccessRate || 0) * 100 + '%' }"
                  ></div>
                </div>
              </div>

              <div class="metric-item" :class="{ warning: (scheduler?.pendingPods || 0) > 10 }">
                <div class="metric-header">
                  <span class="metric-icon">⏳</span>
                  <span class="metric-title">待调度</span>
                </div>
                <div class="metric-display">
                  <span class="value">{{ formatInteger(scheduler?.pendingPods) }}</span>
                  <span class="unit">个</span>
                </div>
              </div>

              <div class="metric-item" :class="{ danger: (scheduler?.unschedulablePods || 0) > 0 }">
                <div class="metric-header">
                  <span class="metric-icon">❌</span>
                  <span class="metric-title">无法调度</span>
                </div>
                <div class="metric-display">
                  <span class="value danger">{{
                    formatInteger(scheduler?.unschedulablePods)
                  }}</span>
                  <span class="unit">个</span>
                </div>
              </div>

              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-icon">⚡</span>
                  <span class="metric-title">P95 延迟</span>
                </div>
                <div class="metric-display">
                  <span class="value">{{ formatLatency(scheduler?.p95ScheduleLatency) }}</span>
                </div>
              </div>
            </div>

            <!-- 调度统计 -->
            <div class="schedule-stats">
              <div class="stats-title">调度统计</div>
              <div class="stats-items">
                <div class="stats-item success">
                  <span class="stats-label">已调度</span>
                  <span class="stats-value">{{ formatInteger(scheduler?.scheduledPods) }}</span>
                </div>
                <div class="stats-item danger">
                  <span class="stats-label">调度失败</span>
                  <span class="stats-value">{{ formatInteger(scheduler?.failedScheduling) }}</span>
                </div>
                <div class="stats-item warning">
                  <span class="stats-label">抢占尝试</span>
                  <span class="stats-value">{{
                    formatInteger(scheduler?.preemptionAttempts)
                  }}</span>
                </div>
                <div class="stats-item info">
                  <span class="stats-label">队列长度</span>
                  <span class="stats-value">{{
                    formatInteger(scheduler?.schedulingQueueLength)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 图表 -->
            <div class="chart-section">
              <div class="chart-header">
                <span class="chart-title">调度趋势</span>
                <div class="chart-legend">
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #67c23a"></i>
                    成功率
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #e6a23c"></i>
                    待调度
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #409eff"></i>
                    P95延迟
                  </span>
                </div>
              </div>
              <div ref="schedulerChartRef" class="chart-container"></div>
            </div>

            <!-- 详细指标 -->
            <div class="detail-panel">
              <div class="panel-toggle" @click="toggleSchedulerDetail">
                <span>失败原因与队列分析</span>
                <i :class="['arrow', showSchedulerDetail ? 'up' : 'down']">▼</i>
              </div>
              <Transition name="slide">
                <div v-if="showSchedulerDetail" class="panel-content">
                  <!-- 延迟详情 -->
                  <div class="detail-section">
                    <div class="section-title">延迟分布</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">P50</span>
                        <span class="value">{{
                          formatLatency(scheduler?.p50ScheduleLatency)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">P95</span>
                        <span class="value">{{
                          formatLatency(scheduler?.p95ScheduleLatency)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">P99</span>
                        <span class="value">{{
                          formatLatency(scheduler?.p99ScheduleLatency)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">绑定延迟</span>
                        <span class="value">{{ formatLatency(scheduler?.bindingLatency) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 调度队列 -->
                  <div class="detail-section">
                    <div class="section-title">调度队列</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">总队列</span>
                        <span class="value">{{
                          formatInteger(scheduler?.schedulingQueueLength)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">活跃队列</span>
                        <span class="value">{{ formatInteger(scheduler?.activeQueueLength) }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">退避队列</span>
                        <span class="value">{{
                          formatInteger(scheduler?.backoffQueueLength)
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 插件延迟 -->
                  <div class="detail-section" v-if="scheduler?.pluginLatency">
                    <div class="section-title">插件延迟</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">Filter</span>
                        <span class="value">{{
                          formatLatency(scheduler.pluginLatency.filterLatency)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Score</span>
                        <span class="value">{{
                          formatLatency(scheduler.pluginLatency.scoreLatency)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">PreBind</span>
                        <span class="value">{{
                          formatLatency(scheduler.pluginLatency.preBindLatency)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Bind</span>
                        <span class="value">{{
                          formatLatency(scheduler.pluginLatency.bindLatency)
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 失败原因 -->
                  <div class="detail-section" v-if="scheduleFailureReasons.length > 0">
                    <div class="section-title">失败原因分析</div>
                    <div class="failure-reasons">
                      <div
                        v-for="reason in scheduleFailureReasons"
                        :key="reason.key"
                        class="reason-item"
                      >
                        <div class="reason-header">
                          <span class="reason-label">{{ reason.label }}</span>
                          <span class="reason-value"
                            >{{ reason.value }} 次 ({{ reason.percent.toFixed(1) }}%)</span
                          >
                        </div>
                        <div class="reason-bar">
                          <div
                            class="bar-fill"
                            :style="{ width: reason.percent + '%', background: reason.color }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 抢占统计 -->
                  <div class="detail-section">
                    <div class="section-title">抢占统计</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">抢占尝试</span>
                        <span class="value">{{
                          formatInteger(scheduler?.preemptionAttempts)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">被抢占Pod</span>
                        <span class="value">{{ formatInteger(scheduler?.preemptionVictims) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- ==================== Controller Manager ==================== -->
          <div class="monitor-card controller-manager">
            <div class="card-header">
              <div class="header-info">
                <div class="icon-badge controller-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="currentColor"
                      d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3C3,10.13 6.13,7 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3>Controller Manager</h3>
                  <p>资源控制器管理</p>
                </div>
              </div>
              <ElTag :type="controllerStatus.type" effect="plain" size="small">
                {{ controllerStatus.text }}
              </ElTag>
            </div>

            <!-- Leader 状态 -->
            <div class="leader-status" :class="{ active: controllerManager?.isLeader }">
              <div class="leader-icon">
                {{ controllerManager?.isLeader ? '👑' : '⚪' }}
              </div>
              <div class="leader-info">
                <div class="leader-title">
                  {{ controllerManager?.isLeader ? 'Leader 状态' : '非 Leader' }}
                </div>
                <div class="leader-subtitle">
                  Leader 变更: {{ formatInteger(controllerManager?.leaderChanges) }} 次
                </div>
              </div>
            </div>

            <!-- 控制器队列深度 -->
            <div class="controller-queues">
              <div class="queues-title">控制器队列深度</div>
              <div class="queue-grid">
                <div class="queue-item">
                  <div class="queue-icon">📦</div>
                  <div class="queue-info">
                    <div class="queue-name">Deployment</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.deploymentQueueDepth)
                    }}</div>
                  </div>
                </div>
                <div class="queue-item">
                  <div class="queue-icon">🔄</div>
                  <div class="queue-info">
                    <div class="queue-name">ReplicaSet</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.replicaSetQueueDepth)
                    }}</div>
                  </div>
                </div>
                <div class="queue-item">
                  <div class="queue-icon">💾</div>
                  <div class="queue-info">
                    <div class="queue-name">StatefulSet</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.statefulSetQueueDepth)
                    }}</div>
                  </div>
                </div>
                <div class="queue-item">
                  <div class="queue-icon">🌐</div>
                  <div class="queue-info">
                    <div class="queue-name">DaemonSet</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.daemonSetQueueDepth)
                    }}</div>
                  </div>
                </div>
                <div class="queue-item">
                  <div class="queue-icon">⚙️</div>
                  <div class="queue-info">
                    <div class="queue-name">Job</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.jobQueueDepth)
                    }}</div>
                  </div>
                </div>
                <div class="queue-item">
                  <div class="queue-icon">🖥️</div>
                  <div class="queue-info">
                    <div class="queue-name">Node</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.nodeQueueDepth)
                    }}</div>
                  </div>
                </div>
                <div class="queue-item">
                  <div class="queue-icon">🔌</div>
                  <div class="queue-info">
                    <div class="queue-name">Service</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.serviceQueueDepth)
                    }}</div>
                  </div>
                </div>
                <div class="queue-item">
                  <div class="queue-icon">🔗</div>
                  <div class="queue-info">
                    <div class="queue-name">Endpoint</div>
                    <div class="queue-value">{{
                      formatInteger(controllerManager?.endpointQueueDepth)
                    }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图表 -->
            <div class="chart-section">
              <div class="chart-header">
                <span class="chart-title">队列趋势</span>
                <div class="chart-legend">
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #409eff"></i>
                    Deployment
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #67c23a"></i>
                    ReplicaSet
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #e6a23c"></i>
                    StatefulSet
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot" style="background: #f56c6c"></i>
                    总深度
                  </span>
                </div>
              </div>
              <div ref="controllerChartRef" class="chart-container"></div>
            </div>

            <!-- 详细指标 -->
            <div class="detail-panel">
              <div class="panel-toggle" @click="toggleControllerDetail">
                <span>工作队列详细统计</span>
                <i :class="['arrow', showControllerDetail ? 'up' : 'down']">▼</i>
              </div>
              <Transition name="slide">
                <div v-if="showControllerDetail" class="panel-content">
                  <!-- 队列延迟 -->
                  <div class="detail-section" v-if="controllerManager?.queueLatency">
                    <div class="section-title">队列延迟</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">队列等待</span>
                        <span class="value">{{
                          formatLatency(controllerManager.queueLatency.queueDuration)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">工作时长</span>
                        <span class="value">{{
                          formatLatency(controllerManager.queueLatency.workDuration)
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 工作队列统计 -->
                  <div class="detail-section" v-if="controllerManager?.workQueueMetrics">
                    <div class="section-title">工作队列统计</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">添加速率</span>
                        <span class="value"
                          >{{ formatNumber(controllerManager.workQueueMetrics.addsRate) }} /s</span
                        >
                      </div>
                      <div class="detail-item">
                        <span class="label">队列总深度</span>
                        <span class="value">{{
                          formatInteger(controllerManager.workQueueMetrics.depthTotal)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">未完成工作</span>
                        <span class="value">{{
                          formatInteger(controllerManager.workQueueMetrics.unfinishedWork)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">最长运行</span>
                        <span class="value">{{
                          formatLatency(controllerManager.workQueueMetrics.longestRunning)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">重试率</span>
                        <span class="value"
                          >{{
                            formatNumber(controllerManager.workQueueMetrics.retriesRate)
                          }}
                          /s</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- 控制器协调延迟 -->
                  <div class="detail-section" v-if="controllerManager?.reconcileLatency">
                    <div class="section-title">控制器协调延迟 (P99)</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">Deployment</span>
                        <span class="value">{{
                          formatLatency(controllerManager.reconcileLatency.deploymentP99)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">ReplicaSet</span>
                        <span class="value">{{
                          formatLatency(controllerManager.reconcileLatency.replicaSetP99)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">StatefulSet</span>
                        <span class="value">{{
                          formatLatency(controllerManager.reconcileLatency.statefulSetP99)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">DaemonSet</span>
                        <span class="value">{{
                          formatLatency(controllerManager.reconcileLatency.daemonSetP99)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Job</span>
                        <span class="value">{{
                          formatLatency(controllerManager.reconcileLatency.jobP99)
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 错误与重试 -->
                  <div class="detail-section">
                    <div class="section-title">错误与重试</div>
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="label">同步错误总数</span>
                        <span class="value danger">{{
                          formatInteger(controllerManager?.totalSyncErrors)
                        }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">重试率</span>
                        <span class="value"
                          >{{ formatNumber(controllerManager?.retryRate) }} /s</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>暂无控制平面数据</h3>
        <p>等待数据加载中...</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import * as echarts from 'echarts'
  import type {
    ClusterControlPlaneMetrics,
    APIServerMetrics,
    SchedulerMetrics,
    ControllerManagerMetrics,
    ScheduleFailureReasons
  } from '@/api/console/cluster-monitor'

  interface Props {
    controlPlaneData?: ClusterControlPlaneMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    controlPlaneData: undefined,
    loading: false
  })

  // 图表引用
  const apiServerChartRef = ref<HTMLElement>()
  const schedulerChartRef = ref<HTMLElement>()
  const controllerChartRef = ref<HTMLElement>()

  let apiServerChart: echarts.ECharts | null = null
  let schedulerChart: echarts.ECharts | null = null
  let controllerChart: echarts.ECharts | null = null

  // 折叠面板状态
  const showApiServerDetail = ref(false)
  const showSchedulerDetail = ref(false)
  const showControllerDetail = ref(false)

  const toggleApiServerDetail = () => (showApiServerDetail.value = !showApiServerDetail.value)
  const toggleSchedulerDetail = () => (showSchedulerDetail.value = !showSchedulerDetail.value)
  const toggleControllerDetail = () => (showControllerDetail.value = !showControllerDetail.value)

  // 快捷访问数据
  const apiServer = computed(() => props.controlPlaneData?.apiServer)
  const scheduler = computed(() => props.controlPlaneData?.scheduler)
  const controllerManager = computed(() => props.controlPlaneData?.controllerManager)

  // 数据状态
  const hasData = computed(() => {
    return !!(props.controlPlaneData && Object.keys(props.controlPlaneData).length > 0)
  })

  // ==================== 格式化函数 ====================
  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return value.toFixed(2)
  }

  const formatPercent = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.00'
    return value.toFixed(2)
  }

  const formatInteger = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return Math.round(value).toString()
  }

  const formatLatency = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0 ms'
    const ms = value * 1000
    if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`
    if (ms < 1000) return `${ms.toFixed(2)} ms`
    return `${(ms / 1000).toFixed(2)} s`
  }

  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  // ==================== 健康状态 ====================
  const overallHealth = computed(() => {
    if (!props.controlPlaneData) return { status: 'unknown', text: '未知', score: 0 }

    let score = 100
    const issues: string[] = []

    // API Server 检查
    if (apiServer.value) {
      if (apiServer.value.errorRate > 0.05) {
        score -= 20
        issues.push('API Server 错误率过高')
      } else if (apiServer.value.errorRate > 0.01) {
        score -= 10
      }

      if (apiServer.value.requestDropped > 0) {
        score -= 15
        issues.push('API Server 有请求丢弃')
      }

      if (apiServer.value.currentInflightRequests > 600) {
        score -= 10
        issues.push('API Server 并发请求过高')
      }
    }

    // Scheduler 检查
    if (scheduler.value) {
      if (scheduler.value.scheduleSuccessRate < 0.8) {
        score -= 25
        issues.push('调度成功率过低')
      } else if (scheduler.value.scheduleSuccessRate < 0.95) {
        score -= 10
      }

      if (scheduler.value.unschedulablePods > 10) {
        score -= 15
        issues.push('大量 Pod 无法调度')
      } else if (scheduler.value.unschedulablePods > 0) {
        score -= 5
      }
    }

    // Controller Manager 检查 - 修复：isLeader 不再作为异常条件
    if (controllerManager.value) {
      if (controllerManager.value.totalSyncErrors > 10) {
        score -= 15
        issues.push('Controller Manager 同步错误较多')
      }

      if (controllerManager.value.workQueueMetrics?.depthTotal > 1000) {
        score -= 10
        issues.push('Controller Manager 队列积压')
      }
    }

    score = Math.max(0, score)

    let status: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy'
    let text = '健康'

    if (score < 60) {
      status = 'critical'
      text = '严重异常'
    } else if (score < 80) {
      status = 'warning'
      text = '需要关注'
    }

    return { status, text, score: Math.round(score) }
  })

  const healthIssues = computed(() => {
    const issues: string[] = []

    if (apiServer.value) {
      if (apiServer.value.errorRate > 0.05) issues.push('API Server 错误率超过 5%')
      if (apiServer.value.requestDropped > 0)
        issues.push(`API Server 丢弃了 ${apiServer.value.requestDropped} 个请求`)
      if (apiServer.value.requestTimeout > 0)
        issues.push(`API Server 有 ${apiServer.value.requestTimeout} 个超时请求`)
      if (apiServer.value.currentInflightRequests > 600) issues.push('API Server 并发请求接近上限')
      if (apiServer.value.clientCertExpirationDays < 30)
        issues.push(`客户端证书将在 ${apiServer.value.clientCertExpirationDays} 天后过期`)
    }

    if (scheduler.value) {
      if (scheduler.value.scheduleSuccessRate < 0.8) issues.push('调度成功率低于 80%')
      if (scheduler.value.unschedulablePods > 10)
        issues.push(`有 ${scheduler.value.unschedulablePods} 个 Pod 无法调度`)
      if (scheduler.value.pendingPods > 50)
        issues.push(`有 ${scheduler.value.pendingPods} 个 Pod 待调度`)
    }

    // 修复：移除 isLeader 的问题检查
    if (controllerManager.value) {
      if (controllerManager.value.totalSyncErrors > 10)
        issues.push(`Controller Manager 同步错误: ${controllerManager.value.totalSyncErrors}`)
      if (controllerManager.value.workQueueMetrics?.depthTotal > 1000) {
        issues.push('Controller Manager 工作队列深度过大')
      }
    }

    return issues
  })

  // ==================== 快速指标 ====================
  const quickMetrics = computed(() => {
    if (!props.controlPlaneData) return []

    return [
      {
        icon: '⚡',
        label: 'API QPS',
        value: formatNumber(apiServer.value?.requestsPerSecond),
        subtext: `错误率 ${formatPercent((apiServer.value?.errorRate || 0) * 100)}%`
      },
      {
        icon: '✅',
        label: '调度成功率',
        value: formatPercent((scheduler.value?.scheduleSuccessRate || 0) * 100) + '%',
        subtext: `待调度 ${formatInteger(scheduler.value?.pendingPods)}`
      },
      {
        icon: '📦',
        label: '队列总数',
        value: formatInteger(getTotalQueueDepth()),
        subtext: controllerManager.value?.isLeader ? 'Leader' : '非Leader'
      }
    ]
  })

  const getTotalQueueDepth = (): number => {
    const cm = controllerManager.value
    if (!cm) return 0
    return (
      (cm.deploymentQueueDepth || 0) +
      (cm.replicaSetQueueDepth || 0) +
      (cm.statefulSetQueueDepth || 0) +
      (cm.daemonSetQueueDepth || 0) +
      (cm.jobQueueDepth || 0) +
      (cm.nodeQueueDepth || 0) +
      (cm.serviceQueueDepth || 0) +
      (cm.endpointQueueDepth || 0)
    )
  }

  // ==================== 组件状态 ====================
  const apiServerStatus = computed(() => {
    const data = apiServer.value
    if (!data) return { type: 'info', text: '未知' }

    if (data.errorRate > 0.05 || data.requestDropped > 0 || data.requestTimeout > 0) {
      return { type: 'danger', text: '异常' }
    }
    if (data.errorRate > 0.01 || data.p95Latency > 1 || data.currentInflightRequests > 600) {
      return { type: 'warning', text: '需关注' }
    }
    return { type: 'success', text: '正常' }
  })

  const schedulerStatus = computed(() => {
    const data = scheduler.value
    if (!data) return { type: 'info', text: '未知' }

    if (data.scheduleSuccessRate < 0.8 || data.unschedulablePods > 10) {
      return { type: 'danger', text: '异常' }
    }
    if (data.scheduleSuccessRate < 0.95 || data.pendingPods > 10) {
      return { type: 'warning', text: '需关注' }
    }
    return { type: 'success', text: '正常' }
  })

  // 修复：Controller Manager 状态判断，isLeader 不作为异常条件
  const controllerStatus = computed(() => {
    const data = controllerManager.value
    if (!data) return { type: 'info', text: '未知' }

    // 只根据实际错误情况判断
    if (data.totalSyncErrors > 10) {
      return { type: 'danger', text: '异常' }
    }
    if (data.workQueueMetrics?.depthTotal > 1000 || data.retryRate > 10) {
      return { type: 'warning', text: '需关注' }
    }

    // isLeader 只影响显示状态,不影响健康判断
    return { type: 'success', text: data.isLeader ? '正常 (Leader)' : '正常 (Standby)' }
  })

  // ==================== 辅助函数 ====================
  const getQPSLevel = (qps?: number) => {
    if (!qps) return 'low'
    if (qps < 100) return 'low'
    if (qps < 500) return 'normal'
    if (qps < 1000) return 'high'
    return 'very-high'
  }

  const getQPSLevelText = (qps?: number) => {
    if (!qps) return '低负载'
    if (qps < 100) return '低负载'
    if (qps < 500) return '正常'
    if (qps < 1000) return '高负载'
    return '极高负载'
  }

  const getSuccessRateLevel = (rate?: number) => {
    if (!rate) return 'critical'
    if (rate > 0.95) return 'excellent'
    if (rate > 0.9) return 'good'
    if (rate > 0.8) return 'warning'
    return 'critical'
  }

  const getSuccessRateText = (rate?: number) => {
    if (!rate) return '异常'
    if (rate > 0.95) return '优秀'
    if (rate > 0.9) return '良好'
    if (rate > 0.8) return '需改进'
    return '异常'
  }

  const getLatencyLevel = (latency?: number, threshold?: number) => {
    if (!latency || !threshold) return 'good'
    if (latency > threshold * 2) return 'critical'
    if (latency > threshold) return 'warning'
    return 'good'
  }

  const getLatencyLevelText = (latency?: number, threshold?: number) => {
    if (!latency || !threshold) return '正常'
    if (latency > threshold * 2) return '严重'
    if (latency > threshold) return '偏高'
    return '正常'
  }

  const getConcurrencyPercent = (current?: number): number => {
    if (!current) return 0
    return Math.min((current / 600) * 100, 100)
  }

  const getTotalStatusCodes = (codes?: Record<string, number>): number => {
    if (!codes) return 0
    return Object.values(codes).reduce((sum, count) => sum + count, 0)
  }

  // Top Verbs
  const topVerbs = computed(() => {
    if (!apiServer.value?.requestsByVerb || apiServer.value.requestsByVerb.length === 0) return []

    const total = apiServer.value.requestsByVerb.reduce((sum, v) => sum + v.requestsPerSecond, 0)
    if (total === 0) return []

    return apiServer.value.requestsByVerb
      .map((v) => ({
        ...v,
        percent: (v.requestsPerSecond / total) * 100
      }))
      .sort((a, b) => b.requestsPerSecond - a.requestsPerSecond)
      .slice(0, 5)
  })

  // Schedule Failure Reasons
  const scheduleFailureReasons = computed(() => {
    const reasons = scheduler.value?.failureReasons
    if (!reasons) return []

    const total = Object.values(reasons).reduce((sum, val) => sum + val, 0)
    if (total === 0) return []

    const reasonMap: Record<keyof ScheduleFailureReasons, string> = {
      insufficientCPU: 'CPU 不足',
      insufficientMemory: '内存不足',
      nodeAffinity: '节点亲和性',
      podAffinity: 'Pod 亲和性',
      taint: '节点污点',
      volumeBinding: '卷绑定失败',
      noNodesAvailable: '无可用节点'
    }

    const colors = ['#f56c6c', '#e6a23c', '#409eff', '#67c23a', '#909399', '#c45656', '#8b5cf6']

    return Object.entries(reasons)
      .map(([key, value], index) => ({
        key,
        label: reasonMap[key as keyof ScheduleFailureReasons] || key,
        value,
        percent: (value / total) * 100,
        color: colors[index % colors.length]
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  })

  // ==================== 图表初始化 ====================
  const initAPIServerChart = () => {
    if (!apiServerChartRef.value) return
    apiServerChart = echarts.init(apiServerChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1,
        textStyle: { color: '#333' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (value: number) =>
            new Date(value).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'QPS',
          position: 'left',
          axisLine: { lineStyle: { color: '#409eff' } }
        },
        {
          type: 'value',
          name: '错误率 %',
          position: 'right',
          axisLabel: { formatter: '{value}%' },
          axisLine: { lineStyle: { color: '#f56c6c' } }
        }
      ],
      series: []
    }

    apiServerChart.setOption(option)
  }

  const updateAPIServerChart = () => {
    if (!apiServerChart || !apiServer.value?.trend) return

    const trend = apiServer.value.trend
    if (trend.length === 0) return

    const qpsData = trend.map((item) => [item.timestamp, item.requestsPerSecond || 0])
    const errorData = trend.map((item) => [item.timestamp, (item.errorRate || 0) * 100])
    const latencyData = trend.map((item) => [item.timestamp, (item.p95Latency || 0) * 1000])

    apiServerChart.setOption({
      yAxis: [
        {
          type: 'value',
          name: 'QPS',
          position: 'left'
        },
        {
          type: 'value',
          name: '错误率 % / 延迟 ms',
          position: 'right'
        }
      ],
      series: [
        {
          name: 'QPS',
          type: 'line',
          yAxisIndex: 0,
          data: qpsData,
          smooth: true,
          lineStyle: { width: 2, color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          }
        },
        {
          name: '错误率',
          type: 'line',
          yAxisIndex: 1,
          data: errorData,
          smooth: true,
          lineStyle: { width: 2, color: '#f56c6c' }
        },
        {
          name: 'P95延迟',
          type: 'line',
          yAxisIndex: 1,
          data: latencyData,
          smooth: true,
          lineStyle: { width: 2, color: '#67c23a' }
        }
      ]
    })
  }

  const initSchedulerChart = () => {
    if (!schedulerChartRef.value) return
    schedulerChart = echarts.init(schedulerChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (value: number) =>
            new Date(value).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '成功率 %',
          position: 'left',
          max: 100
        },
        {
          type: 'value',
          name: '数量 / 延迟 ms',
          position: 'right'
        }
      ],
      series: []
    }

    schedulerChart.setOption(option)
  }

  const updateSchedulerChart = () => {
    if (!schedulerChart || !scheduler.value?.trend) return

    const trend = scheduler.value.trend
    if (trend.length === 0) return

    const successData = trend.map((item) => [item.timestamp, (item.scheduleSuccessRate || 0) * 100])
    const pendingData = trend.map((item) => [item.timestamp, item.pendingPods || 0])
    const latencyData = trend.map((item) => [item.timestamp, (item.p95ScheduleLatency || 0) * 1000])

    schedulerChart.setOption({
      series: [
        {
          name: '成功率',
          type: 'line',
          yAxisIndex: 0,
          data: successData,
          smooth: true,
          lineStyle: { width: 2, color: '#67c23a' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
            ])
          }
        },
        {
          name: '待调度',
          type: 'line',
          yAxisIndex: 1,
          data: pendingData,
          smooth: true,
          lineStyle: { width: 2, color: '#e6a23c' }
        },
        {
          name: 'P95延迟',
          type: 'line',
          yAxisIndex: 1,
          data: latencyData,
          smooth: true,
          lineStyle: { width: 2, color: '#409eff' }
        }
      ]
    })
  }

  const initControllerChart = () => {
    if (!controllerChartRef.value) return
    controllerChart = echarts.init(controllerChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e4e7ed',
        borderWidth: 1
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (value: number) =>
            new Date(value).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })
        }
      },
      yAxis: {
        type: 'value',
        name: '队列深度'
      },
      series: []
    }

    controllerChart.setOption(option)
  }

  const updateControllerChart = () => {
    if (!controllerChart || !controllerManager.value?.trend) return

    const trend = controllerManager.value.trend
    if (trend.length === 0) return

    const deploymentData = trend.map((item) => [item.timestamp, item.deploymentQueueDepth || 0])
    const replicasetData = trend.map((item) => [item.timestamp, item.replicaSetQueueDepth || 0])
    const statefulsetData = trend.map((item) => [item.timestamp, item.statefulSetQueueDepth || 0])
    const totalData = trend.map((item) => [item.timestamp, item.totalQueueDepth || 0])

    controllerChart.setOption({
      series: [
        {
          name: 'Deployment',
          type: 'line',
          data: deploymentData,
          smooth: true,
          lineStyle: { width: 2, color: '#409eff' }
        },
        {
          name: 'ReplicaSet',
          type: 'line',
          data: replicasetData,
          smooth: true,
          lineStyle: { width: 2, color: '#67c23a' }
        },
        {
          name: 'StatefulSet',
          type: 'line',
          data: statefulsetData,
          smooth: true,
          lineStyle: { width: 2, color: '#e6a23c' }
        },
        {
          name: '总深度',
          type: 'line',
          data: totalData,
          smooth: true,
          lineStyle: { width: 2, color: '#f56c6c', type: 'dashed' }
        }
      ]
    })
  }

  const handleResize = () => {
    apiServerChart?.resize()
    schedulerChart?.resize()
    controllerChart?.resize()
  }

  watch(
    () => props.controlPlaneData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!apiServerChart) initAPIServerChart()
          if (!schedulerChart) initSchedulerChart()
          if (!controllerChart) initControllerChart()

          updateAPIServerChart()
          updateSchedulerChart()
          updateControllerChart()
        }
      })
    },
    { deep: true, immediate: true }
  )

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    apiServerChart?.dispose()
    schedulerChart?.dispose()
    controllerChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .control-plane-monitor {
    width: 100%;
    min-height: 400px;
    padding: 20px;
    background: #f5f7fa;

    .monitor-container {
      max-width: 1800px;
      margin: 0 auto;
    }

    /* 简化的 Overview Card */
    .overview-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .overview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e4e7ed;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }

        .subtitle {
          margin: 6px 0 0;
          font-size: 13px;
          color: #909399;
        }

        .health-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 20px;
          background: #f4f4f5;
          font-weight: 500;
          font-size: 14px;

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .health-score {
            margin-left: 6px;
            font-weight: 600;
          }

          &.healthy {
            background: #f0f9ff;
            color: #67c23a;
            .status-dot {
              background: #67c23a;
            }
          }

          &.warning {
            background: #fef0e6;
            color: #e6a23c;
            .status-dot {
              background: #e6a23c;
            }
          }

          &.critical {
            background: #fef0f0;
            color: #f56c6c;
            .status-dot {
              background: #f56c6c;
            }
          }
        }
      }

      .issues-alert {
        background: #fef0f0;
        border: 1px solid #f56c6c;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 20px;

        .alert-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-weight: 500;
          font-size: 14px;
          color: #f56c6c;

          .alert-icon {
            font-size: 16px;
          }
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .issue-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #606266;

            .issue-dot {
              width: 4px;
              height: 4px;
              border-radius: 50%;
              background: #f56c6c;
              flex-shrink: 0;
            }
          }
        }
      }

      .quick-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;

        .quick-metric {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          background: #f4f4f5;
          transition: all 0.3s ease;

          &:hover {
            background: #e9e9eb;
          }

          .metric-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: white;
            flex-shrink: 0;
          }

          .metric-info {
            flex: 1;

            .metric-label {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }

            .metric-value {
              font-size: 18px;
              font-weight: 600;
              color: #303133;
            }

            .metric-subtext {
              font-size: 11px;
              color: #c0c4cc;
              margin-top: 2px;
            }
          }
        }
      }
    }

    .monitor-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .monitor-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e4e7ed;

        .header-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .icon-badge {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;

            &.api-server-icon {
              background: #409eff;
            }

            &.scheduler-icon {
              background: #e6a23c;
            }

            &.controller-icon {
              background: #909399;
            }
          }

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }

          p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .metrics-row {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;

        .metric-item {
          flex: 1;
          min-width: 160px;
          padding: 14px;
          border-radius: 8px;
          background: #f4f4f5;
          border: 1px solid #e4e7ed;
          transition: all 0.3s ease;

          &:hover {
            border-color: #409eff;
          }

          &.primary {
            background: #f0f9ff;
          }

          &.warning {
            border-color: #e6a23c;
            background: #fef5e7;
          }

          &.danger {
            border-color: #f56c6c;
            background: #fef0f0;
          }

          .metric-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 10px;

            .metric-icon {
              font-size: 16px;
            }

            .metric-title {
              font-size: 12px;
              color: #909399;
              font-weight: 500;
            }
          }

          .metric-display {
            display: flex;
            align-items: baseline;
            gap: 4px;

            .value {
              font-size: 20px;
              font-weight: 600;
              color: #303133;

              &.danger {
                color: #f56c6c;
              }
            }

            .unit {
              font-size: 11px;
              color: #909399;
            }
          }

          .metric-footer {
            margin-top: 8px;

            .badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: 500;

              &.low {
                background: #e3f2fd;
                color: #1976d2;
              }
              &.normal {
                background: #e8f5e9;
                color: #388e3c;
              }
              &.high {
                background: #fff3e0;
                color: #f57c00;
              }
              &.very-high {
                background: #ffebee;
                color: #d32f2f;
              }
              &.excellent {
                background: #e8f5e9;
                color: #388e3c;
              }
              &.good {
                background: #e3f2fd;
                color: #1976d2;
              }
              &.warning {
                background: #fff3e0;
                color: #f57c00;
              }
              &.critical {
                background: #ffebee;
                color: #d32f2f;
              }
              &.info {
                background: #e3f2fd;
                color: #1976d2;
              }
              &.success {
                background: #e8f5e9;
                color: #388e3c;
              }
              &.danger {
                background: #ffebee;
                color: #d32f2f;
              }
            }
          }

          .progress-bar {
            margin-top: 8px;
            height: 4px;
            background: #e4e7ed;
            border-radius: 2px;
            overflow: hidden;

            .progress-fill {
              height: 100%;
              background: #409eff;
              transition: width 0.5s ease;

              &.success {
                background: #67c23a;
              }

              &.warning {
                background: #e6a23c;
              }
            }
          }
        }
      }

      .latency-distribution,
      .cluster-status,
      .schedule-stats {
        margin: 20px 0;
        padding: 14px;
        background: #f4f4f5;
        border-radius: 8px;

        .distribution-title,
        .status-title,
        .stats-title {
          font-size: 12px;
          font-weight: 500;
          color: #606266;
          margin-bottom: 10px;
        }

        .distribution-items,
        .status-items,
        .stats-items {
          display: grid;
          gap: 10px;
        }

        .distribution-items {
          display: flex;
          gap: 10px;

          .distribution-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;

            .label {
              font-size: 11px;
              color: #909399;
            }

            .value {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }
          }
        }

        .status-items {
          display: flex;
          gap: 10px;

          .status-item {
            flex: 1;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e4e7ed;

            &.active {
              border-color: #67c23a;
              background: #f0f9ff;
            }

            &.warning {
              border-color: #e6a23c;
            }

            .status-label {
              font-size: 11px;
              color: #909399;
            }

            .status-value {
              font-size: 13px;
              font-weight: 500;
              color: #303133;
              margin-top: 2px;
            }
          }
        }

        .stats-items {
          display: flex;
          gap: 10px;

          .stats-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e4e7ed;

            &.success {
              border-color: #67c23a;
            }

            &.danger {
              border-color: #f56c6c;
            }

            &.warning {
              border-color: #e6a23c;
            }

            &.info {
              border-color: #409eff;
            }

            .stats-label {
              font-size: 11px;
              color: #909399;
            }

            .stats-value {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
            }
          }
        }
      }

      .leader-status {
        margin: 20px 0;
        padding: 16px;
        background: #f4f4f5;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #e4e7ed;

        &.active {
          background: #fef5e7;
          border-color: #e6a23c;

          .leader-icon {
            font-size: 32px;
          }
        }

        .leader-icon {
          font-size: 28px;
        }

        .leader-info {
          flex: 1;

          .leader-title {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .leader-subtitle {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .controller-queues {
        margin: 20px 0;

        .queues-title {
          font-size: 13px;
          font-weight: 500;
          color: #606266;
          margin-bottom: 12px;
        }

        .queue-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;

          @media (max-width: 1400px) {
            grid-template-columns: repeat(2, 1fr);
          }

          .queue-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background: #f4f4f5;
            border-radius: 8px;
            border: 1px solid #e4e7ed;
            transition: all 0.3s ease;

            &:hover {
              border-color: #409eff;
            }

            .queue-icon {
              font-size: 20px;
            }

            .queue-info {
              flex: 1;

              .queue-name {
                font-size: 11px;
                color: #909399;
                margin-bottom: 4px;
              }

              .queue-value {
                font-size: 16px;
                font-weight: 600;
                color: #303133;
              }
            }
          }
        }
      }

      .chart-section {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e4e7ed;

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .chart-title {
            font-size: 13px;
            font-weight: 500;
            color: #606266;
          }

          .chart-legend {
            display: flex;
            gap: 12px;

            .legend-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              color: #909399;

              .legend-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
              }
            }
          }
        }

        .chart-container {
          height: 240px;
          width: 100%;
        }
      }

      .detail-panel {
        margin-top: 16px;
        border-top: 1px solid #e4e7ed;
        padding-top: 12px;

        .panel-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f4f4f5;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          user-select: none;

          &:hover {
            background: #e9e9eb;
          }

          span {
            font-size: 12px;
            font-weight: 500;
            color: #606266;
          }

          .arrow {
            font-size: 11px;
            color: #909399;
            transition: transform 0.3s ease;

            &.up {
              transform: rotate(180deg);
            }
          }
        }

        .panel-content {
          padding: 12px 0;

          .detail-section {
            margin-bottom: 16px;

            &:last-child {
              margin-bottom: 0;
            }

            .section-title {
              font-size: 12px;
              font-weight: 500;
              color: #606266;
              margin-bottom: 10px;
              padding-bottom: 6px;
              border-bottom: 1px solid #e4e7ed;
            }

            .detail-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 10px;

              .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f4f4f5;
                border-radius: 6px;

                .label {
                  font-size: 11px;
                  color: #909399;
                }

                .value {
                  font-size: 13px;
                  font-weight: 500;
                  color: #303133;

                  &.danger {
                    color: #f56c6c;
                  }

                  &.warning {
                    color: #e6a23c;
                  }
                }
              }
            }

            .verb-distribution,
            .failure-reasons {
              .verb-item,
              .reason-item {
                margin-bottom: 12px;

                .verb-header,
                .reason-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 6px;

                  .verb-name,
                  .reason-label {
                    font-size: 12px;
                    color: #606266;
                    font-weight: 500;
                  }

                  .verb-value,
                  .reason-value {
                    font-size: 13px;
                    font-weight: 600;
                    color: #303133;
                  }
                }

                .verb-bar,
                .reason-bar {
                  height: 6px;
                  background: #e4e7ed;
                  border-radius: 3px;
                  overflow: hidden;

                  .bar-fill {
                    height: 100%;
                    background: #409eff;
                    transition: width 0.5s ease;
                    border-radius: 3px;
                  }
                }
              }
            }

            .status-code-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;

              .status-group {
                padding: 12px;
                border-radius: 8px;
                text-align: center;

                &.success {
                  background: #e8f5e9;
                  border: 1px solid #67c23a;
                }

                &.redirect {
                  background: #e3f2fd;
                  border: 1px solid #409eff;
                }

                &.client-error {
                  background: #fff3e0;
                  border: 1px solid #e6a23c;
                }

                &.server-error {
                  background: #ffebee;
                  border: 1px solid #f56c6c;
                }

                .group-title {
                  font-size: 11px;
                  color: #909399;
                  margin-bottom: 6px;
                }

                .group-value {
                  font-size: 18px;
                  font-weight: 600;
                  color: #303133;
                }
              }
            }
          }
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: white;
      border-radius: 12px;
      padding: 60px 40px;

      .empty-icon {
        font-size: 64px;
        margin-bottom: 20px;
        opacity: 0.5;
      }

      h3 {
        margin: 0 0 10px;
        font-size: 18px;
        color: #303133;
        font-weight: 500;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .slide-enter-active,
  .slide-leave-active {
    transition: all 0.3s ease;
    max-height: 2000px;
    overflow: hidden;
  }

  .slide-enter-from,
  .slide-leave-to {
    max-height: 0;
    opacity: 0;
  }
</style>
