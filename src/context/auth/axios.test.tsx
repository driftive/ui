import {describe, it, expect, vi, beforeEach} from 'vitest'
import {renderHook} from '@testing-library/react'
import type {ReactNode} from 'react'
import useAxios from './axios'
import {AuthProvider} from './provider'

describe('useAxios 401 handler', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const wrapper = ({children}: {children: ReactNode}) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('clears authState and redirects to /login on a 401 response', async () => {
    localStorage.setItem('authState', JSON.stringify({isAuthenticated: true, token: 'tkn'}))
    const assign = vi.fn()
    vi.stubGlobal('location', {assign})

    const {result} = renderHook(() => useAxios(), {wrapper})
    // `handlers` is an axios runtime internal not exposed in the public types.
    const handlers = (result.current.interceptors.response as unknown as {
      handlers: Array<{rejected?: (err: unknown) => unknown}>
    }).handlers
    const rejected = handlers[0].rejected!

    await expect(rejected({response: {status: 401}})).rejects.toBeDefined()

    expect(localStorage.getItem('authState')).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')

    vi.unstubAllGlobals()
  })

  it('passes through non-401 errors without touching auth state', async () => {
    localStorage.setItem('authState', JSON.stringify({isAuthenticated: true, token: 'tkn'}))
    const assign = vi.fn()
    vi.stubGlobal('location', {assign})

    const {result} = renderHook(() => useAxios(), {wrapper})
    // `handlers` is an axios runtime internal not exposed in the public types.
    const handlers = (result.current.interceptors.response as unknown as {
      handlers: Array<{rejected?: (err: unknown) => unknown}>
    }).handlers
    const rejected = handlers[0].rejected!

    await expect(rejected({response: {status: 500}})).rejects.toBeDefined()

    expect(localStorage.getItem('authState')).not.toBeNull()
    expect(assign).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
