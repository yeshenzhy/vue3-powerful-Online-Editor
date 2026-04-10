/**
 * 将控制台参数格式化为单行文本
 * @param args 任意参数列表
 */
function formatArgs(args: unknown[]): string {
  return args
    .map((v) => {
      if (v === null) return 'null'
      if (v === undefined) return 'undefined'
      if (typeof v === 'object') {
        try {
          return JSON.stringify(v, null, 2)
        } catch {
          return String(v)
        }
      }
      return String(v)
    })
    .join(' ')
}

export interface RunJsResult {
  /** 捕获的 console 输出（多行） */
  lines: string[]
  /** 运行时异常信息 */
  error?: string
  /** 是否因超时被中断 */
  timedOut?: boolean
}

/**
 * 在浏览器中执行用户 JavaScript（注入受限 console，带超时）
 * @param code 源码
 * @param timeoutMs 超时毫秒
 */
export function runJavaScriptInBrowser(code: string, timeoutMs = 5000): Promise<RunJsResult> {
  const lines: string[] = []
  const push = (prefix: string, args: unknown[]) => {
    lines.push(prefix + formatArgs(args))
  }
  const fakeConsole = {
    log: (...a: unknown[]) => push('', a),
    info: (...a: unknown[]) => push('[info] ', a),
    warn: (...a: unknown[]) => push('[warn] ', a),
    error: (...a: unknown[]) => push('[error] ', a),
  }

  return new Promise((resolve) => {
    let finished = false
    const timer = window.setTimeout(() => {
      if (finished) return
      finished = true
      resolve({
        lines: [...lines, `（已中断：执行超过 ${timeoutMs}ms）`],
        timedOut: true,
      })
    }, timeoutMs)

    try {
      const fn = new Function('console', `"use strict";\n${code}`)
      fn(fakeConsole)
      if (!finished) {
        finished = true
        window.clearTimeout(timer)
        resolve({ lines })
      }
    } catch (e) {
      if (!finished) {
        finished = true
        window.clearTimeout(timer)
        resolve({
          lines,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
  })
}
