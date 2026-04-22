<script setup lang="ts">
import { oneDark } from '@codemirror/theme-one-dark'
import { Close, FullScreen, Monitor, Reading, Search, TopRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

import { usePlaygroundStore } from '@/stores/playground'
import {
  buildImportMapCodemirrorExtensions,
  buildSfcCodemirrorExtensions,
} from '@/utils/playgroundCodemirror'
import {
  compileSfcToModule,
  createPreviewBlobUrl,
  PLAYGROUND_CONSOLE_MESSAGE_TYPE,
  PLAYGROUND_IFRAME_RUNTIME_TYPE,
  resolveImportMapForPreview,
  validateImportMapUrls,
} from '@/utils/sfcPlayground'

type EditorTab = 'sfc' | 'importmap'

/** 预览 iframe 转发的一行控制台输出 */
type PreviewConsoleLine = {
  level: string
  text: string
  ts: number
}

const playground = usePlaygroundStore()
const { sfcCode, importMapCode } = storeToRefs(playground)

const editorTab = ref<EditorTab>('sfc')

const activeEditorText = ref('')

watch(activeEditorText, (v) => {
  if (editorTab.value === 'sfc') playground.setSfcCode(v)
  else playground.setImportMapCode(v)
})

const cmExtensions = shallowRef(buildSfcCodemirrorExtensions(oneDark))

/** 左侧编辑区宽度占比（%），与分割条拖拽联动 */
const editorWidthPct = ref(52)
const splitRootRef = ref<HTMLElement | null>(null)
const splitDragging = ref(false)

/** 预览 iframe 与底部控制台之间的垂直分割 */
const previewStackRef = ref<HTMLElement | null>(null)
const previewConsoleSplitDragging = ref(false)
/**
 * 控制台最小高度（px）：仅保留「预览控制台」标题行 + 内边距，再小则无法辨认标题
 */
const PREVIEW_CONSOLE_HEAD_MIN_PX = 40
/** 控制台当前高度（px，含标题与输出区） */
const previewConsoleHeightPx = ref(168)
/** 预览区（iframe）在垂直分割下保留的最小高度（px） */
const PREVIEW_IFRAME_MIN_PX = 100

/**
 * 拖拽分割条：调整编辑区与预览区宽度。
 * rAF 合并更新，避免每像素触发整页重排；拖拽时预览区 pointer-events:none，减轻 iframe 与 CodeMirror 同时布局导致的卡顿。
 */
function onSplitResizeStart(e: MouseEvent) {
  const root = splitRootRef.value
  if (!root) return
  const rect = root.getBoundingClientRect()
  const startX = e.clientX
  const startPct = editorWidthPct.value
  const minPct = 24
  const maxPct = 78
  splitDragging.value = true
  let rafId = 0
  let latestPct = startPct
  const applyPct = () => {
    rafId = 0
    editorWidthPct.value = latestPct
  }
  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    const deltaPct = (dx / rect.width) * 100
    let next = startPct + deltaPct
    next = Math.min(maxPct, Math.max(minPct, next))
    latestPct = Math.round(next * 10) / 10
    if (!rafId) rafId = requestAnimationFrame(applyPct)
  }
  const onUp = () => {
    if (rafId) cancelAnimationFrame(rafId)
    editorWidthPct.value = latestPct
    splitDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.removeProperty('cursor')
    document.body.style.removeProperty('user-select')
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

/**
 * 垂直分割条：调整预览 iframe 与「预览控制台」高度
 */
function onPreviewConsoleResizeStart(e: MouseEvent) {
  const stack = previewStackRef.value
  if (!stack) return
  const startY = e.clientY
  const startH = previewConsoleHeightPx.value
  const splitterH = 6
  previewConsoleSplitDragging.value = true
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  const onMove = (ev: MouseEvent) => {
    const dy = ev.clientY - startY
    const next = startH - dy
    const stackH = stack.getBoundingClientRect().height
    const maxConsole = Math.max(
      PREVIEW_CONSOLE_HEAD_MIN_PX,
      stackH - splitterH - PREVIEW_IFRAME_MIN_PX,
    )
    previewConsoleHeightPx.value = Math.round(
      Math.min(maxConsole, Math.max(PREVIEW_CONSOLE_HEAD_MIN_PX, next)),
    )
  }
  const onUp = () => {
    previewConsoleSplitDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.removeProperty('cursor')
    document.body.style.removeProperty('user-select')
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

watch(
  editorTab,
  (tab) => {
    activeEditorText.value = tab === 'sfc' ? sfcCode.value : importMapCode.value
    cmExtensions.value =
      tab === 'sfc' ? buildSfcCodemirrorExtensions(oneDark) : buildImportMapCodemirrorExtensions(oneDark)
  },
  { immediate: true },
)

const previewUrl = ref('')
let revokePrev: (() => void) | null = null

const compileError = ref('')
const runtimeError = ref('')
const running = ref(false)
const formatting = ref(false)

const previewFrameRef = ref<HTMLIFrameElement | null>(null)
const consoleLines = ref<PreviewConsoleLine[]>([])

const commandPaletteOpen = ref(false)
const commandQuery = ref('')

function revokePreview() {
  if (previewPaneRef.value && document.fullscreenElement === previewPaneRef.value) {
    void document.exitFullscreen()
  }
  revokePrev?.()
  revokePrev = null
  previewUrl.value = ''
}


/**
 * 运行预览前把当前标签页编辑器内容写回 ref，避免 CodeMirror 与 v-model 偶发未同步导致仍用旧 Import Map / SFC
 */
function flushEditorToBackingRefs() {
  const text = activeEditorText.value
  if (editorTab.value === 'sfc') playground.setSfcCode(text)
  else playground.setImportMapCode(text)
}

function clearPreviewConsole() {
  consoleLines.value = []
}

function pushPreviewConsoleLine(level: string, parts: string[]) {
  const next = [...consoleLines.value, { level, text: parts.join(' '), ts: Date.now() }]
  consoleLines.value = next.length > 300 ? next.slice(-300) : next
}

function onPreviewPostMessage(ev: MessageEvent) {
  if (!previewFrameRef.value || ev.source !== previewFrameRef.value.contentWindow) return
  const d = ev.data as Record<string, unknown>
  if (!d || typeof d !== 'object') return

  if (d.type === PLAYGROUND_CONSOLE_MESSAGE_TYPE) {
    const level = String((d as { level?: string }).level || 'log')
    const parts = (d as { parts?: unknown[] }).parts
    if (!Array.isArray(parts)) return
    pushPreviewConsoleLine(level, parts.map((x) => String(x)))
    return
  }

  if (d.type === PLAYGROUND_IFRAME_RUNTIME_TYPE) {
    const message = String((d as { message?: string }).message || '运行时错误')
    const stack = typeof (d as { stack?: unknown }).stack === 'string' ? (d.stack as string) : ''
    const info = typeof (d as { info?: unknown }).info === 'string' ? (d.info as string) : ''
    const source = typeof (d as { source?: unknown }).source === 'string' ? (d.source as string) : ''
    const lines = [source ? `[${source}] ${message}` : message, info, stack].filter(Boolean)
    /** 运行时错误仅在左侧编辑区下方展示，避免与右侧预览区重复 */
    runtimeError.value = lines.join('\n')
  }
}

/**
 * 使用 Prettier 分块格式化当前标签对应文档（动态加载以减小首包）
 */
async function handleFormat() {
  flushEditorToBackingRefs()
  formatting.value = true
  try {
    const { formatImportMapJson, formatVueSfc } = await import('@/utils/playgroundFormat')
    if (editorTab.value === 'importmap') {
      const formatted = await formatImportMapJson(importMapCode.value)
      playground.setImportMapCode(formatted)
      activeEditorText.value = formatted
    } else {
      const formatted = await formatVueSfc(sfcCode.value)
      playground.setSfcCode(formatted)
      activeEditorText.value = formatted
    }
    ElMessage.success('已格式化')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '格式化失败')
  } finally {
    formatting.value = false
  }
}

type PaletteCmd = { id: string; label: string; hint: string; disabled?: boolean; run: () => void }

const filteredPaletteCommands = computed(() => {
  const q = commandQuery.value.trim().toLowerCase()
  const cmds: PaletteCmd[] = [
    {
      id: 'format',
      label: '格式化当前文档',
      hint: 'Shift+Alt+F',
      run: () => {
        void handleFormat()
      },
    },
    {
      id: 'run',
      label: '运行预览',
      hint: 'Ctrl+S',
      run: () => {
        void handleRun()
      },
    },
    {
      id: 'newtab',
      label: '新标签页打开预览',
      hint: '',
      disabled: !previewUrl.value,
      run: () => openPreviewInNewTab(),
    },
    {
      id: 'clear-console',
      label: '清空预览控制台',
      hint: '',
      disabled: consoleLines.value.length === 0,
      run: () => clearPreviewConsole(),
    },
  ]
  return cmds.filter(
    (c) =>
      !c.disabled &&
      (q === '' ||
        c.label.toLowerCase().includes(q) ||
        c.hint.toLowerCase().includes(q) ||
        c.id.includes(q)),
  )
})

function runPaletteCommand(cmd: PaletteCmd) {
  commandPaletteOpen.value = false
  commandQuery.value = ''
  cmd.run()
}

function onCommandPaletteOpened() {
  void nextTick(() => {
    const el = document.querySelector('.command-palette-dialog input') as HTMLInputElement | null
    el?.focus()
  })
}

function onPlaygroundGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const inDialog = Boolean(target?.closest?.('.el-dialog'))
  const mod = e.metaKey || e.ctrlKey
  if (mod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
    if (inDialog) return
    e.preventDefault()
    commandPaletteOpen.value = true
    commandQuery.value = ''
    void nextTick(() => {
      const el = document.querySelector('.command-palette-dialog input') as HTMLInputElement | null
      el?.focus()
    })
    return
  }
  if (mod && e.key === 's') {
    e.preventDefault()
    void handleRun()
    return
  }
  if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
    e.preventDefault()
    void handleFormat()
  }
}

/**
 * 编译并刷新预览 iframe
 */
async function handleRun() {
  compileError.value = ''
  runtimeError.value = ''
  clearPreviewConsole()
  flushEditorToBackingRefs()
  const mapResult = resolveImportMapForPreview(importMapCode.value)
  if (!mapResult.ok) {
    compileError.value = mapResult.message
    ElMessage.error(mapResult.message)
    return
  }

  const urlCheck = validateImportMapUrls(mapResult.map)
  if (!urlCheck.ok) {
    compileError.value = urlCheck.message
    ElMessage.error(urlCheck.message)
    return
  }

  running.value = true
  try {
    const compiled = await compileSfcToModule(sfcCode.value)
    if (!compiled.ok) {
      compileError.value = compiled.message
      ElMessage.error('编译失败')
      return
    }
    revokePreview()
    const { url, revoke } = createPreviewBlobUrl(
      mapResult.map,
      compiled.moduleCode,
      compiled.css,
    )
    revokePrev = revoke
    previewUrl.value = url
  } finally {
    running.value = false
  }
}

function resetSample() {
  playground.resetToSample()
  activeEditorText.value = editorTab.value === 'sfc' ? sfcCode.value : importMapCode.value
  handleRun()
  ElMessage.success('已恢复为默认示例')
}

function onFrameLoad(ev: Event) {
  const el = ev.target as HTMLIFrameElement
  if (!el.contentWindow) return
  /** 运行时错误统一由 iframe 内 postMessage（Vue errorHandler / window.error）上报，避免与父页重复监听 */
  runtimeError.value = ''
}

/** 预览整块区域（用于全屏） */
const previewPaneRef = ref<HTMLElement | null>(null)
const isPreviewFullscreen = ref(false)

function syncPreviewFullscreenFlag() {
  const el = previewPaneRef.value
  isPreviewFullscreen.value = Boolean(el && document.fullscreenElement === el)
}

async function togglePreviewFullscreen() {
  const el = previewPaneRef.value
  if (!el) return
  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen()
    } else {
      await el.requestFullscreen()
    }
  } catch {
    ElMessage.warning('当前浏览器无法进入全屏')
  }
  syncPreviewFullscreenFlag()
}

