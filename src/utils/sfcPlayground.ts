import { compileScript, compileStyle, parse, type SFCDescriptor } from 'vue/compiler-sfc'

/**
 * 与项目 Vue 版本对齐的默认 import map（可编辑）
 * lodash 须用 jsdelivr `+esm` 或 esm.sh：不要用 lodash.min.js（UMD），否则无法作为 ES module 加载；键名须与 import 一致（如 `lodash` 勿写成 loadsh）
 */
export const DEFAULT_IMPORT_MAP = `{
  "imports": {
    "vue": "https://cdn.jsdelivr.net/npm/vue@3.5.32/dist/vue.esm-browser.js",
    "@vue/shared": "https://cdn.jsdelivr.net/npm/@vue/shared@3.5.32/dist/shared.esm-bundler.js",
    "element-plus": "https://cdn.jsdelivr.net/npm/element-plus@2.13.6/dist/index.full.min.mjs",
    "element-plus/": "https://cdn.jsdelivr.net/npm/element-plus@2.13.6/",
    "@element-plus/icons-vue": "https://cdn.jsdelivr.net/npm/@element-plus/icons-vue@2/dist/index.min.js",
    "lodash-es": "https://cdn.jsdelivr.net/npm/lodash-es@4.18.1/+esm"
  },
  "scopes": {}
}`

/** 默认整文件 SFC：演示 script setup + TS、Element Plus、scoped SCSS（变量 / 嵌套 / :deep） */
export const DEFAULT_SFC = `<script setup lang="ts">
import { MagicStick, Promotion } from '@element-plus/icons-vue'
import { version as epVersion } from 'element-plus'
import { computed, ref, version as vueVersion } from 'vue'

const title = ref<string>('Vue 3 在线演练')
const clicks = ref(0)
const dialogVisible = ref(false)

const subtitle = computed(() => \`累计 · \${clicks.value} 次\`)

function onBoost(): void {
  clicks.value += 1
}

function resetClicks(): void {
  clicks.value = 0
}

function closeDemoDialog(): void {
  dialogVisible.value = false
}
</script>

<template>
  <div class="demo">
    <el-card
      class="demo__card"
      shadow="hover"
    >
      <template #header>
        <div class="demo__head">
          <div class="demo__brand">
            <el-icon
              class="demo__brand-icon"
              :size="28"
            >
              <MagicStick />
            </el-icon>
            <div>
              <h1 class="demo__title">
                {{ title }}
              </h1>
              <p class="demo__sub">
                {{ subtitle }}
              </p>
            </div>
          </div>
          <el-space wrap>
            <el-tag
              type="success"
              effect="plain"
            >
              Vue {{ vueVersion }}
            </el-tag>
            <el-tag
              type="primary"
              effect="plain"
            >
              EP {{ epVersion }}
            </el-tag>
          </el-space>
        </div>
      </template>

      <el-space
        direction="vertical"
        :size="16"
        fill
        class="demo__body"
      >
        <el-input
          v-model="title"
          clearable
          placeholder="双向绑定：编辑标题"
        >
          <template #prefix>
            <el-icon><Promotion /></el-icon>
          </template>
        </el-input>

        <div class="demo__actions">
          <el-button
            type="primary"
            @click="onBoost"
          >
            点击计数
          </el-button>
          <el-button
            text
            @click="resetClicks"
          >
            重置
          </el-button>
          <el-button
            plain
            type="success"
            @click="dialogVisible = true"
          >
            打开弹窗
          </el-button>
        </div>

        <el-dialog
          v-model="dialogVisible"
          title="示例对话框"
          width="420px"
          destroy-on-close
        >
          <p class="demo__dialog-body">
            由 <code class="demo__code">el-dialog</code> 与 <code class="demo__code">v-model</code> 控制显示；默认挂到 body，遮罩可点关。
          </p>
          <template #footer>
            <el-button @click="closeDemoDialog">
              关闭
            </el-button>
            <el-button
              type="primary"
              @click="closeDemoDialog"
            >
              知道了
            </el-button>
          </template>
        </el-dialog>

        <el-divider content-position="left">
          SCSS（变量 · 嵌套 · :deep）
        </el-divider>
        <p class="demo__hint">
          单文件内 <code class="demo__code">computed</code>、<code class="demo__code">ref&lt;string&gt;</code>、<code class="demo__code">el-dialog</code> 与 Element 组件/图标；样式区演示 SCSS 变量、嵌套与主题 CSS 变量。
        </p>
      </el-space>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
$demo-radius: 12px;
$demo-gap: 16px;

.demo {
  max-width: 520px;
  margin: 0 auto;
}

.demo__card {
  border-radius: $demo-radius;
  overflow: hidden;
  box-shadow: 0 8px 28px rgb(0 0 0 / 7%);

  :deep(.el-card__header) {
    padding: 18px 20px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-fill-color-blank) 50%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-input__prefix) {
    color: var(--el-color-primary);
  }
}

.demo__body {
  width: 100%;
}

.demo__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $demo-gap;
}

.demo__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.demo__brand-icon {
  color: var(--el-color-primary);
}

.demo__title {
  margin: 0;
  font-size: 1.28rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.demo__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.demo__dialog-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  color: var(--el-text-color-regular);
}

.demo__hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--el-text-color-regular);
}

.demo__code {
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}
</style>
`

