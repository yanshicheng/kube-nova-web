/**
 * 资源单位转换工具
 * 支持 CPU 和内存/存储的单位转换
 */

// CPU 单位类型
export type CpuUnit = 'core' | 'm' // 核心、毫核

// 内存/存储单位类型
export type MemoryUnit = 'Ki' | 'Mi' | 'Gi' | 'Ti'

// 资源类型
export type ResourceType = 'cpu' | 'memory'

// 解析后的资源对象
export interface ParsedResource {
  value: number
  unit: CpuUnit | MemoryUnit
  raw: string
}

/**
 * 解析 CPU 资源字符串
 * 支持格式：1、1000m、1.5、0.5
 * @param str CPU 字符串
 * @returns 解析后的对象
 */
export function parseCpu(str: string | number | undefined | null): ParsedResource {
  if (!str || str === '' || str === '0') {
    return { value: 0, unit: 'core', raw: '0' }
  }

  const strValue = String(str).trim()

  // 匹配毫核格式：1000m
  const milliMatch = strValue.match(/^(\d+(?:\.\d+)?)\s*m$/i)
  if (milliMatch) {
    const value = parseFloat(milliMatch[1])
    return { value, unit: 'm', raw: strValue }
  }

  // 纯数字，默认为核心
  const numValue = parseFloat(strValue)
  if (!isNaN(numValue)) {
    return { value: numValue, unit: 'core', raw: strValue }
  }

  return { value: 0, unit: 'core', raw: '0' }
}

/**
 * 【新增】将 CPU 转换为核心数（用于计算）
 * 1000m -> 1
 * 2 -> 2
 */
export function getCpuInCore(str: string | number | undefined | null): number {
  const parsed = parseCpu(str)
  if (parsed.unit === 'm') {
    return parsed.value / 1000
  }
  return parsed.value
}

/**
 * 格式化 CPU 为字符串
 * @param value 数值
 * @param unit 单位
 * @returns 格式化后的字符串
 */
export function formatCpu(value: number, unit: CpuUnit): string {
  if (!value || value === 0) return '0'

  if (unit === 'm') {
    return `${value}m`
  }
  return String(value)
}

/**
 * 解析内存/存储资源字符串
 * 支持格式：100Ki、100Mi、100Gi、100Ti、100K、100M、100G、100T、100（默认字节）
 * 统一转换为二进制单位（Ki、Mi、Gi、Ti）
 * @param str 内存/存储字符串
 * @returns 解析后的对象
 */
export function parseMemory(str: string | number | undefined | null): ParsedResource {
  if (!str || str === '' || str === '0') {
    return { value: 0, unit: 'Gi', raw: '0' }
  }

  const strValue = String(str).trim()

  // 匹配二进制单位：100Ki、100Mi、100Gi、100Ti
  const binaryMatch = strValue.match(/^(\d+(?:\.\d+)?)\s*(Ki|Mi|Gi|Ti)$/i)
  if (binaryMatch) {
    const value = parseFloat(binaryMatch[1])
    const unit = (binaryMatch[2].charAt(0).toUpperCase() +
      binaryMatch[2].charAt(1).toLowerCase()) as MemoryUnit
    return { value, unit, raw: strValue }
  }

  // 匹配十进制单位（需要转换）：100K、100M、100G、100T
  const decimalMatch = strValue.match(/^(\d+(?:\.\d+)?)\s*([KMGT])$/i)
  if (decimalMatch) {
    const value = parseFloat(decimalMatch[1])
    const decimalUnit = decimalMatch[2].toUpperCase()

    // 转换为 Bytes，然后让下面的逻辑重新分配最佳单位
    let bytes = 0
    switch (decimalUnit) {
      case 'K': bytes = value * 1000; break
      case 'M': bytes = value * 1000 * 1000; break
      case 'G': bytes = value * 1000 * 1000 * 1000; break
      case 'T': bytes = value * 1000 * 1000 * 1000 * 1000; break
    }
    // 递归调用自己来格式化 Bytes 为 Ki/Mi/Gi
    return parseMemory(bytes)
  }

  // 纯数字，默认为字节，转换为最合适的单位
  const numValue = parseFloat(strValue)
  if (!isNaN(numValue)) {
    // 字节转换为最合适的单位
    if (numValue >= 1024 * 1024 * 1024 * 1024) {
      return {
        value: parseFloat((numValue / (1024 * 1024 * 1024 * 1024)).toFixed(3)),
        unit: 'Ti',
        raw: strValue
      }
    } else if (numValue >= 1024 * 1024 * 1024) {
      return {
        value: parseFloat((numValue / (1024 * 1024 * 1024)).toFixed(3)),
        unit: 'Gi',
        raw: strValue
      }
    } else if (numValue >= 1024 * 1024) {
      return { value: parseFloat((numValue / (1024 * 1024)).toFixed(3)), unit: 'Mi', raw: strValue }
    } else if (numValue >= 1024) {
      return { value: parseFloat((numValue / 1024).toFixed(3)), unit: 'Ki', raw: strValue }
    }
    // 小于 1024 字节，显示为 Ki 但数值很小，或者保留原样
    return { value: parseFloat((numValue / 1024).toFixed(3)), unit: 'Ki', raw: strValue }
  }

  return { value: 0, unit: 'Gi', raw: '0' }
}

