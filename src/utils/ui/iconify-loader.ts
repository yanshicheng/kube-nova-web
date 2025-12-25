/**
 * 离线图标加载器（扩展版）
 *
 * 用于在内网环境下支持 Iconify 图标的离线加载。
 * 通过预加载图标集数据，避免运行时从 CDN 获取图标。
 *
 * 使用方式：
 * 1. 安装所需图标集：pnpm add -D @iconify-json/[icon-set-name]
 * 2. 在此文件中导入并注册图标集
 * 3. 在组件中使用：<ArtSvgIcon icon="ri:home-line" />
 *
 * @module utils/ui/iconify-loader
 * @author Kube Nova Team
 */

import { addCollection } from '@iconify/vue'

// ==================== 基础图标库 ====================

// 系统必要图标库 - Remix Icon (主要使用)
import riIcons from '@iconify-json/ri/icons.json'

// 演示图标库（可选，生产环境可移除）
import svgSpinners from '@iconify-json/svg-spinners/icons.json'
import lineMd from '@iconify-json/line-md/icons.json'

// ==================== 技术栈图标库 ====================

// Logos - 包含各种技术 Logo（Docker、K8s、云服务等）
import logosIcons from '@iconify-json/logos/icons.json'

// Simple Icons - 品牌和技术图标
import simpleIcons from '@iconify-json/simple-icons/icons.json'

// Devicon - 开发工具和技术图标
import deviconIcons from '@iconify-json/devicon/icons.json'

// Skill Icons - 编程语言和框架图标
import skillIcons from '@iconify-json/skill-icons/icons.json'

// ==================== 扩展图标库（可选）====================

// Material Design Icons - 超全面的图标库
import mdiIcons from '@iconify-json/mdi/icons.json'

// Carbon - IBM 设计系统图标
import carbonIcons from '@iconify-json/carbon/icons.json'


// ==================== 注册基础图标集 ====================

// 注册 Remix Icon 图标集（主要图标库）
addCollection(riIcons)

// 注册 SVG Spinners 图标集（加载动画图标）
addCollection(svgSpinners)

// 注册 Line MD 图标集（Material Design 风格图标）
addCollection(lineMd)

// ==================== 注册技术栈图标集 ====================

// 注册 Logos 图标集（Docker、K8s、云服务等 Logo）
addCollection(logosIcons)

// 注册 Simple Icons 图标集（品牌图标）
addCollection(simpleIcons)

// 注册 Devicon 图标集（开发工具）
addCollection(deviconIcons)

// 注册 Skill Icons 图标集（编程技能）
addCollection(skillIcons)

// ==================== 注册扩展图标集 ====================

// 注册 Material Design Icons 图标集（超全面）
addCollection(mdiIcons)

// 注册 Carbon 图标集（IBM 设计）
addCollection(carbonIcons)

/**
 * 已加载的图标集说明：
 *
 * 1. ri: - Remix Icon (系统通用图标)
 *    - 使用: <ArtSvgIcon icon="ri:home-line" />
 *
 * 2. logos: - 技术 Logo (Docker, K8s, 云服务等)
 *    - 使用: <ArtSvgIcon icon="logos:docker-icon" />
 *    - 使用: <ArtSvgIcon icon="logos:kubernetes" />
 *
 * 3. simple-icons: - 品牌图标
 *    - 使用: <ArtSvgIcon icon="simple-icons:docker" />
 *
 * 4. devicon: - 开发工具图标
 *    - 使用: <ArtSvgIcon icon="devicon:docker" />
 *
 * 5. skill-icons: - 编程语言图标
 *    - 使用: <ArtSvgIcon icon="skill-icons:docker" />
 *
 * 6. mdi: - Material Design Icons (超全面)
 *    - 使用: <ArtSvgIcon icon="mdi:docker" />
 *
 * 7. carbon: - IBM Carbon Design
 *    - 使用: <ArtSvgIcon icon="carbon:container-software" />
 *
 * 8. svg-spinners: - 加载动画
 *    - 使用: <ArtSvgIcon icon="svg-spinners:blocks-shuffle-3" />
 *
 * 9. line-md: - 动画图标
 *    - 使用: <ArtSvgIcon icon="line-md:loading-loop" />
 */