/** 视为「纯 CSS」的 style lang，直接走 compileStyle */
const PLAIN_STYLE_LANGS = new Set(['', 'css'])

/** 使用 dart-sass 编译后再走 compileStyle（与 scoped 兼容） */
const SCSS_STYLE_LANGS = new Set(['scss', 'sass'])

/** 视为「纯模板」的 template lang */
const PLAIN_TEMPLATE_LANGS = new Set(['', 'html'])

/** 不支持的 style 预处理器 */
const UNSUPPORTED_STYLE_LANG = new Set(['less', 'stylus', 'postcss', 'pcss'])

type SassCompileString = typeof import('sass').compileString

/** 按需缓存的 sass.compileString，避免无 scss 时打入首包 */
let sassCompileStringCached: SassCompileString | null = null

/**
 * 动态加载 dart-sass（仅当 SFC 含 scss/sass 时触发）
 */
async function getSassCompileString(): Promise<SassCompileString> {
  if (!sassCompileStringCached) {
    const m = await import('sass')
    sassCompileStringCached = m.compileString
  }
  return sassCompileStringCached
}

/**
 * 将 SCSS / 缩进 Sass 编译为 CSS，供 @vue/compiler-sfc 的 compileStyle 做 scoped
 * @param source 样式块原文
 * @param lang `scss` 或缩进语法的 `sass`
 * @param filename SFC 虚拟路径（用于报错定位）
 */
async function compileStylePreprocessorToCss(source: string, lang: 'scss' | 'sass', filename: string): Promise<string> {
  const sassCompileString = await getSassCompileString()
  /** sass.compileString 的语法与虚拟 URL */
  const url = new URL(`file:///${filename.replace(/\\/g, '/')}`)
  try {
    const out = sassCompileString(source, {
      syntax: lang === 'sass' ? 'indented' : 'scss',
      url,
      style: 'expanded',
    })
    return out.css
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e))
  }
}

/** 按需加载的 typescript 模块（与 dart-sass 相同策略，避免纯 JS SFC 首包过大） */
let tsModuleCached: typeof import('typescript') | null = null

async function getTsModule(): Promise<typeof import('typescript')> {
  if (!tsModuleCached) tsModuleCached = await import('typescript')
  return tsModuleCached
}

/**
 * SFC 的 script / scriptSetup 是否为 TypeScript（与 @vue/compiler-sfc 的 isTS 判定对齐并含 mts/cts）
 */
function descriptorUsesScriptTs(descriptor: SFCDescriptor): boolean {
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (!block?.lang) continue
    const lang = block.lang
    if (lang === 'ts' || lang === 'tsx' || lang === 'mts' || lang === 'cts') return true
  }
  return false
}

/**
 * `compileScript` 在 TS 模式下会保留泛型、内联渲染函数参数上的 `any` 等语法，浏览器无法执行。
 * 使用 `transpileModule` 擦除类型并输出 ESNext JS，与打包工具下游处理一致。
 * @param code compileScript 产物
 * @param emitFileName 虚拟路径（仅用于报错定位）
 */