/**
 * 【新增】将内存转换为字节数（用于计算）
 */
export function getMemoryInBytes(str: string | number | undefined | null): number {
  if (!str) return 0

  // 先解析得到数值和单位
  const parsed = parseMemory(str)

  // 转换基准：Bytes
  const base = 1024
  let multiplier = 1

  switch (parsed.unit) {
    case 'Ti': multiplier = Math.pow(base, 4); break;
    case 'Gi': multiplier = Math.pow(base, 3); break;
    case 'Mi': multiplier = Math.pow(base, 2); break;
    case 'Ki': multiplier = base; break;
  }

  return parsed.value * multiplier
}

/**
 * 格式化内存/存储为字符串
 * @param value 数值
 * @param unit 单位
 * @returns 格式化后的字符串
 */
export function formatMemory(value: number, unit: MemoryUnit): string {
  if (!value || value === 0) return '0'
  return `${value}${unit}`
}

/**
 * 转换内存/存储到指定单位
 * @param value 数值
 * @param fromUnit 源单位
 * @param toUnit 目标单位
 * @returns 转换后的数值
 */
export function convertMemoryUnit(value: number, fromUnit: MemoryUnit, toUnit: MemoryUnit): number {
  const units: MemoryUnit[] = ['Ki', 'Mi', 'Gi', 'Ti']
  const fromIndex = units.indexOf(fromUnit)
  const toIndex = units.indexOf(toUnit)

  if (fromIndex === -1 || toIndex === -1) return value

  const diff = fromIndex - toIndex
  return value * Math.pow(1024, diff)
}

/**
 * 转换 CPU 到指定单位
 * @param value 数值
 * @param fromUnit 源单位
 * @param toUnit 目标单位
 * @returns 转换后的数值
 */
export function convertCpuUnit(value: number, fromUnit: CpuUnit, toUnit: CpuUnit): number {
  if (fromUnit === toUnit) return value

  if (fromUnit === 'core' && toUnit === 'm') {
    return value * 1000
  }

  if (fromUnit === 'm' && toUnit === 'core') {
    return value / 1000
  }

  return value
}

/**
 * 格式化资源展示（用于前端展示）
 * @param str 资源字符串
 * @param type 资源类型
 * @returns 格式化后的展示字符串
 */
export function formatResourceDisplay(
  str: string | number | undefined | null,
  type: ResourceType
): string {
  if (!str || str === '' || str === '0') return '0'

  if (type === 'cpu') {
    const parsed = parseCpu(str)
    if (parsed.unit === 'm') {
      return `${parsed.value} 毫核`
    }
    return `${parsed.value} 核`
  }

  if (type === 'memory') {
    const parsed = parseMemory(str)
    return `${parsed.value} ${parsed.unit}`
  }

  return String(str)
}

/**
 * CPU 单位选项
 */
export const CPU_UNITS: { label: string; value: CpuUnit }[] = [
  { label: '核', value: 'core' },
  { label: '毫核 (m)', value: 'm' }
]

/**
 * 内存/存储单位选项（Kubernetes 标准格式）
 */
export const MEMORY_UNITS: { label: string; value: MemoryUnit }[] = [
  { label: 'Ki', value: 'Ki' },
  { label: 'Mi', value: 'Mi' },
  { label: 'Gi', value: 'Gi' },
  { label: 'Ti', value: 'Ti' }
]