/** 在新标签页打开当前预览 blob URL */
function openPreviewInNewTab() {
  if (!previewUrl.value) return
  window.open(previewUrl.value, '_blank', 'noopener,noreferrer')
}

function onFullscreenChange() {
  syncPreviewFullscreenFlag()
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  window.addEventListener('message', onPreviewPostMessage)
  document.addEventListener('keydown', onPlaygroundGlobalKeydown, true)
  await nextTick()
  void handleRun()
})

onBeforeUnmount(() => {
  revokePreview()
  window.removeEventListener('message', onPreviewPostMessage)
  document.removeEventListener('keydown', onPlaygroundGlobalKeydown, true)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (previewPaneRef.value && document.fullscreenElement === previewPaneRef.value) {
    void document.exitFullscreen()
  }
})
</script>

<template>
  <div class="playground">
    <!-- 页面标题区 -->
    <div class="page-head">
      <div class="head-left">
        <div class="head-icon-wrap">
          <svg viewBox="0 0 128 128" class="vue-logo">
            <path fill="#42b883" d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110C128,10,78.8,10,78.8,10z" />
            <path fill="#35495e" d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z" />
          </svg>
        </div>
        <div class="head-text">
          <h1 class="title">Vue3 在线演练场</h1>
          <p class="sub">支持 TypeScript + SCSS，实时预览与调试</p>
        </div>
      </div>
      <div class="head-badges">
        <span class="badge badge--ts">TypeScript</span>
        <span class="badge badge--scss">SCSS</span>
        <span class="badge badge--vue">Vue 3</span>
      </div>
    </div>

    <div
      ref="splitRootRef"
      class="split"
      :class="{ 'is-split-dragging': splitDragging || previewConsoleSplitDragging }"
    >
      <section
        class="pane pane--editor"
        :style="{ flex: `0 0 ${editorWidthPct}%`, maxWidth: 'calc(100% - 200px)' }"
      >
        <div class="pane-toolbar pane-toolbar--editor">
          <el-tabs
            v-model="editorTab"
            class="editor-tabs"
          >
            <el-tab-pane
              label="App.vue"
              name="sfc"
            />
            <el-tab-pane
              label="Import Map"
              name="importmap"
            />
          </el-tabs>
          <div class="pane-actions">
            <el-tooltip
              content="命令面板（Ctrl+Shift+P）"
              placement="bottom"
            >
              <el-button
                size="small"
                circle
                @click="
                  commandPaletteOpen = true;
                  commandQuery = '';
                "
              >
                <el-icon :size="16">
                  <Search />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-button
              size="small"
              :loading="formatting"
              @click="handleFormat"
            >
              格式化
            </el-button>
            <el-button
              size="small"
              @click="resetSample"
            >
              重置示例
            </el-button>
            <el-button
              type="primary"
              size="small"
              :loading="running"
              @click="handleRun"
            >
              运行预览
            </el-button>
          </div>
        </div>
        <div class="editor-wrap">
          <codemirror
            v-model="activeEditorText"
            class="codemirror-root"
            :extensions="cmExtensions"
            :indent-with-tab="true"
            :tab-size="2"
          />
        </div>
        <div
          v-if="compileError"
          class="msg msg--err"
        >
          {{ compileError }}
        </div>
        <div
          v-if="runtimeError"
          class="msg msg--runtime msg--editor-runtime"
        >
          预览运行：{{ runtimeError }}
        </div>
      </section>

      <div
        class="split-resizer"
        :class="{ 'is-dragging': splitDragging }"
        title="拖拽调整编辑区 / 预览区宽度"
        @mousedown.prevent="onSplitResizeStart"
      />

      <section
        ref="previewPaneRef"
        class="pane pane--preview"
      >
        <div class="pane-toolbar pane-toolbar--preview">
          <span class="pane-title">
            <el-icon class="pane-title-icon">
              <Monitor />
            </el-icon>
            预览
          </span>
          <div
            v-if="previewUrl"
            class="pane-preview-actions"
          >
            <el-tooltip
              :content="isPreviewFullscreen ? '退出全屏' : '全屏预览'"
              placement="bottom"
            >
              <el-button
                circle
                text
                type="primary"
                @click="togglePreviewFullscreen"
              >
                <el-icon :size="18">
                  <component :is="isPreviewFullscreen ? Close : FullScreen" />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              content="新标签页打开"
              placement="bottom"
            >
              <el-button
                circle
                text
                type="primary"
                style="margin-left: 0;"
                @click="openPreviewInNewTab"
              >
                <el-icon :size="18">
                  <TopRight />
                </el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <div
          ref="previewStackRef"
          class="preview-body-stack"
          :class="{ 'is-console-split-dragging': previewConsoleSplitDragging }"
        >
          <template v-if="previewUrl">
            <div class="preview-stack-preview">
              <!-- 不设 sandbox：allow-scripts + allow-same-origin 会触发 Chrome「可逃逸沙箱」提示，且去掉 same-origin 后父页难以向子 window 挂 error 监听 -->
              <iframe
                ref="previewFrameRef"
                class="preview-frame"
                title="Vue 预览"
                :src="previewUrl"
                @load="onFrameLoad"
              />
            </div>
            <div
              class="preview-console-split"
              title="拖拽调整预览区与控制台高度"
              @mousedown.prevent="onPreviewConsoleResizeStart"
            />
            <div
              class="preview-console"
              :style="{
                height: previewConsoleHeightPx + 'px',
                minHeight: PREVIEW_CONSOLE_HEAD_MIN_PX + 'px',
              }"
            >
              <div class="preview-console__head">
                <span class="preview-console__title">预览控制台</span>
                <el-button
                  size="small"
                  text
                  type="primary"
                  :disabled="consoleLines.length === 0"
                  @click="clearPreviewConsole"
                >
                  清空
                </el-button>
              </div>
              <div class="preview-console__body">
                <div
                  v-if="consoleLines.length === 0"
                  class="preview-console__empty"
                >
                  iframe 内 console.log / warn / error 会显示在这里
                </div>
                <div
                  v-for="(line, idx) in consoleLines"
                  v-else
                  :key="line.ts + '-' + idx"
                  class="preview-console__line"
                  :class="'is-' + line.level"
                >
                  <span class="preview-console__lvl">{{ line.level }}</span>
                  <span class="preview-console__text">{{ line.text }}</span>
                </div>
              </div>
            </div>
          </template>
          <div
            v-else
            class="preview-placeholder"
          >
            点击「运行预览」编译并渲染
          </div>
        </div>
      </section>
    </div>

    <el-dialog
      v-model="commandPaletteOpen"
      title="命令面板"
      width="420px"
      class="command-palette-dialog"
      append-to-body
      destroy-on-close
      @opened="onCommandPaletteOpened"
    >
      <el-input
        v-model="commandQuery"
        placeholder="输入过滤…"
        clearable
      />
      <ul class="command-palette-list">
        <li
          v-for="cmd in filteredPaletteCommands"
          :key="cmd.id"
          class="command-palette-item"
          @click="runPaletteCommand(cmd)"
        >
          <span class="command-palette-label">{{ cmd.label }}</span>
          <span
            v-if="cmd.hint"
            class="command-palette-hint"
          >{{ cmd.hint }}</span>
        </li>
        <li
          v-if="filteredPaletteCommands.length === 0"
          class="command-palette-empty"
        >
          无匹配命令
        </li>
      </ul>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.playground {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* 页面标题区 */
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  flex-shrink: 0;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.head-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vue-logo {
  width: 26px;
  height: 26px;
}

.head-text {
  min-width: 0;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px;
}

.sub {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.head-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge--ts {
  background: #DBEAFE;
  color: #1D4ED8;
}

.badge--scss {
  background: #FCE7F3;
  color: #BE185D;
}

.badge--vue {
  background: #D1FAE5;
  color: #047857;
}

/* 分割布局 */
.split {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 0;
  align-items: stretch;
  width: 100%;
}

.split.is-split-dragging .pane--preview {
  pointer-events: none;
}

.pane--preview:fullscreen {
  border-radius: 0;
  max-height: none;
  min-height: 100vh;
}

/* 分割条 */
.split-resizer {
  flex: 0 0 8px;
  max-width: 8px;
  cursor: col-resize;
  align-self: stretch;
  background: var(--color-bg);
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.split-resizer::after {
  content: '';
  width: 4px;
  height: 32px;
  background: var(--color-border);
  border-radius: 2px;
  transition: all var(--transition-fast);
}

.split-resizer:hover,
.split-resizer.is-dragging {
  background: var(--color-primary-bg);
}

.split-resizer:hover::after,
.split-resizer.is-dragging::after {
  background: var(--color-primary);
  height: 48px;
}

/* 面板通用样式 */
.pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #1E1E1E;
  box-shadow: var(--shadow-card);
}

.pane--editor {
  min-width: 220px;
  min-height: 0;
}

.pane--preview {
  flex: 1 1 0;
  min-width: 180px;
  min-height: 0;
  background: var(--color-bg-elevated);
}

/* 面板工具栏 */
.pane-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 48px;
}

.pane-toolbar--editor {
  padding: 0 12px 0 8px;
  border-bottom: 1px solid #2D2D2D;
  background: #252526;
}

.pane-toolbar--preview {
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}

/* 编辑器标签页 */
.editor-tabs {
  flex: 1;
  min-width: 200px;
}

.editor-tabs :deep(.el-tabs__header) {
  margin: 0;
  border: none;
}

.editor-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.editor-tabs :deep(.el-tabs__nav) {
  border: none;
}

.editor-tabs :deep(.el-tabs__item) {
  height: 46px;
  line-height: 46px;
  padding: 0 18px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: #858585;
  border-radius: 0;
  border: none;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.editor-tabs :deep(.el-tabs__item:hover) {
  color: #CCCCCC;
  background: rgba(255, 255, 255, 0.04);
}

.editor-tabs :deep(.el-tabs__item.is-active) {
  color: #fff;
  font-weight: 500;
  background: #1E1E1E;
  border-top: 2px solid var(--color-primary);
}

.editor-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

/* 面板操作按钮 */
.pane-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  padding: 4px 0;
}

.pane-actions :deep(.el-button) {
  font-size: 12px;
  border-radius: var(--radius-sm);
}

.pane-actions :deep(.el-button--primary) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.pane-actions :deep(.el-button--primary:hover) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

/* 编辑器容器 */
.editor-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #1E1E1E;
}

