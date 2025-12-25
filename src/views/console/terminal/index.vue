<template>
  <div class="terminal-manager" @contextmenu.prevent>
    <!-- 顶部工具栏 -->
    <div class="terminal-header">
      <div class="header-left">
        <div class="logo-section">
          <Terminal :size="20" class="logo-icon" />
          <span class="logo-text">Terminal</span>
        </div>
        <div class="divider" />
        <div class="pod-info">
          <Server :size="16" />
          <span class="pod-name">{{ podName }}</span>
        </div>
      </div>

      <div class="header-center">
        <div class="container-selector">
          <Package :size="16" />
          <ElSelect
            v-model="selectedContainer"
            placeholder="选择容器"
            size="default"
            class="container-select"
            :loading="loadingContainers"
            @change="handleContainerChange"
          >
            <ElOption
              v-for="container in allContainers"
              :key="container.name"
              :label="container.name"
              :value="container.name"
            >
              <div class="container-option">
                <ElTag
                  size="small"
                  :type="getContainerTagType(container.type)"
                  class="container-tag"
                >
                  {{ container.type }}
                </ElTag>
                <span class="container-name">{{ container.name }}</span>
                <div class="container-state" :class="`state-${container.state}`">
                  <div class="state-dot" />
                  <span>{{ container.state }}</span>
                </div>
              </div>
            </ElOption>
          </ElSelect>
        </div>

        <div class="connection-status" :class="{ connected: isConnected }">
          <div class="status-dot" />
          <span>{{ connectionStatusText }}</span>
        </div>
      </div>

      <div class="header-right">
        <ElTooltip content="重新连接 (Ctrl+R)" placement="bottom">
          <button class="action-btn" @click="handleReconnect" :disabled="isConnecting">
            <RefreshCw :size="16" :class="{ spin: isConnecting }" />
          </button>
        </ElTooltip>

        <ElTooltip content="清屏 (Ctrl+K)" placement="bottom">
          <button class="action-btn" @click="handleClear">
            <Trash2 :size="16" />
          </button>
        </ElTooltip>

        <ElTooltip content="复制 (Ctrl+Shift+C)" placement="bottom">
          <button class="action-btn" @click="handleCopy" :disabled="!hasSelection">
            <Copy :size="16" />
          </button>
        </ElTooltip>

        <ElTooltip content="粘贴 (Ctrl+Shift+V)" placement="bottom">
          <button class="action-btn" @click="handlePaste">
            <Clipboard :size="16" />
          </button>
        </ElTooltip>

        <div class="divider" />

        <ElTooltip content="断开连接 (Ctrl+D)" placement="bottom">
          <button class="action-btn danger" @click="handleDisconnect">
            <Power :size="16" />
          </button>
        </ElTooltip>
      </div>
    </div>

    <!-- 终端主体 -->
    <div class="terminal-body">
      <div ref="terminalRef" class="terminal-container" />

      <!-- 连接中遮罩 -->
      <div v-if="isConnecting" class="connecting-overlay">
        <div class="connecting-content">
          <div class="loading-spinner" />
          <p class="connecting-text">正在连接终端...</p>
          <p class="connecting-hint">{{ podName }} / {{ selectedContainer }}</p>
        </div>
      </div>

      <!-- 断开连接遮罩 -->
      <div v-if="!isConnected && !isConnecting" class="disconnected-overlay">
        <div class="disconnected-content">
          <Terminal :size="64" class="disconnected-icon" />
          <p class="disconnected-text">终端未连接</p>
          <p class="disconnected-hint">{{ disconnectReason || '选择容器并点击重新连接' }}</p>
          <ElButton type="primary" size="large" @click="handleReconnect" class="reconnect-btn">
            <RefreshCw :size="16" />
            重新连接
          </ElButton>
        </div>
      </div>

      <!-- 右键菜单 -->
      <transition name="fade">
        <div
          v-if="showContextMenu"
          class="context-menu"
          :style="contextMenuStyle"
          @click="hideContextMenu"
        >
          <div class="menu-item" @click="handleCopy" :class="{ disabled: !hasSelection }">
            <Copy :size="14" />
            <span>复制</span>
            <span class="shortcut">Ctrl+Shift+C</span>
          </div>
          <div class="menu-item" @click="handlePaste">
            <Clipboard :size="14" />
            <span>粘贴</span>
            <span class="shortcut">Ctrl+Shift+V</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item" @click="handleClear">
            <Trash2 :size="14" />
            <span>清屏</span>
            <span class="shortcut">Ctrl+K</span>
          </div>
          <div class="menu-item" @click="handleSelectAll">
            <Mouse :size="14" />
            <span>全选</span>
            <span class="shortcut">Ctrl+A</span>
          </div>
        </div>
      </transition>
    </div>

    <!-- 底部状态栏 -->
    <div class="terminal-footer">
      <div class="footer-left">
        <div class="status-item">
          <Activity :size="14" />
          <span>{{ totalLines }} 行</span>
        </div>
        <div class="status-item">
          <Clock :size="14" />
          <span>{{ connectionDuration }}</span>
        </div>
      </div>

      <div class="footer-right">
        <div class="status-item clickable" @click="handleResize">
          <Monitor :size="14" />
          <span>{{ terminalSize.cols }}x{{ terminalSize.rows }}</span>
        </div>
        <div class="status-item">
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    Terminal,
    Server,
    Package,
    RefreshCw,
    Trash2,
    Copy,
    Clipboard,
    Power,
    Activity,
    Clock,
    Monitor,
    Mouse
  } from 'lucide-vue-next'
  import { Terminal as XTerm } from 'xterm'
  import { FitAddon } from 'xterm-addon-fit'
  import { WebLinksAddon } from 'xterm-addon-web-links'
  import 'xterm/css/xterm.css'
  import {
    getPodContainerListInWorkloadApi,
    getPodExecTerminalUrl,
    createWebSocket,
    WSMessageType,
    type ContainerInfoList,
    type ContainerInfo
  } from '@/api'

  const route = useRoute()

  // 路由参数
  const workloadId = ref(Number(route.query.workloadId))
  const podName = ref(String(route.query.podName))

  // 容器相关
  const loadingContainers = ref(false)
  const containerData = ref<ContainerInfoList | null>(null)
  const selectedContainer = ref('')

  interface ExtendedContainer extends ContainerInfo {
    type: 'init' | 'container' | 'ephemeral'
  }

  // 🔥 修复：优先返回主容器
  const allContainers = computed<ExtendedContainer[]>(() => {
    if (!containerData.value) return []
    const containers: ExtendedContainer[] = []

    // 🔥 重要：先添加主容器
    containerData.value.containers?.forEach((c) => {
      containers.push({ ...c, type: 'container' })
    })
    // 然后是 init 容器
    containerData.value.initContainers?.forEach((c) => {
      containers.push({ ...c, type: 'init' })
    })
    // 最后是临时容器
    containerData.value.ephemeralContainers?.forEach((c) => {
      containers.push({ ...c, type: 'ephemeral' })
    })

    return containers
  })

  // 终端相关
  const terminalRef = ref<HTMLElement>()
  let terminal: XTerm | null = null
  let fitAddon: FitAddon | null = null
  let ws: WebSocket | null = null
  let pingInterval: number | null = null

  // 连接状态
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const disconnectReason = ref('')

  const connectionStatusText = computed(() => {
    if (isConnecting.value) return '连接中...'
    if (isConnected.value) return '已连接'
    return '未连接'
  })

  // 统计信息
  const totalLines = ref(0)
  const connectionStartTime = ref<Date | null>(null)
  const connectionDuration = ref('00:00')
  const terminalSize = ref({ cols: 80, rows: 24 })

  // 右键菜单
  const showContextMenu = ref(false)
  const contextMenuStyle = ref({ top: '0px', left: '0px' })
  const hasSelection = ref(false)

  // 获取容器标签类型
  function getContainerTagType(type: string) {
    const typeMap: Record<string, any> = {
      init: 'info',
      container: 'success',
      ephemeral: 'warning'
    }
    return typeMap[type] || 'default'
  }

  // 加载容器列表
  async function loadContainers() {
    if (!workloadId.value || !podName.value) {
      return
    }

    loadingContainers.value = true
    try {
      const response = await getPodContainerListInWorkloadApi(workloadId.value, {
        podName: podName.value
      })
      containerData.value = response

      // 🔥 修复：优先选择第一个主容器
      if (allContainers.value.length > 0) {
        selectedContainer.value = allContainers.value[0].name
      }
    } catch (error) {
      console.error('加载容器列表失败:', error)
    } finally {
      loadingContainers.value = false
    }
  }

  // 初始化终端
  function initTerminal() {
    if (!terminalRef.value) return

    terminal = new XTerm({
      fontSize: 14,
      lineHeight: 1.2,
      fontFamily:
        '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, Monaco, "Courier New", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#0a0e1a',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        cursorAccent: '#0a0e1a',
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc'
      },
      allowTransparency: true,
      scrollback: 10000,
      convertEol: true,
      rightClickSelectsWord: true
    })

    fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new WebLinksAddon())

    terminal.open(terminalRef.value)
    fitAddon.fit()

    terminalSize.value = {
      cols: terminal.cols,
      rows: terminal.rows
    }

    // 监听输入
    terminal.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: WSMessageType.EXEC_STDIN,
            data: { data }
          })
        )
      }
    })

    // 监听选择变化
    terminal.onSelectionChange(() => {
      hasSelection.value = terminal.hasSelection()
    })

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)

    // 设置窗口标题
    updateWindowTitle()
  }

  // 处理终端大小变化
  function handleResize() {
    if (!terminal || !fitAddon) return

    fitAddon.fit()
    terminalSize.value = {
      cols: terminal.cols,
      rows: terminal.rows
    }

    // 发送 resize 消息
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: WSMessageType.EXEC_RESIZE,
          data: {
            rows: terminal.rows,
            cols: terminal.cols
          }
        })
      )
    }
  }

  // 更新窗口标题
  function updateWindowTitle() {
    const status = isConnected.value ? '●' : '○'
    document.title = `${status} ${podName.value} | Terminal`
  }

  // 连接 WebSocket
  function connectWebSocket() {
    if (!selectedContainer.value) {
      return
    }

    isConnecting.value = true
    disconnectReason.value = ''

    try {
      // 🔥 修复：优先使用 bash，如果不存在则使用 sh
      const url = getPodExecTerminalUrl({
        workloadId: workloadId.value,
        podName: podName.value,
        container: selectedContainer.value,
        command: ['/bin/bash'], // 🔥 修复：默认使用 bash
        rows: terminal?.rows || 24,
        cols: terminal?.cols || 80
      })


      ws = createWebSocket(url, handleWSMessage, handleWSError, handleWSClose)

      ws.addEventListener('open', () => {
        isConnecting.value = false
        isConnected.value = true
        connectionStartTime.value = new Date()
        ElMessage.success('终端连接成功')
        startPing()
        startDurationTimer()
        updateWindowTitle()

        // 聚焦终端
        terminal?.focus()
      })
    } catch (error) {
      console.error('[终端] 连接失败:', error)
      isConnecting.value = false
    }
  }

  // 处理 WebSocket 消息
  function handleWSMessage(data: any) {
    if (!data || !terminal) return

    switch (data.type) {
      case WSMessageType.EXEC_INIT:
        terminal.clear()
        totalLines.value = 0
        break

      case WSMessageType.EXEC_STDOUT:
      case WSMessageType.EXEC_STDERR:
        const output = data.data?.data || ''
        terminal.write(output)
        // 统计行数
        totalLines.value += (output.match(/\n/g) || []).length
        break

      case WSMessageType.EXEC_EXIT:
        const exitMsg = data.data?.message || '会话结束'
        terminal.writeln(`\r\n\x1b[33m${exitMsg}\x1b[0m`)
        handleDisconnect()
        break

      case WSMessageType.ERROR:
        const errorMsg = data.data?.message || '发生错误'
        terminal.writeln(`\r\n\x1b[31m错误: ${errorMsg}\x1b[0m`)
        if (data.data?.code === 'HEARTBEAT_TIMEOUT') {
          disconnectReason.value = '连接心跳超时'
          handleDisconnect()
        }
        break
    }
  }

  function handleWSError(error: Event) {
    console.error('[终端] WebSocket 错误:', error)
  }

  function handleWSClose(event: CloseEvent) {
    isConnected.value = false
    stopPing()
    stopDurationTimer()
    updateWindowTitle()

    if (event.code !== 1000 && !disconnectReason.value) {
      disconnectReason.value = '连接异常断开'
    }
  }

  // 心跳机制
  function startPing() {
    if (pingInterval) clearInterval(pingInterval)
    pingInterval = window.setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
      }
    }, 20000)
  }

  function stopPing() {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  // 连接时长计时器
  let durationTimer: number | null = null

  function startDurationTimer() {
    if (durationTimer) clearInterval(durationTimer)
    durationTimer = window.setInterval(() => {
      if (connectionStartTime.value) {
        const duration = Math.floor((Date.now() - connectionStartTime.value.getTime()) / 1000)
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60
        connectionDuration.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }
    }, 1000)
  }

  function stopDurationTimer() {
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }
  }

  // 🔥 优化：切换容器自动重连
  function handleContainerChange() {
    if (isConnected.value) {
      // 断开当前连接
      handleDisconnect()

      // 清空终端内容
      if (terminal) {
        terminal.clear()
        totalLines.value = 0
      }

      // 延迟重连新容器
      setTimeout(() => {
        connectWebSocket()
      }, 500)

      ElMessage.info(`正在切换到容器: ${selectedContainer.value}`)
    }
  }

  function handleReconnect() {
    if (isConnected.value) {
      handleDisconnect()
    }
    setTimeout(() => {
      connectWebSocket()
    }, 500)
  }

  function handleClear() {
    if (terminal) {
      terminal.clear()
      totalLines.value = 0
    }
  }

  function handleDisconnect() {
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'User disconnected')
      }
      ws = null
    }
    isConnected.value = false
    isConnecting.value = false
    stopPing()
    stopDurationTimer()
    updateWindowTitle()
  }

  // 复制粘贴
  function handleCopy() {
    if (!terminal || !terminal.hasSelection()) return

    const selection = terminal.getSelection()
    if (selection) {
      navigator.clipboard
        .writeText(selection)
        .then(() => {
          ElMessage.success('已复制到剪贴板')
        })
        .catch(() => {
        })
    }
  }

  async function handlePaste() {
    if (!terminal) return

    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        // 分行发送，避免一次性粘贴大量文本导致问题
        const lines = text.split('\n')
        for (const line of lines) {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: WSMessageType.EXEC_STDIN,
                data: { data: line + (lines.length > 1 ? '\n' : '') }
              })
            )
          }
        }
      }
    } catch (error) {
    }
  }

  function handleSelectAll() {
    if (terminal) {
      terminal.selectAll()
    }
  }

  // 右键菜单
  function showContextMenuAt(e: MouseEvent) {
    e.preventDefault()
    contextMenuStyle.value = {
      top: `${e.clientY}px`,
      left: `${e.clientX}px`
    }
    showContextMenu.value = true
  }

  function hideContextMenu() {
    showContextMenu.value = false
  }

  // 键盘快捷键
  function handleKeyboard(e: KeyboardEvent) {
    // Ctrl+Shift+C: 复制
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault()
      handleCopy()
      return
    }

    // Ctrl+Shift+V: 粘贴
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
      e.preventDefault()
      handlePaste()
      return
    }

    // Ctrl+K: 清屏
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      handleClear()
      return
    }

    // Ctrl+R: 重连
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault()
      handleReconnect()
      return
    }

    // Ctrl+D: 断开
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      handleDisconnect()
      return
    }

    // Ctrl+A: 全选
    if (e.ctrlKey && e.key === 'a' && !isConnected.value) {
      e.preventDefault()
      handleSelectAll()
      return
    }
  }

  // 🔥 页面关闭时清理
  const handleBeforeUnload = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Page unloading')
    }
  }

  // 生命周期
  onMounted(async () => {
    // 设置页面标题
    document.title = `${podName.value} | Terminal`

    await loadContainers()
    initTerminal()

    // 添加键盘事件
    window.addEventListener('keydown', handleKeyboard)

    // 添加右键菜单
    if (terminalRef.value) {
      terminalRef.value.addEventListener('contextmenu', showContextMenuAt)
    }

    // 点击其他地方关闭右键菜单
    document.addEventListener('click', hideContextMenu)

    // 🔥 监听页面关闭
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 延迟自动连接
    setTimeout(() => {
      if (selectedContainer.value) {
        connectWebSocket()
      }
    }, 500)
  })

  onBeforeUnmount(() => {
    handleDisconnect()
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeyboard)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('click', hideContextMenu)
    if (terminal) {
      terminal.dispose()
    }
  })

  // 监听容器变化
  watch(selectedContainer, (newVal) => {
    if (newVal && !isConnected.value && !isConnecting.value) {
      updateWindowTitle()
    }
  })

  // 监听连接状态变化
  watch(isConnected, () => {
    updateWindowTitle()
  })
