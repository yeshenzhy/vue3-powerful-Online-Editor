import * as babel from 'prettier/plugins/babel'
import * as estree from 'prettier/plugins/estree'
import * as html from 'prettier/plugins/html'
import * as postcss from 'prettier/plugins/postcss'
import * as typescript from 'prettier/plugins/typescript'
import * as prettier from 'prettier/standalone'
import { parse, type SFCScriptBlock, type SFCStyleBlock, type SFCTemplateBlock } from 'vue/compiler-sfc'

const TS_LANGS = new Set(['ts', 'tsx', 'mts', 'cts'])

/**
 * 格式化 Import Map JSON（2 空格缩进）
 * @param raw JSON 字符串
 */
export async function formatImportMapJson(raw: string): Promise<string> {
  const data = JSON.parse(raw)
  return `${JSON.stringify(data, null, 2)}\n`
}

/**
 * 是否应使用 TypeScript 解析器格式化 script 内容
 */
function scriptUsesTsParser(block: SFCScriptBlock): boolean {
  const lang = block.lang || ''
  return TS_LANGS.has(lang)
}

/**
 * 格式化 script 块内文本
 */
async function formatScriptBody(content: string, useTs: boolean): Promise<string> {
  const trimmed = content.replace(/\s+$/u, '')
  if (useTs) {
    return (
      await prettier.format(trimmed, {
        parser: 'typescript',
        plugins: [estree, typescript],
      })
    ).trimEnd()
  }
  return (
    await prettier.format(trimmed, {
      parser: 'babel',
      plugins: [estree, babel],
    })
  ).trimEnd()
}

/** 拼 script / scriptSetup 开始标签属性 */
function scriptOpenTag(block: SFCScriptBlock): string {
  const parts: string[] = ['<script']
  if (block.setup) parts.push(' setup')
  if (block.lang) parts.push(` lang="${block.lang}"`)
  parts.push('>')
  return parts.join('')
}

/** 拼 style 开始标签 */
function styleOpenTag(block: SFCStyleBlock): string {
  const parts: string[] = ['<style']
  if (block.scoped) parts.push(' scoped')
  if (block.lang) parts.push(` lang="${block.lang}"`)
  parts.push('>')
  return parts.join('')
}

/** 拼 template 开始标签 */
function templateOpenTag(block: SFCTemplateBlock): string {
  return block.lang ? `<template lang="${block.lang}">` : '<template>'
}

/**
 * 将单文件 SFC 按块拆分后用 Prettier 格式化再拼回（不依赖已废弃的 prettier-plugin-vue）
 * @param source 完整 .vue 文本
 */
export async function formatVueSfc(source: string): Promise<string> {
  const { descriptor, errors } = parse(source, { filename: 'App.vue' })
  if (errors.length) {
    throw new Error(errors.map((e) => ('message' in e ? String(e.message) : String(e))).join('\n'))
  }
  if (descriptor.customBlocks?.length) {
    throw new Error('当前格式化暂不支持含自定义块（customBlocks）的 SFC')
  }

  const chunks: string[] = []

  if (descriptor.script && !descriptor.script.setup) {
    const b = descriptor.script
    const body = await formatScriptBody(b.content, scriptUsesTsParser(b))
    chunks.push(`${scriptOpenTag(b)}\n${body}\n</script>`)
  }

  if (descriptor.scriptSetup) {
    const b = descriptor.scriptSetup
    const body = await formatScriptBody(b.content, scriptUsesTsParser(b))
    chunks.push(`${scriptOpenTag(b)}\n${body}\n</script>`)
  }

  if (descriptor.template) {
    const t = descriptor.template
    const inner = (
      await prettier.format(t.content.trim(), {
        parser: 'html',
        plugins: [html],
      })
    ).trimEnd()
    chunks.push(`${templateOpenTag(t)}\n${inner}\n</template>`)
  }

  for (const s of descriptor.styles) {
    const inner = (
      await prettier.format(s.content.replace(/\s+$/u, ''), {
        parser: 'css',
        plugins: [postcss],
      })
    ).trimEnd()
    chunks.push(`${styleOpenTag(s)}\n${inner}\n</style>`)
  }

  return `${chunks.join('\n\n')}\n`
}
