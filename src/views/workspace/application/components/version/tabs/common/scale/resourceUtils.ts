/**
 * 资源单位解析和转换工具
 */

// CPU 单位
export const CPU_UNITS = ['m', ''] as const
export type CpuUnit = (typeof CPU_UNITS)[number]

// 内存单位
export const MEMORY_UNITS = ['Ki', 'Mi', 'Gi', 'Ti'] as const
export type MemoryUnit = (typeof MEMORY_UNITS)[number]

/**
 * 解析 CPU 值
 * 支持格式：500m, 0.5, 1, 2000m
 * 返回：{ value: number, unit: 'm' | '' }
 */
export function parseCpuValue(cpuStr: string): { value: number; unit: CpuUnit } {
  if (!cpuStr || cpuStr.trim() === '') {
    return { value: 0, unit: 'm' }
  }

  const str = cpuStr.trim()

  // 匹配 m 结尾（如 500m）
  if (str.endsWith('m')) {
    const value = parseFloat(str.slice(0, -1))
    return { value: isNaN(value) ? 0 : value, unit: 'm' }
  }

  // 纯数字（如 0.5, 1, 2）
  const value = parseFloat(str)
  if (!isNaN(value)) {
    return { value, unit: '' }
  }

  return { value: 0, unit: 'm' }
}

/**
 * 组合 CPU 值
 * 输入：{ value: 500, unit: 'm' }
 * 返回：'500m' 或 '0.5'
 */
export function combineCpuValue(value: number, unit: CpuUnit): string {
  if (unit === 'm') {
    return `${value}m`
  } else {
    return `${value}`
  }
}

/**
 * 解析内存值
 * 支持格式：128Mi, 2Gi, 1024Ki, 1Ti, 128M, 2G
 * 返回：{ value: number, unit: 'Ki' | 'Mi' | 'Gi' | 'Ti' }
 */
export function parseMemoryValue(memStr: string): { value: number; unit: MemoryUnit } {
  if (!memStr || memStr.trim() === '') {
    return { value: 0, unit: 'Mi' }
  }

  const str = memStr.trim()

  // 匹配单位（支持 Ki/Mi/Gi/Ti 和 K/M/G/T）
  const match = str.match(/^([\d.]+)(Ki|Mi|Gi|Ti|K|M|G|T)$/i)
  if (match) {
    const value = parseFloat(match[1])
    let unit = match[2]

    // 将 K/M/G/T 转换为 Ki/Mi/Gi/Ti
    if (unit === 'K') unit = 'Ki'
    if (unit === 'M') unit = 'Mi'
    if (unit === 'G') unit = 'Gi'
    if (unit === 'T') unit = 'Ti'

    return {
      value: isNaN(value) ? 0 : value,
      unit: unit as MemoryUnit
    }
  }

  return { value: 0, unit: 'Mi' }
}

/**
 * 组合内存值
 * 输入：{ value: 2, unit: 'Gi' }
 * 返回：'2Gi'
 */
export function combineMemoryValue(value: number, unit: MemoryUnit): string {
  return `${value}${unit}`
}