</script>

<style lang="scss" scoped>
  .terminal-manager {
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;

    // 顶部工具栏
    .terminal-header {
      height: 56px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      gap: 20px;
      flex-shrink: 0;
      user-select: none;

      .header-left,
      .header-center,
      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .logo-section {
        display: flex;
        align-items: center;
        gap: 10px;

        .logo-icon {
          color: #58a6ff;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 600;
          color: #e6edf3;
          letter-spacing: 0.5px;
        }
      }

      .divider {
        width: 1px;
        height: 24px;
        background: rgba(148, 163, 184, 0.2);
      }

      .pod-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: rgba(88, 166, 255, 0.1);
        border-radius: 6px;
        color: #79c0ff;
        font-size: 13px;
        font-family: 'SF Mono', Monaco, Consolas, monospace;

        .pod-name {
          font-weight: 500;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .container-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #94a3b8;

        :deep(.container-select) {
          width: 240px;

          .el-input__wrapper {
            background: rgba(30, 41, 59, 0.6);
            border-color: rgba(148, 163, 184, 0.2);
            box-shadow: none;

            &:hover {
              border-color: rgba(148, 163, 184, 0.4);
            }
          }

          .el-input__inner {
            color: #e6edf3;
          }
        }

        .container-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 0;

          .container-tag {
            font-size: 11px;
            padding: 0 6px;
            height: 20px;
          }

          .container-name {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
          }

          .container-state {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;

            .state-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
            }

            &.state-running .state-dot {
              background: #3fb950;
              box-shadow: 0 0 8px rgba(63, 185, 80, 0.6);
            }

            &.state-waiting .state-dot {
              background: #d29922;
              box-shadow: 0 0 8px rgba(210, 153, 34, 0.6);
            }

            &.state-terminated .state-dot {
              background: #ff7b72;
            }
          }
        }
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: rgba(100, 116, 139, 0.1);
        border-radius: 6px;
        font-size: 13px;
        color: #94a3b8;
        transition: all 0.3s ease;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
          transition: all 0.3s ease;
        }

        &.connected {
          background: rgba(63, 185, 80, 0.1);
          color: #3fb950;

          .status-dot {
            background: #3fb950;
            box-shadow: 0 0 12px rgba(63, 185, 80, 0.8);
            animation: pulse 2s ease-in-out infinite;
          }
        }
      }

      .action-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 6px;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: rgba(88, 166, 255, 0.1);
          border-color: rgba(88, 166, 255, 0.3);
          color: #58a6ff;
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &.danger:hover:not(:disabled) {
          background: rgba(255, 123, 114, 0.1);
          border-color: rgba(255, 123, 114, 0.3);
          color: #ff7b72;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
      }
    }

    // 终端主体
    .terminal-body {
      flex: 1;
      position: relative;
      overflow: hidden;
      padding: 20px;

      .terminal-container {
        width: 100%;
        height: 100%;
        background: rgba(10, 14, 26, 0.6);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        padding: 16px;
        overflow: hidden;

        :deep(.xterm) {
          height: 100% !important;
          padding: 0;
        }

        :deep(.xterm-viewport) {
          background: transparent !important;
        }

        :deep(.xterm-screen) {
          cursor: text;
        }
      }

      .connecting-overlay,
      .disconnected-overlay {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        background: rgba(10, 14, 26, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      .connecting-content,
      .disconnected-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        animation: fadeIn 0.3s ease;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(88, 166, 255, 0.1);
        border-top-color: #58a6ff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .connecting-text,
      .disconnected-text {
        font-size: 18px;
        font-weight: 600;
        color: #e6edf3;
        margin: 0;
      }

      .connecting-hint,
      .disconnected-hint {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
      }

      .disconnected-icon {
        color: #64748b;
        opacity: 0.5;
      }

      .reconnect-btn {
        margin-top: 10px;
        padding: 0 24px;
        height: 40px;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      // 右键菜单
      .context-menu {
        position: fixed;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 8px;
        padding: 4px;
        min-width: 200px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        user-select: none;

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          color: #e6edf3;
          font-size: 13px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(.disabled) {
            background: rgba(88, 166, 255, 0.1);
            color: #58a6ff;
          }

          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .shortcut {
            margin-left: auto;
            font-size: 12px;
            color: #94a3b8;
          }
        }

        .menu-divider {
          height: 1px;
          background: rgba(148, 163, 184, 0.1);
          margin: 4px 0;
        }
      }
    }

    // 底部状态栏
    .terminal-footer {
      height: 32px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(148, 163, 184, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      font-size: 12px;
      color: #94a3b8;
      flex-shrink: 0;
      user-select: none;

      .footer-left,
      .footer-right {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .status-item {
        display: flex;
        align-items: center;
        gap: 6px;

        &.clickable {
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s;

          &:hover {
            background: rgba(88, 166, 255, 0.1);
            color: #58a6ff;
          }
        }
      }
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
