import type { MockMethod } from 'vite-plugin-mock'

/** mock 内存用户 */
interface UserRow {
  id: number
  name: string
  role: string
}

/** mock 内存角色 */
interface RoleRow {
  id: number
  name: string
  code: string
}

let users: UserRow[] = [
  { id: 1, name: '张三', role: '管理员' },
  { id: 2, name: '李四', role: '运营' },
  { id: 3, name: '王五', role: '客服' },
]
let nextUserId = 4

let roles: RoleRow[] = [
  { id: 1, name: '超级管理员', code: 'admin' },
  { id: 2, name: '运营', code: 'ops' },
  { id: 3, name: '客服', code: 'cs' },
]
let nextRoleId = 4

const activities: { time: string; text: string }[] = []

/**
 * 记录工作台动态（仅 mock 内存）
 * @param text 描述
 */
function logActivity(text: string) {
  activities.unshift({
    time: new Date().toLocaleString('zh-CN'),
    text,
  })
  if (activities.length > 30) activities.pop()
}

/**
 * 从请求 path 解析末尾数字 id
 * @param url 原始 url（可含 query）
 * @param base 前缀，如 /api/system/users
 */
function tailId(url: string | undefined, base: string): number | null {
  if (!url) return null
  const path = url.split('?')[0] ?? ''
  const esc = base.replace(/\//g, '\\/')
  const m = path.match(new RegExp(`${esc}\\/(\\d+)$`))
  return m ? Number(m[1]) : null
}

export default [
  {
    url: '/api/dashboard/stats',
    method: 'get',
    response: () => ({
      code: 0,
      data: {
        userCount: users.length,
        roleCount: roles.length,
        updatedAt: new Date().toLocaleString('zh-CN'),
      },
      message: 'ok',
    }),
  },
  {
    url: '/api/dashboard/activities',
    method: 'get',
    response: () => ({
      code: 0,
      data: [...activities],
      message: 'ok',
    }),
  },
  {
    url: '/api/system/users/batch',
    method: 'post',
    response: ({ body }: { body: { ids?: number[]; role?: string } }) => {
      const ids = body.ids ?? []
      const role = body.role?.trim()
      if (!ids.length) {
        return { code: 400, data: null, message: '请选择用户' }
      }
      if (!role) {
        return { code: 400, data: null, message: '请选择角色' }
      }
      ids.forEach((id) => {
        const u = users.find((x) => x.id === id)
        if (u) u.role = role
      })
      logActivity(`批量修改 ${ids.length} 名用户角色为「${role}」`)
      return { code: 0, data: [...users], message: '已批量更新' }
    },
  },
  {
    url: '/api/system/users/delete-batch',
    method: 'post',
    response: ({ body }: { body: { ids?: number[] } }) => {
      const ids = new Set(body.ids ?? [])
      if (!ids.size) {
        return { code: 400, data: null, message: '请选择要删除的用户' }
      }
      const before = users.length
      users = users.filter((u) => !ids.has(u.id))
      logActivity(`批量删除用户 ${before - users.length} 人`)
      return { code: 0, data: [...users], message: '已删除' }
    },
  },
  {
    url: '/api/system/users',
    method: 'get',
    response: () => ({
      code: 0,
      data: [...users],
      message: 'ok',
    }),
  },
  {
    url: '/api/system/users',
    method: 'post',
    response: ({ body }: { body: { name?: string; role?: string } }) => {
      const name = body.name?.trim()
      const role = body.role?.trim()
      if (!name || !role) {
        return { code: 400, data: null, message: '姓名与角色不能为空' }
      }
      const row: UserRow = { id: nextUserId++, name, role }
      users.push(row)
      logActivity(`新增用户「${name}」`)
      return { code: 0, data: row, message: '创建成功' }
    },
  },
  {
    url: '/api/system/users/:id',
    method: 'put',
    response: ({
      url,
      body,
    }: {
      url?: string
      body: { name?: string; role?: string }
    }) => {
      const id = tailId(url, '/api/system/users')
      if (id == null) return { code: 400, data: null, message: '无效 ID' }
      const u = users.find((x) => x.id === id)
      if (!u) return { code: 404, data: null, message: '用户不存在' }
      const name = body.name?.trim()
      const role = body.role?.trim()
      if (name) u.name = name
      if (role) u.role = role
      logActivity(`编辑用户 #${id}「${u.name}」`)
      return { code: 0, data: { ...u }, message: '已保存' }
    },
  },
  {
    url: '/api/system/users/:id',
    method: 'delete',
    response: ({ url }: { url?: string }) => {
      const id = tailId(url, '/api/system/users')
      if (id == null) return { code: 400, data: null, message: '无效 ID' }
      const idx = users.findIndex((x) => x.id === id)
      if (idx === -1) return { code: 404, data: null, message: '用户不存在' }
      const [removed] = users.splice(idx, 1)
      logActivity(`删除用户「${removed.name}」`)
      return { code: 0, data: [...users], message: '已删除' }
    },
  },
  {
    url: '/api/system/roles',
    method: 'get',
    response: () => ({
      code: 0,
      data: [...roles],
      message: 'ok',
    }),
  },
  {
    url: '/api/system/roles',
    method: 'post',
    response: ({ body }: { body: { name?: string; code?: string } }) => {
      const name = body.name?.trim()
      const code = body.code?.trim()
      if (!name || !code) {
        return { code: 400, data: null, message: '名称与编码不能为空' }
      }
      if (roles.some((r) => r.code === code)) {
        return { code: 400, data: null, message: '编码已存在' }
      }
      const row: RoleRow = { id: nextRoleId++, name, code }
      roles.push(row)
      logActivity(`新增角色「${name}」(${code})`)
      return { code: 0, data: row, message: '创建成功' }
    },
  },
  {
    url: '/api/system/roles/:id',
    method: 'put',
    response: ({
      url,
      body,
    }: {
      url?: string
      body: { name?: string; code?: string }
    }) => {
      const id = tailId(url, '/api/system/roles')
      if (id == null) return { code: 400, data: null, message: '无效 ID' }
      const r = roles.find((x) => x.id === id)
      if (!r) return { code: 404, data: null, message: '角色不存在' }
      const name = body.name?.trim()
      const code = body.code?.trim()
      if (name) r.name = name
      if (code) {
        if (roles.some((x) => x.code === code && x.id !== id)) {
          return { code: 400, data: null, message: '编码已存在' }
        }
        r.code = code
      }
      logActivity(`编辑角色 #${id}「${r.name}」`)
      return { code: 0, data: { ...r }, message: '已保存' }
    },
  },
  {
    url: '/api/system/roles/:id',
    method: 'delete',
    response: ({ url }: { url?: string }) => {
      const id = tailId(url, '/api/system/roles')
      if (id == null) return { code: 400, data: null, message: '无效 ID' }
      const idx = roles.findIndex((x) => x.id === id)
      if (idx === -1) return { code: 404, data: null, message: '角色不存在' }
      const [removed] = roles.splice(idx, 1)
      logActivity(`删除角色「${removed.name}」`)
      return { code: 0, data: [...roles], message: '已删除' }
    },
  },
] as MockMethod[]
