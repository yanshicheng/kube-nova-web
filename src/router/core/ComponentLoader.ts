/**
 * 组件加载器
 *
 * 负责动态加载 Vue 组件
 *
 * @module router/core/ComponentLoader
 * @author Kube Nova Team
 */

import { h } from 'vue'

export class ComponentLoader {
  private modules: Record<string, () => Promise<any>>

  constructor() {
    // 动态导入 views 目录下所有 .vue 组件
    this.modules = import.meta.glob('../../views/**/*.vue')
  }

  /**
   * 加载组件
   *
   * 路径规则：
   * 1. 如果路径以 .vue 结尾：直接加载该文件
   *    例如: /dashboard/console.vue → views/dashboard/console.vue
   *
   * 2. 如果路径不以 .vue 结尾：优先加载 /index.vue
   *    例如: /dashboard/console → views/dashboard/console/index.vue
   *    如果不存在，再尝试加载 .vue 文件
   */
  load(componentPath: string): () => Promise<any> {
    if (!componentPath) {
      console.warn('[ComponentLoader] 组件路径为空，返回空组件')
      return this.createEmptyComponent()
    }

    let module: (() => Promise<any>) | undefined

    // 🔥 如果路径已经包含 .vue 后缀，直接使用
    if (componentPath.endsWith('.vue')) {
      const fullPath = `../../views${componentPath}`
      module = this.modules[fullPath]

      if (!module) {
        console.error(
          `[ComponentLoader] ❌ 未找到组件: ${componentPath}\n` +
            `  尝试的路径: ${fullPath}\n` +
            `  提示: 请检查文件是否存在`
        )
        return this.createErrorComponent(componentPath)
      }

      return module
    }

    // 🔥 不包含 .vue 后缀，优先尝试 /index.vue，再尝试 .vue
    const fullPathWithIndex = `../../views${componentPath}/index.vue`
    const fullPath = `../../views${componentPath}.vue`

    // 先尝试 index.vue
    module = this.modules[fullPathWithIndex]

    if (module) {
      return module
    }

    // 再尝试直接 .vue 文件
    module = this.modules[fullPath]

    if (module) {
      return module
    }

    // 🔥 两种路径都找不到，记录详细错误
    console.error(
      `[ComponentLoader] ❌ 未找到组件: ${componentPath}\n` +
        `  尝试的路径:\n` +
        `    1. ${fullPathWithIndex}\n` +
        `    2. ${fullPath}\n` +
        `  提示: 请检查以下内容:\n` +
        `    - 文件是否存在于 views 目录\n` +
        `    - 文件路径是否正确\n` +
        `    - 是否需要添加 .vue 后缀`
    )

    return this.createErrorComponent(componentPath)
  }

  /**
   * 加载布局组件
   */
  loadLayout(): () => Promise<any> {
    const layoutPath = '@/views/index/index.vue'
    return () => import('@/views/index/index.vue')
  }

  /**
   * 加载 iframe 组件
   */
  loadIframe(): () => Promise<any> {
    const iframePath = '@/views/outside/Iframe.vue'
    return () => import('@/views/outside/Iframe.vue')
  }

  /**
   * 创建空组件
   */
  private createEmptyComponent(): () => Promise<any> {
    return () =>
      Promise.resolve({
        render() {
          return h('div', {})
        }
      })
  }

  /**
   * 创建错误提示组件
   */
  private createErrorComponent(componentPath: string): () => Promise<any> {
    return () =>
      Promise.resolve({
        render() {
          return h(
            'div',
            {
              class: 'route-error',
              style: {
                padding: '20px',
                color: '#f56c6c',
                backgroundColor: '#fef0f0',
                border: '1px solid #fde2e2',
                borderRadius: '4px',
                margin: '20px'
              }
            },
            [
              h('h3', { style: { margin: '0 0 10px 0' } }, '❌ 组件加载失败'),
              h('p', { style: { margin: '5px 0' } }, `组件路径: ${componentPath}`),
              h(
                'p',
                { style: { margin: '5px 0', fontSize: '12px', color: '#909399' } },
                '请检查组件文件是否存在，或查看控制台获取详细信息'
              )
            ]
          )
        }
      })
  }
}