async function transpileCompiledScriptForBrowser(code: string, emitFileName: string): Promise<string> {
  const ts = await getTsModule()
  return ts.transpileModule(code, {
    fileName: emitFileName,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText
}

/**
 * 解析 import map JSON
 * @param raw JSON 字符串
 */
export function parseImportMap(raw: string): { ok: true; map: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!data.imports || typeof data.imports !== 'object') {
      return { ok: false, message: 'import map 需包含 imports 对象' }
    }
    return { ok: true, map: data }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'JSON 解析失败' }
  }
}

/**
 * 解析用户在页面里编辑的 import map，并与 {@link DEFAULT_IMPORT_MAP} 的 `imports` 合并（同名键以用户为准）。
 * 只需在 JSON 里「增补」模块即可在运行预览时一并加载，无需每次复制整份 vue / element-plus 等条目。
 * @param userRaw Import Map 标签页中的 JSON 字符串
 */
export function resolveImportMapForPreview(
  userRaw: string,
): { ok: true; map: Record<string, unknown> } | { ok: false; message: string } {
  const userResult = parseImportMap(userRaw)
  if (!userResult.ok) return userResult
  const defaultResult = parseImportMap(DEFAULT_IMPORT_MAP)
  if (!defaultResult.ok) return defaultResult

  const baseImports = defaultResult.map.imports as Record<string, string>
  const userImports = userResult.map.imports as Record<string, string>
  const mergedImports = { ...baseImports, ...userImports }

  const userScopes = userResult.map.scopes
  const hasUserScopes =
    userScopes &&
    typeof userScopes === 'object' &&
    !Array.isArray(userScopes) &&
    Object.keys(userScopes as Record<string, unknown>).length > 0

  return {
    ok: true,
    map: {
      imports: mergedImports,
      scopes: hasUserScopes ? userScopes : (defaultResult.map.scopes ?? {}),
    },
  }
}

export interface CompileSfcResult {
  ok: true
  moduleCode: string
  css: string
}

export interface CompileSfcError {
  ok: false
  message: string
}

/**
 * 编译 SFC 为可在 import map 环境下运行的单文件 ESM（含 createApp + ElementPlus）
 * @param source 完整 .vue 文本
 */
export async function compileSfcToModule(source: string): Promise<CompileSfcResult | CompileSfcError> {
  const filename = 'App.vue'
  const { descriptor, errors } = parse(source, { filename })
  if (errors.length) {
    return {
      ok: false,
      message: errors.map((e) => ('message' in e ? String(e.message) : String(e))).join('\n'),
    }
  }

  for (const s of descriptor.styles) {
    const lang = s.lang || ''
    if (PLAIN_STYLE_LANGS.has(lang) || SCSS_STYLE_LANGS.has(lang)) continue
    if (UNSUPPORTED_STYLE_LANG.has(lang)) {
      return { ok: false, message: `暂不支持的 style 语言: ${lang}，请改用 css / scss` }
    }
    return { ok: false, message: `未知的 style 语言: ${lang}` }
  }

  const templateLang = descriptor.template?.lang || ''
  if (!PLAIN_TEMPLATE_LANGS.has(templateLang)) {
    return { ok: false, message: `暂不支持的 template 语言: ${templateLang}，请去掉 lang 或使用 html` }
  }

  const id = hashFilename(filename)

  let compiledScript: string
  try {
    const scr = compileScript(descriptor, {
      id,
      inlineTemplate: true,
    })
    compiledScript = scr.content
    if (descriptorUsesScriptTs(descriptor)) {
      compiledScript = await transpileCompiledScriptForBrowser(compiledScript, `${filename}.ts`)
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    }
  }

  let css = ''
  for (const block of descriptor.styles) {
    try {
      const lang = block.lang || ''
      let styleSource = block.content
      if (SCSS_STYLE_LANGS.has(lang)) {
        styleSource = await compileStylePreprocessorToCss(block.content, lang as 'scss' | 'sass', filename)
      }
      const res = compileStyle({
        source: styleSource,
        filename,
        id,
        scoped: block.scoped,
      })
      css += res.code
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : String(e),
      }
    }
  }

  const hasScopedStyle = descriptor.styles.some((s) => s.scoped)
  const moduleCode = injectAppMount(compiledScript, {
    scopeIdAttr: hasScopedStyle ? scopeIdAttrFromCompileId(id) : undefined,
  })
  return { ok: true, moduleCode, css }
}

function hashFilename(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  /** 与 Vite 一致：仅哈希片段，compileStyle /运行时 __scopeId 会加 `data-v-` 前缀 */
  return Math.abs(h).toString(16)
}

