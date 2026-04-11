import { autocompletion, completionKeymap, type Completion, type CompletionContext } from '@codemirror/autocomplete'
import { cssCompletionSource } from '@codemirror/lang-css'
import { html, htmlCompletionSourceWith } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { localCompletionSource } from '@codemirror/lang-javascript'
import { sass, sassCompletionSource, sassLanguage } from '@codemirror/lang-sass'
import { keymap } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

/** 缩进语法 Sass（style 标签 `lang="sass"`）嵌套解析用 */
const sassIndentedParser = sassLanguage.configure({ dialect: 'indented' }).parser

/**
 * 带 Vue SFC 场景的 HTML：为 `lang="scss"` / `lang="sass"` 的 style 挂载 Lezer 解析，避免整段样式被当成纯文本单色显示
 */
const sfcHtmlBase = html({
  nestedLanguages: [
    {
      tag: 'style',
      attrs: (attrs) => attrs.lang === 'scss',
      parser: sassLanguage.parser,
    },
    {
      tag: 'style',
      attrs: (attrs) => attrs.lang === 'sass',
      parser: sassIndentedParser,
    },
  ],
})

/** 模板标签/属性补全（与 lang-html 默认一致） */
const sfcHtmlCompletion = htmlCompletionSourceWith({})

/** Vue 3组合式 API 与常用运行时 */
const VUE_COMPOSITION: Completion[] = [
  { label: 'ref', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'reactive', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'readonly', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'computed', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'watch', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'watchEffect', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'watchPostEffect', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'watchSyncEffect', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onMounted', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onUnmounted', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onBeforeMount', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onBeforeUnmount', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onUpdated', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onBeforeUpdate', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onErrorCaptured', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onActivated', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onDeactivated', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'onServerPrefetch', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'provide', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'inject', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'nextTick', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'defineProps', detail: '宏', type: 'keyword', section: 'Vue 3' },
  { label: 'defineEmits', detail: '宏', type: 'keyword', section: 'Vue 3' },
  { label: 'defineExpose', detail: '宏', type: 'keyword', section: 'Vue 3' },
  { label: 'defineModel', detail: '宏', type: 'keyword', section: 'Vue 3' },
  { label: 'defineOptions', detail: '宏', type: 'keyword', section: 'Vue 3' },
  { label: 'defineSlots', detail: '宏', type: 'keyword', section: 'Vue 3' },
  { label: 'withDefaults', detail: '宏', type: 'keyword', section: 'Vue 3' },
  { label: 'useAttrs', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'useSlots', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'useCssModule', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'useCssVars', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'useTemplateRef', detail: 'Vue 3.5+', type: 'function', section: 'Vue 3' },
  { label: 'shallowRef', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'triggerRef', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'customRef', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'shallowReactive', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'shallowReadonly', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'toRef', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'toRefs', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'toValue', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'unref', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'isRef', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'isReactive', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'isReadonly', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'isProxy', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'markRaw', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'effectScope', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'getCurrentInstance', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'getCurrentScope', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'h', detail: '渲染函数', type: 'function', section: 'Vue 3' },
  { label: 'createApp', detail: 'Vue', type: 'function', section: 'Vue 3' },
  { label: 'version', detail: 'Vue', type: 'property', section: 'Vue 3' },
]

/** 模板指令与 SFC 标签 */
const VUE_TEMPLATE: Completion[] = [
  { label: 'v-if', detail: '条件渲染', type: 'keyword', section: '模板' },
  { label: 'v-else-if', detail: '条件渲染', type: 'keyword', section: '模板' },
  { label: 'v-else', detail: '条件渲染', type: 'keyword', section: '模板' },
  { label: 'v-for', detail: '列表', type: 'keyword', section: '模板' },
  { label: 'v-model', detail: '双向绑定', type: 'keyword', section: '模板' },
  { label: 'v-bind', detail: '简写 :', type: 'keyword', section: '模板' },
  { label: 'v-on', detail: '简写 @', type: 'keyword', section: '模板' },
  { label: 'v-show', detail: '显示/隐藏', type: 'keyword', section: '模板' },
  { label: 'v-slot', detail: '简写 #', type: 'keyword', section: '模板' },
  { label: 'v-html', detail: 'HTML', type: 'keyword', section: '模板' },
  { label: 'v-text', detail: '文本', type: 'keyword', section: '模板' },
  { label: 'v-once', detail: '只渲染一次', type: 'keyword', section: '模板' },
  { label: 'v-memo', detail: '性能', type: 'keyword', section: '模板' },
  { label: 'template', detail: 'SFC / 片段', type: 'type', section: '模板' },
  { label: 'script', detail: 'SFC', type: 'type', section: '模板' },
  { label: 'style', detail: 'SFC', type: 'type', section: '模板' },
  { label: 'scoped', detail: 'style 属性', type: 'property', section: '模板' },
  { label: 'setup', detail: 'script 属性', type: 'property', section: '模板' },
  { label: 'lang', detail: 'script/style', type: 'property', section: '模板' },
]

/** Element Plus：模板中常用 kebab-case 标签 */
const EP_TAGS: Completion[] = [
  'el-affix',
  'el-alert',
  'el-anchor',
  'el-anchor-link',
  'el-aside',
  'el-autocomplete',
  'el-avatar',
  'el-backtop',
  'el-badge',
  'el-breadcrumb',
  'el-breadcrumb-item',
  'el-button',
  'el-button-group',
  'el-calendar',
  'el-card',
  'el-carousel',
  'el-carousel-item',
  'el-cascader',
  'el-cascader-panel',
  'el-checkbox',
  'el-checkbox-button',
  'el-checkbox-group',
  'el-col',
  'el-collapse',
  'el-collapse-item',
  'el-color-picker',
  'el-config-provider',
  'el-container',
  'el-date-picker',
  'el-descriptions',
  'el-descriptions-item',
  'el-dialog',
  'el-divider',
  'el-drawer',
  'el-dropdown',
  'el-dropdown-item',
  'el-dropdown-menu',
  'el-empty',
  'el-footer',
  'el-form',
  'el-form-item',
  'el-header',
  'el-icon',
  'el-image',
  'el-image-viewer',
  'el-input',
  'el-input-number',
  'el-input-tag',
  'el-link',
  'el-main',
  'el-menu',
  'el-menu-item',
  'el-sub-menu',
  'el-page-header',
  'el-pagination',
  'el-popconfirm',
  'el-popover',
  'el-progress',
  'el-radio',
  'el-radio-button',
  'el-radio-group',
  'el-rate',
  'el-result',
  'el-row',
  'el-scrollbar',
  'el-select',
  'el-option',
  'el-option-group',
  'el-select-v2',
  'el-skeleton',
  'el-slider',
  'el-space',
  'el-statistic',
  'el-step',
  'el-steps',
  'el-switch',
  'el-table',
  'el-table-column',
  'el-tab-pane',
  'el-tabs',
  'el-tag',
  'el-text',
  'el-time-picker',
  'el-time-select',
  'el-timeline',
  'el-timeline-item',
  'el-tooltip',
  'el-transfer',
  'el-tree',
  'el-tree-select',
  'el-upload',
  'el-watermark',
  'el-segmented',
  'el-mention',
].map((label) => ({ label, detail: 'Element Plus', type: 'type' as const, section: 'Element Plus' }))

/** script 中常用 PascalCase / 服务 */
const EP_SCRIPT: Completion[] = [
  { label: 'ElMessage', detail: 'element-plus', type: 'variable', section: 'Element Plus' },
  { label: 'ElMessageBox', detail: 'element-plus', type: 'variable', section: 'Element Plus' },
  { label: 'ElNotification', detail: 'element-plus', type: 'variable', section: 'Element Plus' },
  { label: 'ElLoading', detail: 'element-plus', type: 'variable', section: 'Element Plus' },
]

/** 原生 JS：全局、内置对象静态方法、常用实例方法名（浏览器 + ES标准） */
const JS_GLOBALS: Completion[] = [
  { label: 'globalThis', detail: '全局对象', type: 'variable', section: 'JavaScript' },
  { label: 'window', detail: '浏览器', type: 'variable', section: 'JavaScript' },
  { label: 'document', detail: '浏览器 DOM', type: 'variable', section: 'JavaScript' },
  { label: 'console', detail: '控制台', type: 'namespace', section: 'JavaScript' },
  { label: 'undefined', detail: '原始值', type: 'constant', section: 'JavaScript' },
  { label: 'NaN', detail: '非数字', type: 'constant', section: 'JavaScript' },
  { label: 'Infinity', detail: '无穷', type: 'constant', section: 'JavaScript' },
  { label: 'Object', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Array', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'String', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Number', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Boolean', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Symbol', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'BigInt', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Function', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Date', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'RegExp', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Math', detail: '命名空间', type: 'namespace', section: 'JavaScript' },
  { label: 'JSON', detail: '命名空间', type: 'namespace', section: 'JavaScript' },
  { label: 'Promise', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Map', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Set', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'WeakMap', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'WeakSet', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Proxy', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Reflect', detail: '命名空间', type: 'namespace', section: 'JavaScript' },
  { label: 'Intl', detail: '国际化', type: 'namespace', section: 'JavaScript' },
  { label: 'ArrayBuffer', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'DataView', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'URL', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'URLSearchParams', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'TextEncoder', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'TextDecoder', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'AbortController', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'AbortSignal', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'Error', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'TypeError', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'ReferenceError', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'SyntaxError', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'RangeError', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'URIError', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'AggregateError', detail: '构造函数', type: 'class', section: 'JavaScript' },
  { label: 'parseInt', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'parseFloat', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'isNaN', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'isFinite', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'decodeURI', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'decodeURIComponent', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'encodeURI', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'encodeURIComponent', detail: '全局函数', type: 'function', section: 'JavaScript' },
  { label: 'setTimeout', detail: '定时器', type: 'function', section: 'JavaScript' },
  { label: 'clearTimeout', detail: '定时器', type: 'function', section: 'JavaScript' },
  { label: 'setInterval', detail: '定时器', type: 'function', section: 'JavaScript' },
  { label: 'clearInterval', detail: '定时器', type: 'function', section: 'JavaScript' },
  { label: 'queueMicrotask', detail: '微任务', type: 'function', section: 'JavaScript' },
  { label: 'structuredClone', detail: '深拷贝', type: 'function', section: 'JavaScript' },
  { label: 'fetch', detail: '网络请求', type: 'function', section: 'JavaScript' },
  { label: 'requestAnimationFrame', detail: '动画帧', type: 'function', section: 'JavaScript' },
  { label: 'cancelAnimationFrame', detail: '动画帧', type: 'function', section: 'JavaScript' },
]

const OBJECT_STATIC = [
  'assign',
  'create',
  'defineProperty',
  'defineProperties',
  'entries',
  'freeze',
  'fromEntries',
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'getOwnPropertyNames',
  'getOwnPropertySymbols',
  'getPrototypeOf',
  'setPrototypeOf',
  'hasOwn',
  'is',
  'isExtensible',
  'isFrozen',
  'isSealed',
  'keys',
  'preventExtensions',
  'seal',
  'values',
].map((m) => ({ label: `Object.${m}`, detail: 'Object', type: 'method' as const, section: 'JavaScript' }))

const ARRAY_STATIC = ['from', 'isArray', 'of'].map((m) => ({
  label: `Array.${m}`,
  detail: 'Array',
  type: 'method' as const,
  section: 'JavaScript',
}))

const MATH_STATIC = [
  'abs',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atan2',
  'atanh',
  'cbrt',
  'ceil',
  'clz32',
  'cos',
  'cosh',
  'exp',
  'expm1',
  'floor',
  'fround',
  'hypot',
  'imul',
  'log',
  'log10',
  'log1p',
  'log2',
  'max',
  'min',
  'pow',
  'random',
  'round',
  'sign',
  'sin',
  'sinh',
  'sqrt',
  'tan',
  'tanh',
  'trunc',
  'E',
  'LN2',
  'LN10',
  'LOG2E',
  'LOG10E',
  'PI',
  'SQRT1_2',
  'SQRT2',
].map((m) => ({ label: `Math.${m}`, detail: 'Math', type: 'property' as const, section: 'JavaScript' }))

const JSON_STATIC = ['parse', 'stringify'].map((m) => ({
  label: `JSON.${m}`,
  detail: 'JSON',
  type: 'method' as const,
  section: 'JavaScript',
}))

const PROMISE_STATIC = ['all', 'allSettled', 'any', 'race', 'resolve', 'reject'].map((m) => ({
  label: `Promise.${m}`,
  detail: 'Promise',
  type: 'method' as const,
  section: 'JavaScript',
}))

const CONSOLE_METHODS = ['log', 'error', 'warn', 'info', 'debug', 'dir', 'table', 'trace', 'time', 'timeEnd', 'timeLog', 'group', 'groupCollapsed', 'groupEnd', 'assert', 'clear', 'count', 'countReset', 'profile', 'profileEnd'].map(
  (m) => ({ label: `console.${m}`, detail: 'console', type: 'method' as const, section: 'JavaScript' }),
)

/** 常见数组 / 字符串实例方法（写链式时可直接选） */
const ARRAY_PROTO = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'slice',
  'concat',
  'join',
  'reverse',
  'sort',
  'fill',
  'copyWithin',
  'flat',
  'flatMap',
  'forEach',
  'map',
  'filter',
  'reduce',
  'reduceRight',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'some',
  'every',
  'includes',
  'indexOf',
  'lastIndexOf',
  'at',
  'keys',
  'values',
  'entries',
].map((m) => ({ label: m, detail: 'Array 实例', type: 'method' as const, section: 'JavaScript' }))

const STRING_PROTO = [
  'charAt',
  'charCodeAt',
  'codePointAt',
  'concat',
  'endsWith',
  'includes',
  'indexOf',
  'lastIndexOf',
  'localeCompare',
  'match',
  'matchAll',
  'padEnd',
  'padStart',
  'repeat',
  'replace',
  'replaceAll',
  'search',
  'slice',
  'split',
  'startsWith',
  'substring',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'trimStart',
  'trimEnd',
  'normalize',
].map((m) => ({ label: m, detail: 'String 实例', type: 'method' as const, section: 'JavaScript' }))

const NUMBER_STATIC = ['isFinite', 'isInteger', 'isNaN', 'isSafeInteger', 'parseFloat', 'parseInt', 'EPSILON', 'MAX_SAFE_INTEGER', 'MIN_SAFE_INTEGER', 'MAX_VALUE', 'MIN_VALUE', 'NaN'].map((m) => ({
  label: `Number.${m}`,
  detail: 'Number',
  type: 'property' as const,
  section: 'JavaScript',
}))

const DATE_STATIC = ['now', 'parse', 'UTC'].map((m) => ({
  label: `Date.${m}`,
  detail: 'Date',
  type: 'method' as const,
  section: 'JavaScript',
}))

const DATE_PROTO = [
  'getTime',
  'getFullYear',
  'getMonth',
  'getDate',
  'getDay',
  'getHours',
  'getMinutes',
  'getSeconds',
  'setTime',
  'setFullYear',
  'setMonth',
  'setDate',
  'setHours',
  'setMinutes',
  'setSeconds',
  'toISOString',
  'toJSON',
  'toDateString',
  'toLocaleString',
  'toLocaleDateString',
].map((m) => ({ label: m, detail: 'Date 实例', type: 'method' as const, section: 'JavaScript' }))

const REFLECT_STATIC = ['get', 'set', 'has', 'deleteProperty', 'apply', 'construct', 'getOwnPropertyDescriptor', 'defineProperty', 'ownKeys', 'preventExtensions', 'setPrototypeOf', 'isExtensible', 'getPrototypeOf'].map(
  (m) => ({ label: `Reflect.${m}`, detail: 'Reflect', type: 'method' as const, section: 'JavaScript' }),
)

const JS_NATIVE: Completion[] = [
  ...JS_GLOBALS,
  ...OBJECT_STATIC,
  ...ARRAY_STATIC,
  ...MATH_STATIC,
  ...JSON_STATIC,
  ...PROMISE_STATIC,
  ...CONSOLE_METHODS,
  ...NUMBER_STATIC,
  ...ARRAY_PROTO,
  ...STRING_PROTO,
  ...DATE_STATIC,
  ...DATE_PROTO,
  ...REFLECT_STATIC,
]

const SFC_ALL: Completion[] = [...VUE_COMPOSITION, ...VUE_TEMPLATE, ...EP_TAGS, ...EP_SCRIPT, ...JS_NATIVE]

/** Import Map JSON 常用键与包名 */
const IMPORT_MAP_COMPLETIONS: Completion[] = [
  { label: '"imports"', detail: 'import map 根字段', type: 'property', section: 'JSON' },
  { label: '"scopes"', detail: 'import map', type: 'property', section: 'JSON' },
  { label: '"vue"', detail: '包名', type: 'namespace', section: '依赖' },
  { label: '"element-plus"', detail: '包名', type: 'namespace', section: '依赖' },
  { label: '"@element-plus/icons-vue"', detail: '包名', type: 'namespace', section: '依赖' },
  { label: '"@vue/shared"', detail: '包名', type: 'namespace', section: '依赖' },
  { label: '"element-plus/"', detail: '子路径映射', type: 'namespace', section: '依赖' },
  { label: '"lodash"', detail: '建议 jsdelivr lodash-es +esm', type: 'namespace', section: '依赖' },
  { label: '"lodash-es"', detail: 'ESM 版 lodash', type: 'namespace', section: '依赖' },
]

/** 支持 Object.keys、console.log 等带点补全 */
function matchSfcWord(context: CompletionContext) {
  return context.matchBefore(/[\w$.-]*/)
}

/**
 * SFC 全文关键字补全（接近 VS Code 列表提示；非语言服务级类型推断）
 */
function sfcCompletionSource(context: CompletionContext) {
  const word = matchSfcWord(context)
  if (!word) return null
  if (word.from === word.to && !context.explicit) return null
  return {
    from: word.from,
    options: SFC_ALL,
    validFor: /^[\w$.-]*$/,
  }
}

/**
 * 聚合补全：style 内走 CSS/SCSS 语言服务，script 走 JS/本地符号，其余再走 HTML 与 Vue/EP 词表（override 会替换默认源，须显式串联）
 */
function sfcAggregatedCompletionSource(context: CompletionContext) {
  return (
    cssCompletionSource(context) ??
    sassCompletionSource(context) ??
    localCompletionSource(context) ??
    sfcHtmlCompletion(context) ??
    sfcCompletionSource(context)
  )
}

function importMapCompletionSource(context: CompletionContext) {
  const word = context.matchBefore(/[\w"-]*/)
  if (!word) return null
  if (word.from === word.to && !context.explicit) return null
  return {
    from: word.from,
    options: IMPORT_MAP_COMPLETIONS,
    validFor: /^[\w"-]*$/,
  }
}

/**
 * App.vue 编辑区扩展：HTML高亮 + 自动补全
 */
export function buildSfcCodemirrorExtensions(theme: Extension): Extension[] {
  return [
    sfcHtmlBase,
    sass(),
    autocompletion({
      override: [sfcAggregatedCompletionSource],
      maxRenderedOptions: 140,
      activateOnTyping: true,
      defaultKeymap: true,
    }),
    keymap.of(completionKeymap),
    theme,
  ]
}

/**
 * Import Map 编辑区扩展
 */
export function buildImportMapCodemirrorExtensions(theme: Extension): Extension[] {
  return [
    json(),
    autocompletion({
      override: [importMapCompletionSource],
      maxRenderedOptions: 40,
      activateOnTyping: true,
      defaultKeymap: true,
    }),
    keymap.of(completionKeymap),
    theme,
  ]
}
