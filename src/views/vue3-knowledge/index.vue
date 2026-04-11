<script setup lang="ts">
import { oneDark } from '@codemirror/theme-one-dark'
import { Close, FullScreen, Monitor, Reading, TopRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

import { usePlaygroundStore } from '@/stores/playground'
import {
  buildImportMapCodemirrorExtensions,
  buildSfcCodemirrorExtensions,
} from '@/utils/playgroundCodemirror'
import {
  compileSfcToModule,
  createPreviewBlobUrl,
  resolveImportMapForPreview,
} from '@/utils/sfcPlayground'

type EditorTab = 'sfc' | 'importmap'

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

/**
 * 编译并刷新预览 iframe
 */
async function handleRun() {
  compileError.value = ''
  runtimeError.value = ''
  flushEditorToBackingRefs()
  const mapResult = resolveImportMapForPreview(importMapCode.value)
  if (!mapResult.ok) {
    compileError.value = mapResult.message
    ElMessage.error(mapResult.message)
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
  const win = el.contentWindow
  if (!win) return
  runtimeError.value = ''
  win.addEventListener('error', (e) => {
    runtimeError.value = e.message || String(e.error)
  })
  win.addEventListener('unhandledrejection', (e) => {
    const r = e.reason
    runtimeError.value = r instanceof Error ? r.message : String(r)
  })
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
  await nextTick()
  void handleRun()
})

onBeforeUnmount(() => {
  revokePreview()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (previewPaneRef.value && document.fullscreenElement === previewPaneRef.value) {
    void document.exitFullscreen()
  }
})
</script>

<template>
  <div class="playground">
    <div class="page-head">
      <el-icon
        class="head-icon"
        :size="22"
      >
        <Reading />
      </el-icon>
      <div class="head-text">
        <div class="title">
          Vue3 强大在线编辑器
        </div>
        <div class="sub">
          支持 TypeScript+SCSS
        </div>
      </div>
    </div>

    <div
      ref="splitRootRef"
      class="split"
      :class="{ 'is-split-dragging': splitDragging }"
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
        <!-- 不设 sandbox：allow-scripts + allow-same-origin 会触发 Chrome「可逃逸沙箱」提示，且去掉 same-origin 后父页难以向子 window 挂 error 监听 -->
        <iframe
          v-if="previewUrl"
          class="preview-frame"
          title="Vue 预览"
          :src="previewUrl"
          @load="onFrameLoad"
        />
        <div
          v-else
          class="preview-placeholder"
        >
          点击「运行预览」编译并渲染
        </div>
        <div
          v-if="runtimeError"
          class="msg msg--runtime"
        >
          运行时：{{ runtimeError }}
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.playground {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.page-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-shrink: 0;
}

.head-icon {
  color: var(--el-color-primary);
  margin-top: 2px;
}

.head-text {
  min-width: 0;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.split {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 0;
  align-items: stretch;
  width: 100%;
}

/** 拖拽时屏蔽预览区命中，避免 iframe 抢事件并减少重绘卡顿 */
.split.is-split-dragging .pane--preview {
  pointer-events: none;
}

.pane--preview:fullscreen {
  border-radius: 0;
  max-height: none;
  min-height: 100vh;
}

.split-resizer {
  flex: 0 0 6px;
  max-width: 6px;
  cursor: col-resize;
  align-self: stretch;
  background: transparent;
  position: relative;
  z-index: 2;
  margin: 0 -3px;
  padding: 0 3px;
  box-sizing: content-box;
  transition: background 0.12s ease;
}

.split-resizer:hover,
.split-resizer.is-dragging {
  background: rgba(97, 175, 239, 0.45);
}

.pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: #282c34;
}

.pane--editor {
  min-width: 220px;
  min-height: 0;
}

.pane--preview {
  flex: 1 1 0;
  min-width: 180px;
  min-height: 0;
  background: var(--el-bg-color);
}

.pane-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 42px;
}

.pane-toolbar--editor {
  padding: 0 10px 0 6px;
  border-bottom: 1px solid #181a1f;
  background: linear-gradient(180deg, #2c313c 0%, #252830 100%);
}

.pane-toolbar--preview {
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(180deg, #fafbfc 0%, #eef1f4 100%);
}

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
  height: 40px;
  line-height: 40px;
  padding: 0 16px;
  font-family: ui-monospace, 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #9da5b4;
  border-radius: 6px 6px 0 0;
  transition: color 0.15s ease, background 0.15s ease;
}

.editor-tabs :deep(.el-tabs__item:hover) {
  color: #c8d3e0;
}

.editor-tabs :deep(.el-tabs__item.is-active) {
  color: #61afef;
  font-weight: 600;
  background: rgba(97, 175, 239, 0.14);
}

.editor-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, #61afef, #c678dd);
}

.pane-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  padding: 4px 0;
}

.editor-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.codemirror-root {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  letter-spacing: 0.02em;
}

.pane-title-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.pane-preview-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.preview-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
  background: #fff;
}

.preview-placeholder {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.msg {
  padding: 8px 12px;
  font-size: 13px;
  font-family: ui-monospace, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg--err {
  background: #fef0f0;
  color: #f56c6c;
  border-top: 1px solid var(--el-border-color-lighter);
}

.msg--runtime {
  background: #fdf6ec;
  color: #e6a23c;
  border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.cm-editor) {
  flex: 1;
  min-height: 0;
  height: 100%;
}

:deep(.cm-scroller) {
  min-height: 0;
}
</style>

<style lang="scss">
/**
 * CodeMirror 自动补全挂在 body下，须用全局选择器；提高当前选中项对比度
 */
.cm-tooltip.cm-tooltip-autocomplete ul > li[aria-selected] {
  background: linear-gradient(90deg, rgba(97, 175, 239, 0.55), rgba(97, 175, 239, 0.28)) !important;
  color: #f5f8ff !important;
  box-shadow: inset 3px 0 0 #61afef;
}

.cm-tooltip.cm-tooltip-autocomplete-disabled ul > li[aria-selected] {
  background: rgba(120, 120, 120, 0.45) !important;
  color: #eee !important;
  box-shadow: inset 3px 0 0 #999;
}
</style>
