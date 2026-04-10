import type { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: { body: { username?: string; password?: string } }) => {
      const username = body.username || 'guest'
      return {
        code: 0,
        data: {
          token: `mock-token-${username}`,
          username,
        },
        message: '登录成功',
      }
    },
  },
] as MockMethod[]