/**
 * ==================== 新增：单位标准化函数 ====================
 * 去除数字尾部多余的零，简单的单位替换
 */

/**
 * 去除数字尾部多余的零和小数点
 * 1.000 -> 1
 * 0.500 -> 0.5
 * 100.000 -> 100
 */
function trimTrailingZeros(numStr: string): string {
  if (!numStr.includes('.')) return numStr

  // 去除尾部的零
  let trimmed = numStr.replace(/\.?0+$/, '')

  // 如果只剩下小数点，去掉
  if (trimmed.endsWith('.')) {
    trimmed = trimmed.slice(0, -1)
  }

  return trimmed
}

/**
 * 标准化 CPU 值
 * 保持用户输入的数字，不添加多余的小数位
 * @param input - 输入值
 * @returns 标准化后的字符串
 */
export function normalizeCpu(input: string | number | undefined | null): string {
  if (!input || input === '' || input === '0') return ''

  const strValue = String(input).trim()

  // 匹配毫核格式：1000m, 500m, 100.5m
  const milliMatch = strValue.match(/^(\d+(?:\.\d+)?)\s*m$/i)
  if (milliMatch) {
    const num = trimTrailingZeros(milliMatch[1])
    return `${num}m`
  }

  // 纯数字：1, 0.5, 2
  const numValue = parseFloat(strValue)
  if (!isNaN(numValue)) {
    return trimTrailingZeros(String(numValue))
  }

  console.warn(`[normalizeCpu] 无效的CPU格式: ${strValue}`)
  return ''
}

/**
 * 标准化内存值 - 超级简单版
 * 只换单位，数字不变！
 * 100M → 100Mi
 * 1G → 1Gi
 * @param input - 输入值
 * @returns 标准化后的字符串
 */
export function normalizeMemory(input: string | number | undefined | null): string {
  if (!input || input === '' || input === '0') return ''

  const strValue = String(input).trim()

  // 二进制单位：保持不变，去除多余的零
  const binaryMatch = strValue.match(/^(\d+(?:\.\d+)?)\s*(Ki|Mi|Gi|Ti)$/i)
  if (binaryMatch) {
    const num = trimTrailingZeros(binaryMatch[1])
    const unit = (binaryMatch[2].charAt(0).toUpperCase() +
      binaryMatch[2].charAt(1).toLowerCase())
    return `${num}${unit}`
  }

  // 十进制单位：直接换成二进制单位（数字不变！）
  const decimalMatch = strValue.match(/^(\d+(?:\.\d+)?)\s*([KMGT])$/i)
  if (decimalMatch) {
    const num = trimTrailingZeros(decimalMatch[1])
    const decimalUnit = decimalMatch[2].toUpperCase()

    // 直接换单位，不换算！
    let binaryUnit = ''
    switch (decimalUnit) {
      case 'K': binaryUnit = 'Ki'; break
      case 'M': binaryUnit = 'Mi'; break
      case 'G': binaryUnit = 'Gi'; break
      case 'T': binaryUnit = 'Ti'; break
    }

    return `${num}${binaryUnit}`
  }

  // 纯数字（不允许）
  const numValue = parseFloat(strValue)
  if (!isNaN(numValue)) {
    console.warn(`[normalizeMemory] 请指定单位（Ki/Mi/Gi/Ti）: ${strValue}`)
    return ''
  }

  console.warn(`[normalizeMemory] 无效的内存格式: ${strValue}`)
  return ''
}

/**
 * 验证 CPU 格式
 */
export function isValidCpuFormat(input: string | number | undefined | null): boolean {
  if (!input || input === '' || input === '0') return true

  const strValue = String(input).trim()

  // 匹配毫核格式：1000m
  if (/^(\d+(?:\.\d+)?)\s*m$/i.test(strValue)) return true

  // 纯数字
  const numValue = parseFloat(strValue)
  if (!isNaN(numValue)) return true

  return false
}

/**
 * 验证内存格式（只接受二进制单位）
 */
export function isValidMemoryFormat(input: string | number | undefined | null): boolean {
  if (!input || input === '' || input === '0') return true

  const strValue = String(input).trim()

  // 只接受二进制单位：100Ki、100Mi、100Gi、100Ti
  return /^(\d+(?:\.\d+)?)\s*(Ki|Mi|Gi|Ti)$/i.test(strValue)
}