.codemirror-root {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 预览面板标题 */
.pane-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text);
  letter-spacing: 0.01em;
}

.pane-title-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.pane-preview-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: auto;
}

.pane-preview-actions :deep(.el-button) {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
}

.pane-preview-actions :deep(.el-button:hover) {
  background: var(--color-primary-bg);
}

/* 预览区域 */
.preview-body-stack {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.preview-stack-preview {
  flex: 1 1 0;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #FAFAFA;
}

/* 控制台分割条 */
.preview-console-split {
  flex: 0 0 6px;
  cursor: row-resize;
  background: var(--color-border-light);
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.preview-console-split::after {
  content: '';
  width: 40px;
  height: 3px;
  background: var(--color-border);
  border-radius: 2px;
  transition: all var(--transition-fast);
}

.preview-console-split:hover,
.preview-body-stack.is-console-split-dragging .preview-console-split {
  background: var(--color-primary-bg);
}

.preview-console-split:hover::after,
.preview-body-stack.is-console-split-dragging .preview-console-split::after {
  background: var(--color-primary);
  width: 60px;
}

/* 预览 iframe */
.preview-frame {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  border: none;
  background: #fff;
}

/* 控制台 */
.preview-console {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1E1E1E;
  color: #D4D4D4;
}

.preview-body-stack > .preview-placeholder {
  flex: 1 1 0;
  min-height: 0;
}

.preview-console__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
  padding: 8px 12px;
  background: #252526;
  font-size: 12px;
  border-bottom: 1px solid #3C3C3C;
}

.preview-console__title {
  font-weight: 600;
  color: #CCCCCC;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-console__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 12px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.5;
}

.preview-console__empty {
  color: #6A6A6A;
  font-style: italic;
}

.preview-console__line {
  margin: 4px 0;
  word-break: break-word;
  padding: 2px 0;
}

.preview-console__lvl {
  display: inline-block;
  min-width: 48px;
  margin-right: 12px;
  padding: 1px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 500;
  vertical-align: top;
  background: #3C3C3C;
  color: #CCCCCC;
}

.preview-console__text {
  color: #D4D4D4;
}

.preview-console__line.is-warn .preview-console__lvl {
  background: rgba(204, 167, 0, 0.2);
  color: #FFD700;
}

.preview-console__line.is-error .preview-console__lvl {
  background: rgba(241, 76, 76, 0.2);
  color: #F14C4C;
}

.preview-console__line.is-error .preview-console__text {
  color: #F48771;
}

/* 占位符 */
.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
  background: linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%);
}

