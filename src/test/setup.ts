import '@testing-library/jest-dom/vitest'
import {afterEach} from 'vitest'
import {cleanup} from '@testing-library/react'

if (typeof globalThis.localStorage === 'undefined') {
  class InMemoryStorage {
    private store = new Map<string, string>()
    get length() { return this.store.size }
    key(i: number) { return Array.from(this.store.keys())[i] ?? null }
    getItem(k: string) { return this.store.get(k) ?? null }
    setItem(k: string, v: string) { this.store.set(k, String(v)) }
    removeItem(k: string) { this.store.delete(k) }
    clear() { this.store.clear() }
  }
  const storage = new InMemoryStorage()
  Object.defineProperty(globalThis, 'localStorage', {value: storage, writable: true, configurable: true})
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {value: storage, writable: true, configurable: true})
  }
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
