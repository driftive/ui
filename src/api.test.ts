import {describe, it, expect, beforeEach} from 'vitest'
import {api} from './api'

type RequestHandlers = Array<{
  fulfilled: (config: {headers: Record<string, string>}) => {headers: Record<string, string>} | Promise<{headers: Record<string, string>}>
}>

const requestHandlers = (api.interceptors.request as unknown as {handlers: RequestHandlers}).handlers

describe('api axios instance', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('attaches Bearer token from localStorage to outgoing requests', async () => {
    localStorage.setItem('authToken', 'test-jwt-token')
    const config = await requestHandlers[0].fulfilled({headers: {}})
    expect(config.headers['Authorization']).toBe('Bearer test-jwt-token')
  })

  it('omits the Authorization header when no token is present', async () => {
    const config = await requestHandlers[0].fulfilled({headers: {}})
    expect(config.headers['Authorization']).toBeUndefined()
  })
})
