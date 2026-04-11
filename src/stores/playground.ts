import { defineStore } from 'pinia'
import { ref } from 'vue'

import { DEFAULT_IMPORT_MAP, DEFAULT_SFC } from '@/utils/sfcPlayground'

/** localStorage 键：Vue3 知识点 Playground 左侧编辑器 */
const STORAGE_KEY = 'vue3-knowledge-playground-editor'

/**
 * 从本地读取缓存的 SFC / Import Map
 */
function readCache(): { sfcCode: string; importMapCode: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const o = data as Record<string, unknown>
    if (typeof o.sfcCode !== 'string' || typeof o.importMapCode !== 'string') return null
    return { sfcCode: o.sfcCode, importMapCode: o.importMapCode }
  } catch {
    return null
  }
}

/**
 * 写入本地缓存（与 Pinia 状态一致）
 * @param sfcCode App.vue 全文
 * @param importMapCode Import Map JSON 字符串
 */
function writeCache(sfcCode: string, importMapCode: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sfcCode, importMapCode }))
  } catch {
    // 存储配额等错误忽略
  }
}

/**
 * Playground 左侧编辑内容：实时落盘到 localStorage，刷新后恢复
 */
export const usePlaygroundStore = defineStore('vue3KnowledgePlayground', () => {
  const cached = readCache()
  /** 当前 App.vue 源码 */
  const sfcCode = ref(cached?.sfcCode ?? DEFAULT_SFC)
  /** 当前 Import Map JSON */
  const importMapCode = ref(cached?.importMapCode ?? DEFAULT_IMPORT_MAP)

  /**
   * 更新 SFC 并持久化
   * @param v 编辑器内容
   */
  function setSfcCode(v: string) {
    if (sfcCode.value === v) return
    sfcCode.value = v
    writeCache(sfcCode.value, importMapCode.value)
  }

  /**
   * 更新 Import Map 并持久化
   * @param v 编辑器内容
   */
  function setImportMapCode(v: string) {
    if (importMapCode.value === v) return
    importMapCode.value = v
    writeCache(sfcCode.value, importMapCode.value)
  }

  /**
   * 恢复内置默认示例，并立即写入 Pinia 与 localStorage
   */
  function resetToSample() {
    sfcCode.value = DEFAULT_SFC
    importMapCode.value = DEFAULT_IMPORT_MAP
    writeCache(sfcCode.value, importMapCode.value)
  }

  return {
    sfcCode,
    importMapCode,
    setSfcCode,
    setImportMapCode,
    resetToSample,
  }
})