/**
 * 与 compileStyle 中 scoped 选择器一致的 `data-v-*` 字符串（供组件 `__scopeId`）
 * @param compileId 传给 compileScript / compileStyle 的 id
 */
function scopeIdAttrFromCompileId(compileId: string): string {
  const shortId = compileId.replace(/^data-v-/, '')
  return `data-v-${shortId}`
}

/**
 * script setup + inline模板时，编译结果不会带 __scopeId，scoped CSS 无法命中 DOM，需补全
 * @param code compileScript 输出
 * @param scopeIdAttr 例如 data-v-33d4cc19
 */
function injectVueScopeIdOption(code: string, scopeIdAttr: string): string {
  if (/\b__scopeId\s*:/.test(code)) return code
  const line = `  __scopeId: '${scopeIdAttr.replace(/'/g, "\\'")}',`
  const withName = code.replace(/(\n\s*__name:\s*['"][^'"]*['"],)/, `$1\n${line}`)
  if (withName !== code) return withName
  return code.replace(/(export default\s+\{)/, `$1\n${line}`)
}

/**
 * export default → __PAGE__，并注入 createApp + Element Plus 插件
 * 插件导入使用 ElementPlusPlugin，避免与 `@element-plus/icons-vue` 中的 `ElementPlus` 图标同名冲突
 * @param compiledJs compileScript 输出
 * @param options.scopeIdAttr 存在 scoped 样式时传入，与 compileStyle 的 data-v 一致
 */
function injectAppMount(compiledJs: string, options?: { scopeIdAttr?: string }): string {
  let code = compiledJs
  if (options?.scopeIdAttr) {
    code = injectVueScopeIdOption(code, options.scopeIdAttr)
  }
  code = code.replace(/export default\s+/m, 'const __PAGE__ = ')
  const importLines: string[] = []
  if (!/\bcreateApp\b/.test(code)) {
    importLines.push(`import { createApp } from 'vue'`)
  }
  /** 用户是否已默认导入 element-plus（任意绑定名） */
  const epDefault = code.match(/import\s+(\w+)\s+from\s+['"]element-plus['"]/)
  const epPluginId = epDefault ? epDefault[1] : 'ElementPlusPlugin'
  if (!epDefault) {
    importLines.push(`import ElementPlusPlugin from 'element-plus'`)
  }
  const head = importLines.length ? `${importLines.join('\n')}\n` : ''
  return `${head}${code}\ncreateApp(__PAGE__).use(${epPluginId}).mount('#app')\n`
}

/** Element Plus 样式（预览 iframe） */
const EP_CSS = 'https://cdn.jsdelivr.net/npm/element-plus@2.13.6/dist/index.css'
/** Element Plus 暗色 CSS 变量 */
const EP_DARK = 'https://cdn.jsdelivr.net/npm/element-plus@2.13.6/theme-chalk/dark/css-vars.css'
/**
 * 为不支持 import map 的浏览器提供垫片；须与 jsdelivr 上实际存在的版本对齐（旧版 1.14.1 已 404）
 * @see https://www.npmjs.com/package/es-module-shims
 */
const SHIMS = 'https://cdn.jsdelivr.net/npm/es-module-shims@2.8.0/dist/es-module-shims.js'

export interface PreviewBlob {
  url: string
  revoke: () => void
}

/**
 * 生成预览用 Blob URL
 * @param importMap import map 对象
 * @param moduleCode ESM 模块源码
 * @param compiledCss scoped 样式
 */
export function createPreviewBlobUrl(
  importMap: Record<string, unknown>,
  moduleCode: string,
  compiledCss: string,
): PreviewBlob {
  const safeMod = moduleCode.replace(/<\/script/gi, '<\\/script')
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script async src="${SHIMS}"></script>
  <script type="importmap">${JSON.stringify(importMap)}</script>
  <link rel="stylesheet" href="${EP_CSS}" />
  <link rel="stylesheet" href="${EP_DARK}" />
  <style>html,body{margin:0;} body{font-family:system-ui,sans-serif;padding:12px;} #app{min-height:120px;}</style>
  <style>${compiledCss}</style>
</head>
<body>
  <div id="app"></div>
  <script type="module">
${safeMod}
  </script>
</body>
</html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  }
}