.preview-placeholder::before {
  content: '';
  width: 64px;
  height: 64px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='5 3 19 12 5 21 5 3'%3E%3C/polygon%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  opacity: 0.5;
}

/* 错误消息 */
.msg {
  padding: 10px 14px;
  font-size: 12px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.msg::before {
  content: '';
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.msg--err {
  background: #FEF2F2;
  color: #DC2626;
  border-top: 1px solid #FECACA;
}

.msg--err::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23DC2626' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='15' y1='9' x2='9' y2='15'%3E%3C/line%3E%3Cline x1='9' y1='9' x2='15' y2='15'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
}

.msg--runtime {
  background: #FFFBEB;
  color: #D97706;
  border-top: 1px solid #FDE68A;
}

.msg--runtime::before {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23D97706' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'%3E%3C/path%3E%3Cline x1='12' y1='9' x2='12' y2='13'%3E%3C/line%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
}

.msg--editor-runtime {
  max-height: 160px;
  overflow: auto;
}

/* CodeMirror 样式调整 */
:deep(.cm-editor) {
  flex: 1;
  min-height: 0;
  height: 100%;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
}

:deep(.cm-scroller) {
  min-height: 0;
}

:deep(.cm-gutters) {
  background: #1E1E1E;
  border-right: 1px solid #2D2D2D;
}

:deep(.cm-activeLineGutter) {
  background: #2D2D2D;
}

:deep(.cm-line) {
  padding-left: 4px;
}
</style>

<style lang="scss">
/* CodeMirror 自动补全样式 (全局) */
.cm-tooltip.cm-tooltip-autocomplete {
  background: #252526 !important;
  border: 1px solid #3C3C3C !important;
  border-radius: var(--radius-sm) !important;
  box-shadow: var(--shadow-lg) !important;
}

.cm-tooltip.cm-tooltip-autocomplete ul {
  font-family: 'JetBrains Mono', ui-monospace, monospace !important;
  font-size: 12px !important;
}

.cm-tooltip.cm-tooltip-autocomplete ul > li {
  padding: 6px 10px !important;
}

.cm-tooltip.cm-tooltip-autocomplete ul > li[aria-selected] {
  background: linear-gradient(90deg, rgba(8, 145, 178, 0.3), rgba(8, 145, 178, 0.15)) !important;
  color: #fff !important;
  border-left: 2px solid var(--color-primary) !important;
}

.cm-tooltip.cm-tooltip-autocomplete-disabled ul > li[aria-selected] {
  background: rgba(120, 120, 120, 0.3) !important;
  color: #ccc !important;
  border-left: 2px solid #666 !important;
}

/* 命令面板样式 */
.command-palette-dialog {
  .el-dialog {
    border-radius: var(--radius-lg);
  }

  .el-dialog__header {
    padding: 20px 24px 12px;
    border-bottom: 1px solid var(--color-border-light);
  }

  .el-dialog__title {
    font-size: 16px;
    font-weight: 600;
  }

  .el-dialog__body {
    padding: 16px 24px 24px;
  }
}

.command-palette-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  max-height: 320px;
  overflow: auto;
}

.command-palette-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  margin: 4px 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.command-palette-item:hover {
  background: var(--color-primary-bg);
  border-color: var(--color-primary-light);
}

.command-palette-label {
  color: var(--color-text);
  font-weight: 500;
}

.command-palette-hint {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  padding: 3px 8px;
  background: var(--color-bg);
  border-radius: 4px;
  border: 1px solid var(--color-border-light);
}

.command-palette-empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
